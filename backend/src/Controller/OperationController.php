<?php

namespace App\Controller;

use App\Entity\Operation;
use App\Entity\Justificatif; // <--- Import Ajouté
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
        \App\Repository\CaisseRepository $caisseRepo
    ): JsonResponse
    {
        $user = $this->getUser();

        if ($this->isGranted('ROLE_MANAGER')) {
            $operations = $operationRepository->findLatest(20);
        } else {
            $caisse = $caisseRepo->findOneBy(['employeAssigne' => $user]);
            if (!$caisse) return $this->json([]);
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

        // --- GESTION DU JUSTIFICATIF (AJOUT) ---
        $this->processJustificatif($op, $data, $em);
        // ---------------------------------------

        // --- MISE A JOUR SOLDE ---
        $caisse = $session->getCaisse();
        $nouveauSolde = (float)$caisse->getSolde() + (float)$data['montant'];
        $caisse->setSolde((string)$nouveauSolde);
        $em->persist($caisse);
        // -------------------------

        $em->flush();

        return $this->json([
            'message' => 'Encaissement enregistré !',
            'nouveau_solde' => $nouveauSolde
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

        // Vérif solde session
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
        $seuilAuto = 50000.0; // J'ai remis 50000 par défaut (valeur réaliste CFA), adapte si besoin
        $isManager = in_array('ROLE_MANAGER', $user->getRoles());

        if ($isManager || $montant <= $seuilAuto) {
            $op->setStatut(Operation::STATUT_VALIDEE);
            $msg = "Décaissement validé.";
            
            // MAJ Solde Caisse
            $caisse = $session->getCaisse();
            $nouveauSolde = (float)$caisse->getSolde() - $montant;
            $caisse->setSolde((string)$nouveauSolde);
            $em->persist($caisse);

        } else {
            $op->setStatut(Operation::STATUT_EN_ATTENTE);
            $msg = "Montant élevé : En attente de validation.";
        }

        $em->persist($op);

        // --- GESTION DU JUSTIFICATIF (AJOUT) ---
        // On enregistre le justif même si l'opération est en attente (la preuve est fournie)
        $this->processJustificatif($op, $data, $em);
        // ---------------------------------------

        $em->flush();

        return $this->json([
            'message' => $msg,
            'statut' => $op->getStatut(),
            'id' => $op->getId()
        ], 201);
    }

    /**
     * Méthode privée pour gérer la création du justificatif (Bon Interne)
     */
    private function processJustificatif(Operation $op, array $data, EntityManagerInterface $em): void
    {
        // On vérifie si le frontend a envoyé le flag 'is_bon_interne'
        if (isset($data['is_bon_interne']) && $data['is_bon_interne'] === true) {
            
            $justificatif = new Justificatif();
            
            // IMPORTANT : C'est le Justificatif qui porte la relation vers l'Opération
            $justificatif->setOperation($op);
            
            // On définit le type (Assure-toi que la constante ou le string correspond à ton entité)
            $justificatif->setType('BON_INTERNE'); 

            // 1. Les détails du bon (Tableau JSON : Article, Qté, Prix...)
            if (!empty($data['details'])) {
                $justificatif->setContenuJson($data['details']);
            }

            // 2. La signature (Base64)
            if (!empty($data['signature'])) {
                $justificatif->setSignatureData($data['signature']);
            }
            
            // 3. Le bénéficiaire (On l'ajoute dans le JSON pour regrouper les infos)
            if (!empty($data['beneficiaire'])) {
                $content = $justificatif->getContenuJson() ?? [];
                $content['beneficiaire_nom'] = $data['beneficiaire'];
                $justificatif->setContenuJson($content);
            }

            $em->persist($justificatif);
        }
    }
}