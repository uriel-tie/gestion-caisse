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
        \App\Repository\CaisseRepository $caisseRepo,
        Request $request 
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

            // Préparation des données du justificatif
            $justifData = null;
            $justif = $op->getJustificatif();
            
            if ($justif) {
                $justifData = [
                    'type' => $justif->getType(),
                    'contenu' => $justif->getContenuJson(),
                    'signature' => $justif->getSignatureData(),
                    'url' => $justif->getChemin() ? $request->getSchemeAndHttpHost() . '/' . $justif->getChemin() : null, 
                ];
            }

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
                'justificatif' => $justifData, 
            ];
        }

        return $this->json($data);
    }

    // AJOUT : Route pour attacher un justificatif après coup
    #[Route('/{id}/attach-justificatif', name: 'attach_justificatif', methods: ['POST'])]
    public function attachJustificatif(
        Operation $operation,
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse
    {
        // 1. Vérifier si un justificatif existe déjà
        if ($operation->getJustificatif()) {
            return $this->json(['error' => 'Cette opération possède déjà un justificatif.'], 400);
        }

        // 2. Récupérer les données (Base64)
        $data = json_decode($request->getContent(), true);

        if (empty($data['fichier_data']) || empty($data['fichier_nom'])) {
            return $this->json(['error' => 'Fichier manquant ou invalide.'], 400);
        }

        try {
            // 3. Réutiliser la logique de création (ou la refaire ici pour isoler)
            $this->processJustificatif($operation, $data, $em);
            
            $em->flush(); // Important : On sauvegarde en base

            return $this->json(['message' => 'Justificatif ajouté avec succès !']);

        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/encaissement', name: 'encaissement', methods: ['POST'])]
    public function createEncaissement(
        Request $request, 
        EntityManagerInterface $em, 
        ModePaiementRepository $modeRepo,
        SessionCaisseRepository $sessionRepo
    ): JsonResponse
    {
        $caisse = $session->getCaisse();
        $compteCaisse = $caisse->getCompteComptable();
        $numeroCompte = $compteCaisse ? $compteCaisse->getNumero() : '530';
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
        $op->setCompteComptable($numeroCompte);
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

        $compteId = $data['compte_id'] ?? null;
        $numeroCompte = '606';

        if ($compteId) {
            $compteChoisi = $compteRepo->find($compteId);
            if ($compteChoisi) {
                $numeroCompte = $compteChoisi->getNumero();
            }
        }
        
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
        $op->setCompteComptable($numeroCompte);
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
     * Méthode privée pour gérer la création du justificatif (Bon Interne OU Fichier Externe)
     */
    private function processJustificatif(Operation $op, array $data, EntityManagerInterface $em): void
    {
        $justificatif = new Justificatif();
        $hasJustif = false;

        // CAS 1 : BON INTERNE (Signature + Détails)
        if (isset($data['is_bon_interne']) && $data['is_bon_interne'] === true) {
            $justificatif->setType('BON_INTERNE');
            
            if (!empty($data['details'])) {
                $justificatif->setContenuJson($data['details']);
            }
            if (!empty($data['signature'])) {
                $justificatif->setSignatureData($data['signature']);
            }
            // Ajout du bénéficiaire dans le JSON
            if (!empty($data['beneficiaire'])) {
                $content = $justificatif->getContenuJson() ?? [];
                $content['beneficiaire_nom'] = $data['beneficiaire'];
                $justificatif->setContenuJson($content);
            }
            $hasJustif = true;
        }
        
        // CAS 2 : FICHIER EXTERNE (Upload Base64)
        elseif (!empty($data['fichier_data']) && !empty($data['fichier_nom'])) {
            $justificatif->setType('FICHIER');

            // 1. Décoder le Base64
            // Le format est souvent "data:image/png;base64,VBORw0KGgo..."
            $parts = explode(',', $data['fichier_data']);
            $base64Content = count($parts) > 1 ? $parts[1] : $parts[0];
            $fileData = base64_decode($base64Content);

            if ($fileData === false) {
                throw new \Exception("Impossible de décoder le fichier.");
            }

            // 2. Générer un nom unique sécurisé
            $extension = pathinfo($data['fichier_nom'], PATHINFO_EXTENSION);
            $newFilename = uniqid('justif_') . '.' . $extension;

            // 3. Sauvegarder le fichier (Dossier public/uploads/justificatifs)
            // Assure-toi que ce dossier existe et est accessible en écriture !
            $targetDir = $this->getParameter('kernel.project_dir') . '/public/uploads/justificatifs';
            if (!is_dir($targetDir)) {
                mkdir($targetDir, 0777, true);
            }
            
            file_put_contents($targetDir . '/' . $newFilename, $fileData);

            // 4. Mettre à jour l'entité
            $justificatif->setFichier($data['fichier_nom']); // Nom original
            $justificatif->setChemin('uploads/justificatifs/' . $newFilename); // Chemin relatif pour l'accès web
            
            $hasJustif = true;
        }

        // Si on a créé un justificatif, on le lie et on persiste
        if ($hasJustif) {
            $justificatif->setOperation($op);
            $em->persist($justificatif);
        }
    }
}