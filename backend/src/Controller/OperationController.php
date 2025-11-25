<?php

namespace App\Controller;

use App\Entity\Operation;
use App\Entity\ModePaiement;
use App\Repository\ModePaiementRepository;
use App\Repository\OperationRepository;
use App\Repository\SessionCaisseRepository; // <--- NOUVEAU
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/operations', name: 'api_operations_')]
class OperationController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function index(OperationRepository $operationRepository): JsonResponse
    {
        // TODO: Plus tard, il faudra filtrer par la session active ou la caisse
        $operations = $operationRepository->findLatest(20);

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
        SessionCaisseRepository $sessionRepo // <--- Injection
    ): JsonResponse
    {
        $user = $this->getUser();
        
        // 1. VÉRIFICATION CRITIQUE : A-t-il une session ouverte ?
        $session = $sessionRepo->findSessionActive($user);
        
        if (!$session) {
            return $this->json(['error' => 'Aucune session de caisse ouverte. Veuillez ouvrir votre caisse.'], 403);
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
        
        // 2. LIAISON OBLIGATOIRE
        $op->setSessionCaisse($session);

        $em->persist($op);
        $em->flush();

        return $this->json([
            'message' => 'Encaissement enregistré !',
            'nouveau_solde' => 'Calculé au prochain appel...' 
        ], 201);
    }

    #[Route('/decaissement', name: 'create_decaissement', methods: ['POST'])]
    public function createDecaissement(
        Request $request, 
        EntityManagerInterface $em, 
        ModePaiementRepository $modeRepo,
        OperationRepository $opRepo,
        SessionCaisseRepository $sessionRepo // <--- Injection
    ): JsonResponse
    {
        $user = $this->getUser();

        // 1. VÉRIFICATION SESSION
        $session = $sessionRepo->findSessionActive($user);
        if (!$session) {
            return $this->json(['error' => 'Aucune session de caisse ouverte.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $montant = (float) ($data['montant'] ?? 0);

        if ($montant <= 0) return $this->json(['error' => 'Montant invalide'], 400);

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
        $op->setSessionCaisse($session); // <--- LIAISON

        // Validation conditionnelle
        $seuilAuto = 50.0; 
        $isManager = in_array('ROLE_MANAGER', $user->getRoles());

        if ($isManager || $montant <= $seuilAuto) {
            $op->setStatut(Operation::STATUT_VALIDEE);
            $msg = "Décaissement validé.";
        } else {
            $op->setStatut(Operation::STATUT_EN_ATTENTE);
            $msg = "Montant élevé : En attente de validation.";
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