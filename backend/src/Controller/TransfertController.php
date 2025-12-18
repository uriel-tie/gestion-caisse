<?php

namespace App\Controller;

use App\Entity\Transfert;
use App\Entity\Operation;
use App\Entity\Caisse;
use App\Entity\SessionCaisse;
use App\Entity\Utilisateur;
use App\Entity\ModePaiement;
use App\Repository\CaisseRepository;
use App\Repository\TransfertRepository;
use App\Repository\SessionCaisseRepository;
use App\Repository\ModePaiementRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/transferts', name: 'api_transferts_')]
class TransfertController extends AbstractController
{
    /**
     * 1. ÉMISSION : Créer une demande de transfert (Débit immédiat de la source)
     */
    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        SessionCaisseRepository $sessionRepo,
        CaisseRepository $caisseRepo,
        ModePaiementRepository $modeRepo
    ): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        // 1. Vérifier session ouverte (Source)
        $sessionSource = $sessionRepo->findOneBy(['caissier' => $user, 'statut' => SessionCaisse::STATUT_OUVERTE]);
        if (!$sessionSource) return $this->json(['error' => 'Votre caisse est fermée.'], 403);

        $caisseSource = $sessionSource->getCaisse();
        $montant = (float)($data['montant'] ?? 0);
        $targetCaisseId = $data['target_caisse_id'] ?? null;

        if ($montant <= 0) return $this->json(['error' => 'Montant invalide.'], 400);
        if ($montant > $caisseSource->getSolde()) return $this->json(['error' => 'Solde insuffisant pour le transfert.'], 400);

        $caisseCible = $caisseRepo->find($targetCaisseId);
        if (!$caisseCible) return $this->json(['error' => 'Caisse de destination introuvable.'], 404);
        if ($caisseCible->getId() === $caisseSource->getId()) return $this->json(['error' => 'Transfert vers soi-même impossible.'], 400);

        // 2. Créer l'objet Transfert
        $transfert = new Transfert();
        $transfert->setMontant((string)$montant);
        $transfert->setCaisseDepart($caisseSource);
        $transfert->setCaisseArrivee($caisseCible);
        $transfert->setEmetteur($user);
        $transfert->setMotif($data['motif'] ?? 'Transfert de fonds');
        
        // 3. Créer l\'Opération de DEBIT sur la source (Immédiat)
        $opDebit = new Operation();
        $opDebit->setType('TRANSFERT_SORTANT');
        $opDebit->setMontant((string)$montant);
        $opDebit->setDate(new \DateTimeImmutable());
        $opDebit->setUtilisateur($user);
        $opDebit->setSessionCaisse($sessionSource);
        $opDebit->setMotif("Transfert vers " . $caisseCible->getNom());
        $opDebit->setStatut(Operation::STATUT_VALIDEE);
        // Mode interne
        $mode = $modeRepo->findOneBy(['libelle' => 'Espèces']) ?? $modeRepo->findAll()[0];
        $opDebit->setModePaiement($mode);

        // Mise à jour Solde Source
        $caisseSource->setSolde((string)($caisseSource->getSolde() - $montant));

        $em->persist($transfert);
        $em->persist($opDebit);
        $em->persist($caisseSource);
        $em->flush();

        return $this->json(['message' => 'Transfert initié. En attente de validation par le destinataire.', 'id' => $transfert->getId()]);
    }

    /**
     * 2. LISTE : Voir les transferts entrants en attente
     */
    #[Route('/incoming', name: 'incoming', methods: ['GET'])]
    public function listIncoming(
        EntityManagerInterface $em,
        SessionCaisseRepository $sessionRepo
    ): JsonResponse
    {
        $user = $this->getUser();
        // On récupère la caisse de l'utilisateur connecté
        $session = $sessionRepo->findOneBy(['caissier' => $user, 'statut' => SessionCaisse::STATUT_OUVERTE]);
        
        // Si pas de session, on regarde si manager ou admin pour voir tout (optionnel)
        // Ici on suppose qu'il faut une caisse ouverte pour recevoir
        if (!$session) return $this->json([]);

        $maCaisse = $session->getCaisse();

        $transferts = $em->getRepository(Transfert::class)->findBy([
            'caisseArrivee' => $maCaisse,
            'statut' => Transfert::STATUT_EN_ATTENTE
        ], ['dateCreation' => 'DESC']);

        $data = [];
        foreach ($transferts as $t) {
            $data[] = [
                'id' => $t->getId(),
                'montant' => $t->getMontant(),
                'date' => $t->getDateCreation()->format('d/m/Y H:i'),
                'source' => $t->getCaisseDepart()->getNom(),
                'emetteur' => $t->getEmetteur()->getNom(),
                'motif' => $t->getMotif()
            ];
        }

        return $this->json($data);
    }

    /**
     * 3. ACCEPTATION : Valider la réception (Crédit Cible)
     */
    #[Route('/{id}/accept', name: 'accept', methods: ['POST'])]
    public function accept(
        Transfert $transfert,
        EntityManagerInterface $em,
        SessionCaisseRepository $sessionRepo,
        ModePaiementRepository $modeRepo
    ): JsonResponse
    {
        $user = $this->getUser();
        $session = $sessionRepo->findOneBy(['caissier' => $user, 'statut' => SessionCaisse::STATUT_OUVERTE]);

        if ($transfert->getStatut() !== Transfert::STATUT_EN_ATTENTE) {
            return $this->json(['error' => 'Ce transfert n\'est plus en attente.'], 400);
        }

        // Vérifier que c'est bien ma caisse
        if (!$session || $session->getCaisse()->getId() !== $transfert->getCaisseArrivee()->getId()) {
            return $this->json(['error' => 'Vous n\'êtes pas sur la caisse destinataire.'], 403);
        }

        // 1. Mise à jour Transfert
        $transfert->setStatut(Transfert::STATUT_VALIDE);
        $transfert->setDateValidation(new \DateTimeImmutable());
        $transfert->setReceveur($user);

        // 2. Création Opération CREDIT sur Cible
        $opCredit = new Operation();
        $opCredit->setType('TRANSFERT_ENTRANT');
        $opCredit->setMontant($transfert->getMontant());
        $opCredit->setDate(new \DateTimeImmutable());
        $opCredit->setUtilisateur($user);
        $opCredit->setSessionCaisse($session);
        $opCredit->setMotif("Réception transfert de " . $transfert->getCaisseDepart()->getNom());
        $opCredit->setStatut(Operation::STATUT_VALIDEE);
        
        $mode = $modeRepo->findOneBy(['libelle' => 'Espèces']) ?? $modeRepo->findAll()[0];
        $opCredit->setModePaiement($mode);

        // 3. Mise à jour Solde Cible
        $caisseCible = $session->getCaisse();
        $caisseCible->setSolde((string)($caisseCible->getSolde() + (float)$transfert->getMontant()));

        $em->persist($transfert);
        $em->persist($opCredit);
        $em->persist($caisseCible);
        $em->flush();

        return $this->json(['message' => 'Transfert accepté et caisse créditée.']);
    }

    /**
     * 4. REJET : Refuser la réception (Retour à l'envoyeur)
     */
    #[Route('/{id}/reject', name: 'reject', methods: ['POST'])]
    public function reject(
        Transfert $transfert,
        Request $request,
        EntityManagerInterface $em,
        SessionCaisseRepository $sessionRepo,
        ModePaiementRepository $modeRepo
    ): JsonResponse
    {
        $user = $this->getUser();
        $session = $sessionRepo->findOneBy(['caissier' => $user, 'statut' => SessionCaisse::STATUT_OUVERTE]);

        if ($transfert->getStatut() !== Transfert::STATUT_EN_ATTENTE) {
            return $this->json(['error' => 'Ce transfert n\'est plus en attente.'], 400);
        }

        // Vérifier que c'est bien le destinataire qui refuse
        if (!$session || $session->getCaisse()->getId() !== $transfert->getCaisseArrivee()->getId()) {
            return $this->json(['error' => 'Action non autorisée.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $motifRejet = $data['motif'] ?? 'Refusé par le destinataire';

        // 1. Mise à jour Transfert
        $transfert->setStatut(Transfert::STATUT_REJETE);
        $transfert->setDateValidation(new \DateTimeImmutable());
        $transfert->setReceveur($user); // Celui qui a refusé
        // On concatène le motif de refus
        $transfert->setMotif($transfert->getMotif() . " [REFUS: $motifRejet]");

        // 2. RETOUR A L'ENVOYEUR (Crédit Caisse Départ)
        $caisseDepart = $transfert->getCaisseDepart();
        $caisseDepart->setSolde((string)($caisseDepart->getSolde() + (float)$transfert->getMontant()));

        // 3. Création Opération ANNULATION sur Caisse Départ
        // On essaie de retrouver la session active de l'expéditeur, sinon on prend la dernière
        $sessionDepart = $sessionRepo->findOneBy(['caisse' => $caisseDepart, 'statut' => SessionCaisse::STATUT_OUVERTE]);
        
        // Si l'expéditeur est fermé, on rattachera l'opération à sa prochaine ouverture ou on laisse null (selon ta contrainte SQL)
        // Ici, pour simplifier, si pas de session ouverte, on ne crée pas l'opération mais on a crédité la caisse (le solde est juste).
        // Mieux : On crée l'opération quand même si possible pour l'historique.
        
        if ($sessionDepart) {
            $opAnnul = new Operation();
            $opAnnul->setType('TRANSFERT_RETOUR');
            $opAnnul->setMontant($transfert->getMontant());
            $opAnnul->setDate(new \DateTimeImmutable());
            $opAnnul->setUtilisateur($transfert->getEmetteur()); // On remet au nom de l'émetteur
            $opAnnul->setSessionCaisse($sessionDepart);
            $opAnnul->setMotif("Retour transfert refusé par " . $user->getNom());
            $opAnnul->setStatut(Operation::STATUT_VALIDEE);
            
            $mode = $modeRepo->findOneBy(['libelle' => 'Espèces']) ?? $modeRepo->findAll()[0];
            $opAnnul->setModePaiement($mode);
            
            $em->persist($opAnnul);
        }

        $em->persist($transfert);
        $em->persist($caisseDepart);
        $em->flush();

        return $this->json(['message' => 'Transfert refusé. Les fonds sont retournés à l\'expéditeur.']);
    }
}