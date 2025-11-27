<?php

namespace App\Controller;

use App\Entity\Operation;
use App\Entity\ModePaiement;
use App\Repository\ModePaiementRepository;
use App\Repository\OperationRepository;
use App\Repository\SessionCaisseRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/operations', name: 'api_operations_')]
class OperationController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function index(
        OperationRepository $operationRepository, 
        \App\Repository\CaisseRepository $caisseRepo // <--- Ajout de l'injection
    ): JsonResponse
    {
        $user = $this->getUser();

        // CAS 1 : MANAGER -> Il voit tout (comme avant)
        if ($this->isGranted('ROLE_MANAGER')) {
            $operations = $operationRepository->findLatest(20);
        } 
        // CAS 2 : CAISSIER -> Il ne voit que SA caisse assignée
        else {
            // On trouve la caisse assignée à l'utilisateur
            $caisse = $caisseRepo->findOneBy(['employeAssigne' => $user]);
            
            if (!$caisse) {
                // Si pas de caisse assignée, il ne voit rien
                return $this->json([]);
            }
            // On filtre sur cette caisse uniquement
            $operations = $operationRepository->findLatestByCaisse($caisse, 20);
        }

        $data = [];
        foreach ($operations as $op) {
            $sessionCaisse = $op->getSessionCaisse();
            $caisse = $sessionCaisse ? $sessionCaisse->getCaisse() : null;
            $nomCaisse = $caisse ? $caisse->getNom() : 'N/A';

            $data[] = [
                'id' => $op->getId(),
                'type' => $op->getType(),
                'montant' => (float) $op->getMontant(),
                'date' => $op->getDate()->format('d/m/Y H:i'),
                'statut' => $op->getStatut(),
                'mode' => $op->getModePaiement() ? $op->getModePaiement()->getLibelle() : 'N/A',
                'utilisateur' => $op->getUtilisateur() ? $op->getUtilisateur()->getNom() : 'Inconnu',
                'motif' => $op->getMotif() ?? 'Non précisé',
                'caisse' => $nomCaisse,
            ];
        }

        return $this->json($data);
    }

    #[Route('/encaissement', name: 'encaissement', methods: ['POST'])]
    public function createEncaissement(
        Request $request, 
        EntityManagerInterface $em, 
        ModePaiementRepository $modeRepo,
        SessionCaisseRepository $sessionRepo
    ): JsonResponse
    {
        $user = $this->getUser();
        $session = $sessionRepo->findSessionActive($user);
        
        if (!$session) {
            return $this->json(['error' => 'Aucune session de caisse ouverte.'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['montant']) || $data['montant'] <= 0) {
            return $this->json(['error' => 'Montant invalide'], 400);
        }

        $mode = $modeRepo->findOneBy(['libelle' => $data['mode'] ?? 'Espèces']);
        if (!$mode) $mode = $modeRepo->findAll()[0] ?? null;

        $op = new Operation();
        $op->setType('ENCAISSEMENT');
        $op->setMontant((string)$data['montant']);
        $op->setDate(new \DateTimeImmutable());
        $op->setStatut(Operation::STATUT_VALIDEE);
        $op->setCompteComptable('530');
        $op->setMotif($data['motif'] ?? 'Encaissement divers');
        
        $op->setUtilisateur($user);
        $op->setModePaiement($mode);
        $op->setSessionCaisse($session);

        $em->persist($op);

        // --- MISE A JOUR DU SOLDE CAISSE (AJOUT) ---
        $caisse = $session->getCaisse();
        $nouveauSolde = (float)$caisse->getSolde() + (float)$data['montant'];
        $caisse->setSolde((string)$nouveauSolde);
        $em->persist($caisse);
        // -------------------------------------------

        $em->flush();

        return $this->json([
            'message' => 'Encaissement enregistré !',
            'nouveau_solde' => $nouveauSolde // On renvoie le vrai nouveau solde
        ], 201);
    }

    #[Route('/decaissement', name: 'create_decaissement', methods: ['POST'])]
    public function createDecaissement(
        Request $request, 
        EntityManagerInterface $em, 
        ModePaiementRepository $modeRepo,
        OperationRepository $opRepo,
        SessionCaisseRepository $sessionRepo
    ): JsonResponse
    {
        $user = $this->getUser();
        $session = $sessionRepo->findSessionActive($user);
        
        if (!$session) {
            return $this->json(['error' => 'Aucune session de caisse ouverte.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $montant = (float) ($data['montant'] ?? 0);

        if ($montant <= 0) return $this->json(['error' => 'Montant invalide'], 400);

        // Vérification du solde de la session avant de continuer
        $soldeSession = (float) $session->getMontantOuverture() + $opRepo->getSoldeMouvementsSession($session);
        if ($montant > $soldeSession) {
            return $this->json([
                'error' => 'Solde insuffisant pour réaliser ce décaissement.',
                'solde_disponible' => $soldeSession
            ], 400);
        }
        
        $mode = $modeRepo->findOneBy(['libelle' => $data['mode'] ?? 'Espèces']);
        if (!$mode) $mode = $modeRepo->findAll()[0] ?? null;

        $op = new Operation();
        $op->setType('DECAISSEMENT');
        $op->setMontant((string)$montant);
        $op->setDate(new \DateTimeImmutable());
        $op->setCompteComptable('606');
        $op->setUtilisateur($user);
        $op->setModePaiement($mode);
        $op->setMotif($data['motif'] ?? 'Décaissement divers');
        $op->setSessionCaisse($session);

        // Validation conditionnelle
        $seuilAuto = 50.0; 
        $isManager = in_array('ROLE_MANAGER', $user->getRoles());

        if ($isManager || $montant <= $seuilAuto) {
            $op->setStatut(Operation::STATUT_VALIDEE);
            $msg = "Décaissement validé.";
            
            // --- MISE A JOUR DU SOLDE CAISSE (SOUSTRACTION) ---
            // On ne touche au solde que si c'est validé !
            $caisse = $session->getCaisse();
            $nouveauSolde = (float)$caisse->getSolde() - $montant;
            $caisse->setSolde((string)$nouveauSolde);
            $em->persist($caisse);
            // --------------------------------------------------

        } else {
            $op->setStatut(Operation::STATUT_EN_ATTENTE);
            $msg = "Montant élevé : En attente de validation.";
            // On ne touche PAS au solde ici
        }

        $em->persist($op);
        $em->flush();

        return $this->json([
            'message' => $msg,
            'statut' => $op->getStatut(),
            'id' => $op->getId()
        ], 201);
    }
}