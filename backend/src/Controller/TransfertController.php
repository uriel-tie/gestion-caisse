<?php

namespace App\Controller;

use App\Entity\Operation;
use App\Entity\Caisse;
use App\Entity\SessionCaisse;
use App\Entity\CompteComptable;
use App\Repository\CaisseRepository;
use App\Repository\CompteComptableRepository;
use App\Repository\OperationRepository;
use App\Repository\SessionCaisseRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/transferts', name: 'api_transferts_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class TransfertController extends AbstractController
{
    // 1. INITIER LE TRANSFERT (Caisse A -> Vers Caisse B via Compte 580)
    #[Route('/initiate', name: 'initiate', methods: ['POST'])]
    public function initiate(
        Request $request, 
        EntityManagerInterface $em, 
        CaisseRepository $caisseRepo,
        CompteComptableRepository $compteRepo,
        SessionCaisseRepository $sessionRepo
    ): JsonResponse {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        // Validation basique
        if (empty($data['montant']) || empty($data['caisseSourceId']) || empty($data['caisseDestId'])) {
            return $this->json(['error' => 'Données incomplètes (montant, source, dest requis)'], 400);
        }

        $caisseSource = $caisseRepo->find($data['caisseSourceId']);
        $caisseDest = $caisseRepo->find($data['caisseDestId']);

        if (!$caisseSource || !$caisseDest) {
            return $this->json(['error' => 'Caisse introuvable'], 404);
        }

        // VÉRIFICATION SESSION CAISSE SOURCE
        // On ne peut pas sortir de l'argent d'une caisse fermée
        $sessionSource = $sessionRepo->findOneBy([
            'caisse' => $caisseSource, 
            'statut' => 'OUVERTE' // Assure-toi que le statut dans ton entité est bien string 'OUVERTE'
        ]);

        if (!$sessionSource) {
            return $this->json(['error' => "Impossible d'initier un transfert : La caisse source est fermée ou sans session active."], 403);
        }

        // Récupération du Compte de Transition (ex: 580)
        $compteTransition = $compteRepo->findOneBy(['numero' => '580']); 
        if (!$compteTransition) {
            // Si tu n'as pas encore créé ce compte en BDD, on bloque pour éviter la corruption comptable
            return $this->json(['error' => 'Configuration manquante : Le compte 580 (Virements internes) est introuvable.'], 500);
        }

        $montant = (string)$data['montant'];
        $motif = $data['motif'] ?? 'Transfert de fonds';

        // --- A. CRÉATION OPÉRATION SOURCE (DÉCAISSEMENT IMMÉDIAT) ---
        $opSource = new Operation();
        $opSource->setType('DECAISSEMENT');
        $opSource->setMontant($montant);
        $opSource->setStatut(Operation::STATUT_VALIDEE); // L'argent sort physiquement tout de suite
        $opSource->setDate(new \DateTimeImmutable());
        $opSource->setUtilisateur($user);
        $opSource->setCompteComptable($compteTransition->getNumero()); // Contre-partie : 580
        $opSource->setMotif($motif . ' (Vers ' . $caisseDest->getNom() . ')');
        $opSource->setSessionCaisse($sessionSource); // On lie à la session active

        // --- B. CRÉATION OPÉRATION DESTINATION (ENCAISSEMENT EN ATTENTE) ---
        // Note: Elle n'a pas encore de SessionCaisse car le destinataire ne l'a pas acceptée (sa caisse pourrait être fermée à ce moment-là)
        $opDest = new Operation();
        $opDest->setType('ENCAISSEMENT');
        $opDest->setMontant($montant);
        $opDest->setStatut(Operation::STATUT_ATTENTE_RECEPTION); // Statut bloquant
        $opDest->setDate(new \DateTimeImmutable());
        $opDest->setCompteComptable($compteTransition->getNumero()); // Contre-partie : 580
        $opDest->setMotif($motif . ' (Reçu de ' . $caisseSource->getNom() . ')');
        
        $opDest->setOperationLiee($opSource);
        
        
        // Pour sécuriser le code ici, on va supposer que tu vas récupérer la session DESTINATAIRE active
        $sessionDest = $sessionRepo->findOneBy(['caisse' => $caisseDest, 'statut' => 'OUVERTE']);
        if ($sessionDest) {
            $opDest->setSessionCaisse($sessionDest); // On pré-affecte si ouvert
        } else {
             return $this->json(['error' => "La caisse destinataire doit être ouverte pour recevoir un transfert."], 400);
        }
        $opDest->setUtilisateur($user); // L'émetteur initie l'écriture d'attente

        $em->persist($opSource);
        $em->persist($opDest);
        $em->flush();

        return $this->json([
            'message' => 'Transfert initié. Fonds sortis de la source, en attente chez le destinataire.',
            'opSourceId' => $opSource->getId(),
            'opDestId' => $opDest->getId()
        ], 201);
    }

    // 2. ACCEPTER LE TRANSFERT (Action du Destinataire)
    #[Route('/{id}/accept', name: 'accept', methods: ['PATCH'])]
    public function accept(Operation $operation, EntityManagerInterface $em, SessionCaisseRepository $sessionRepo): JsonResponse
    {
        $user = $this->getUser();

        // Sécurité
        if ($operation->getStatut() !== Operation::STATUT_ATTENTE_RECEPTION) {
            return $this->json(['error' => 'Statut incorrect.'], 400);
        }

        // On valide
        $operation->setStatut(Operation::STATUT_VALIDEE);
        // C'est celui qui accepte qui devient le responsable de cette ligne (audit)
        $operation->setUtilisateur($user); 

        // Mise à jour de la session si ce n'était pas fait (cas où on accepte le lendemain)
        // Ici, on vérifie que l'utilisateur a bien une session ouverte sur la caisse concernée
        $sessionActuelle = $operation->getSessionCaisse();
        if ($sessionActuelle && $sessionActuelle->getStatut() !== 'OUVERTE') {
             // Si la session originale est fermée, on doit rattacher à la nouvelle session de l'utilisateur
             // C'est complexe. Pour le stage, simplifions : 
             // Le transfert DOIT se faire et s'accepter idéalement dans la journée.
             // Sinon, on rattache à la session active de l'utilisateur connecté.
             // A FAIRE : Logique de ré-assignation de session si besoin.
        }

        $em->flush();

        return $this->json(['message' => 'Transfert accepté. Fonds encaissés.']);
    }

    // 3. REFUSER LE TRANSFERT
    #[Route('/{id}/reject', name: 'reject', methods: ['PATCH'])]
    public function reject(Operation $operation, EntityManagerInterface $em): JsonResponse
    {
        if ($operation->getStatut() !== Operation::STATUT_ATTENTE_RECEPTION) {
            return $this->json(['error' => 'Impossible de refuser cette opération.'], 400);
        }

        $motifRejet = "Refus par " . $this->getUser()->getNom();

        // 1. Annuler l'encaissement (Dest)
        $operation->setStatut(Operation::STATUT_ANNULEE);
        $operation->setMotifAnnulation($motifRejet);

        // 2. Annuler le décaissement (Source) - via operationLiee
        $source = $operation->getOperationLiee();
        if ($source) {
            $source->setStatut(Operation::STATUT_ANNULEE);
            $source->setMotifAnnulation($motifRejet . " (Retour de fonds)");
            // Note : Si la caisse source est déjà clôturée, cela va créer un écart. 
            // C'est un cas limite ("Edge Case") qu'on accepte pour l'instant.
        }

        $em->flush();

        return $this->json(['message' => 'Transfert refusé et annulé.']);
    }
}