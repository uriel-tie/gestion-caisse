<?php

namespace App\Controller;

use App\Entity\Operation;
use App\Entity\Justificatif; 
use App\Entity\ModePaiement;
use App\Repository\ModePaiementRepository;
use App\Repository\OperationRepository;
use App\Repository\SessionCaisseRepository;
use App\Repository\CompteComptableRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\Notification;
use App\Repository\UtilisateurRepository;
use App\Repository\DemandeRepository;
use App\Entity\Demande;

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
        
        // Récupération des paramètres d'URL
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', 30); // 30 par défaut pour la page dédiée, 10 pour le dashboard
        
        $filters = [
            'type' => $request->query->get('type'),         
            'date_debut' => $request->query->get('date_debut'),
            'date_fin' => $request->query->get('date_fin'),
            'mode' => $request->query->get('mode'),       
            'statut' => $request->query->get('statut'),
            'compte' => $request->query->get('compte'),
        ];  

        // Sécurité : Caisse restreinte ou non
        $caisseRestrict = null;
        if (!$this->isGranted('ROLE_MANAGER')) {
            $caisseRestrict = $caisseRepo->findOneBy(['employeAssigne' => $user]);
            if (!$caisseRestrict) return $this->json([]);
        }

        // Appel au Repository
        $paginator = $operationRepository->findWithFilters($filters, $page, $limit, $caisseRestrict);
        
        // On calcule le total pour savoir combien de pages afficher
        $totalItems = count($paginator);
        $totalPages = ceil($totalItems / $limit);

        $data = [];
        foreach ($paginator as $op) {
            // ... (Ici, garde ton code de mapping existant : $justifData, etc.) ...
            // COPIE-COLLE TA BOUCLE FOREACH EXISTANTE ICI
             $sessionCaisse = $op->getSessionCaisse();
             $caisse = $sessionCaisse ? $sessionCaisse->getCaisse() : null;
             $nomCaisse = $caisse ? $caisse->getNom() : 'N/A';
             
             // ... logique justificatif ...

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
                'estDemandeAnnulation' => $op->isEstDemandeAnnulation(),
                
             ];
        }

        return $this->json([
            'data' => $data,
            'meta' => [
                'currentPage' => $page,
                'itemsPerPage' => $limit,
                'totalItems' => $totalItems,
                'totalPages' => $totalPages
            ]
        ]);
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

        $user = $this->getUser();
        $session = $sessionRepo->findSessionActive($user);
        
        if (!$session) {
            return $this->json(['error' => 'Aucune session de caisse ouverte.'], 403);
        }

        $caisse = $session->getCaisse();
        $compteCaisse = $caisse->getCompteComptable();
        $numeroCompte = $compteCaisse ? $compteCaisse->getNumero() : '530';
        

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
        SessionCaisseRepository $sessionRepo,
        CompteComptableRepository $compteRepo, 
        UtilisateurRepository $userRepo,
        DemandeRepository $demandeRepo // <--- AJOUT ICI
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

        // --- GESTION DU LIEN AVEC LA DEMANDE ---
        $demande = null;
        if (!empty($data['demande_id'])) {
            $demande = $demandeRepo->find($data['demande_id']);
            
            if ($demande) {
                // SÉCURITÉ 1 : On ne peut payer que ce qui est validé
                if ($demande->getStatut() !== Demande::STATUT_VALIDEE) {
                    return $this->json(['error' => 'Cette demande n\'est pas au statut "Validée à Payer". Statut actuel : ' . $demande->getStatut()], 400);
                }
                
                // SÉCURITÉ 2 : On vérifie que le montant correspond (Optionnel mais recommandé)
                // Ici on autorise une marge ou on force le montant exact ? 
                // Pour l'instant on fait confiance au caissier, mais on pourrait bloquer si écart trop grand.
            }
        }
        // ---------------------------------------

        // --- VERIFICATION SOLDE REEL (CAISSE) ---
        $caisse = $session->getCaisse();
        $soldeReel = (float)$caisse->getSolde();

        if ($montant > $soldeReel) {
            return $this->json([
                'error' => 'Solde insuffisant en caisse (' . number_format($soldeReel, 0, ',', ' ') . ' F) pour ce décaissement.',
                'solde_disponible' => $soldeReel
            ], 400);
        }

        // Gestion Compte Comptable
        $compteId = $data['compte_id'] ?? null;
        $numeroCompte = '606'; 
        if ($compteId) {
            $compte = $compteRepo->find($compteId);
            if ($compte) $numeroCompte = $compte->getNumero();
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

        // Validation Seuil Manager
        $seuilCaisse = (float) ($caisse->getSeuilDecaissement() ?? 50000);
        $isManager = in_array('ROLE_MANAGER', $user->getRoles());

        // Si c'est lié à une demande validée, on force la validation (car le circuit a déjà été respecté)
        $isDemandeValidee = ($demande !== null);

        if ($isManager || $isDemandeValidee || $montant <= $seuilCaisse) {
            $op->setStatut(Operation::STATUT_VALIDEE);
            $msg = "Décaissement validé.";
            
            // DÉBIT IMMÉDIAT DU SOLDE
            $caisse->setSolde((string)($soldeReel - $montant));
            $em->persist($caisse);

            // --- CLÔTURE DE LA DEMANDE ---
            if ($demande) {
                $demande->setStatut(Demande::STATUT_PAYEE);
                $demande->setOperation($op); // On lie l'opération à la demande
                $demande->setCaissierTraitant($user);
                $em->persist($demande);
                $msg = "Demande payée et clôturée avec succès.";
            }
            // -----------------------------

        } else {
            $op->setStatut(Operation::STATUT_EN_ATTENTE);
            $msg = "En attente de validation (Montant > " . $seuilCaisse . ")";
            // Logique de notification ici...
        }

        $em->persist($op);
        $this->processJustificatif($op, $data, $em);
        $em->flush();

        return $this->json(['message' => $msg, 'statut' => $op->getStatut(), 'id' => $op->getId()], 201);
    }

    #[Route('/me', name: 'my_operations', methods: ['GET'])]
    public function myOperations(OperationRepository $opRepo): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        
        // On récupère les 10 dernières opérations effectuées par l'utilisateur connecté
        $operations = $opRepo->findBy(
            ['utilisateur' => $user],
            ['date' => 'DESC'],
            10 // Limite
        );

        $data = [];
        foreach ($operations as $op) {
            $data[] = [
                'id' => $op->getId(),
                'type' => $op->getType(),
                'montant' => (float)$op->getMontant(),
                'date' => $op->getDate()->format('Y-m-d H:i:s'),
                'motif' => $op->getMotif(),
                'statut' => $op->getStatut()
            ];
        }

        return $this->json($data);
    }

    // 1. Récupérer les opérations en attente
    #[Route('/to-validate', name: 'list_to_validate', methods: ['GET'])]
    public function listToValidate(OperationRepository $opRepo): JsonResponse
    {
        // Sécurité : Seul un manager peut voir ça
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        // On cherche toutes les opérations "EN_ATTENTE"
        // Idéalement, triées par date (les plus anciennes en premier ou l'inverse)
        $operations = $opRepo->findBy(
            ['statut' => Operation::STATUT_EN_ATTENTE], 
            ['date' => 'DESC']
        );

        $data = [];
        foreach ($operations as $op) {
            $user = $op->getUtilisateur();
            $data[] = [
                'id' => $op->getId(),
                'type' => $op->getType(),
                'montant' => (float)$op->getMontant(),
                'motif' => $op->getMotif(),
                'date' => $op->getDate()->format('d/m/Y H:i'),
                'caissier' => $user ? $user->getNom() : 'Inconnu',
                'service' => ($user && $user->getService()) ? $user->getService()->getNom() : 'N/A',
                // On peut ajouter le justificatif si on veut permettre au manager de vérifier la pièce
                'has_justificatif' => $op->getJustificatif() !== null
            ];
        }

        return $this->json($data);
    }

    // 2. Valider ou Refuser l'opération
    #[Route('/{id}/workflow', name: 'workflow', methods: ['PATCH'])]
    public function workflow(
        Operation $operation, 
        Request $request, 
        EntityManagerInterface $em
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $data = json_decode($request->getContent(), true);
        $action = $data['action'] ?? null;

        if ($operation->getStatut() !== Operation::STATUT_EN_ATTENTE) {
            return $this->json(['error' => 'Cette opération n\'est pas en attente.'], 400);
        }

        if ($action === 'valider') {
            // A. Changement de statut
            $operation->setStatut(Operation::STATUT_VALIDEE);

            // B. IMPACT SUR LE SOLDE (CRITIQUE !)
            // Puisque l'opération était en attente, l'argent n'avait pas encore été déduit/ajouté.
            $session = $operation->getSessionCaisse();
            if ($session) {
                $caisse = $session->getCaisse();
                $montant = (float) $operation->getMontant();

                if ($operation->getType() === 'DECAISSEMENT') {
                    // On vérifie s'il y a assez d'argent maintenant
                    if ($caisse->getSolde() < $montant) {
                        return $this->json(['error' => 'Solde de caisse insuffisant pour valider ce décaissement.'], 400);
                    }
                    $caisse->setSolde((string)($caisse->getSolde() - $montant));
                } 
                elseif ($operation->getType() === 'ENCAISSEMENT') {
                    // Rare qu'un encaissement soit en attente, mais on gère le cas
                    $caisse->setSolde((string)($caisse->getSolde() + $montant));
                }
                
                $em->persist($caisse);
            }

        } elseif ($action === 'refuser') {
            // Si on refuse, on annule simplement. Pas d'impact financier car l'argent n'avait pas bougé.
            $operation->setStatut(Operation::STATUT_ANNULEE); // ou REFUSEE selon tes constantes
        } else {
            return $this->json(['error' => 'Action invalide'], 400);
        }

        $em->flush();

        return $this->json(['message' => 'Opération mise à jour', 'nouveau_statut' => $operation->getStatut()]);
    }

    #[Route('/{id}/request-cancellation', name: 'request_cancellation', methods: ['POST'])]
    public function requestCancellation(Operation $operation, Request $request, EntityManagerInterface $em): JsonResponse
    {
        // On ne peut pas annuler une opération déjà annulée ou contre-passée
        if ($operation->getOperationLiee() || $operation->getStatut() === 'ANNULEE') {
            return $this->json(['error' => 'Cette opération est déjà annulée.'], 400);
        }

        $data = json_decode($request->getContent(), true);
        $motif = $data['motif'] ?? 'Erreur de saisie';

        $operation->setEstDemandeAnnulation(true);
        $operation->setMotifAnnulation($motif);

        $em->flush();

        return $this->json(['message' => 'Demande d\'annulation envoyée au manager.']);
    }

    // 2. Le Manager exécute la Contre-passation
    #[Route('/{id}/reverse', name: 'reverse_operation', methods: ['POST'])]
    public function reverseOperation(Operation $operation, EntityManagerInterface $em, SessionCaisseRepository $sessionRepo): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        // Sécurités
        if ($operation->getOperationLiee()) {
            return $this->json(['error' => 'Opération déjà contre-passée.'], 400);
        }

        // On crée l'opération inverse
        $contrePassation = new Operation();
        $contrePassation->setDate(new \DateTimeImmutable());
        $contrePassation->setUtilisateur($this->getUser());
        $contrePassation->setModePaiement($operation->getModePaiement());
        $contrePassation->setCompteComptable($operation->getCompteComptable());
        $contrePassation->setStatut(Operation::STATUT_VALIDEE);
        
        // Inversion logique
        if ($operation->getType() === 'ENCAISSEMENT') {
            $contrePassation->setType('DECAISSEMENT');
            $contrePassation->setMotif("Contre-passation (Annulation Encaissement #" . $operation->getId() . ")");
        } else {
            $contrePassation->setType('ENCAISSEMENT');
            $contrePassation->setMotif("Contre-passation (Annulation Décaissement #" . $operation->getId() . ")");
        }

        $contrePassation->setMontant($operation->getMontant());
        
        // On lie les opérations entre elles (Traçabilité)
        $contrePassation->setOperationLiee($operation); // La nouvelle pointe vers l'ancienne
        // Optionnel : L'ancienne pointe vers la nouvelle (si tu as ajouté un champ inverseOneToOne, sinon pas grave)

        // Important : On lie à la session active du MANAGER (ou celle d'origine si ouverte ?)
        // Logique comptable : L'écriture se fait sur la caisse au moment T. 
        // Donc on prend la session du Manager ou on rouvre temporairement ? 
        // Simplification : On affecte à la session d'origine pour annuler comptablement dans la même session si possible,
        // SINON, si la session est fermée, il faut l'affecter à la session active du caissier responsable ou du manager.
        
        // Solution robuste : On impute sur la caisse d'origine.
        $sessionOrigine = $operation->getSessionCaisse();
        $contrePassation->setSessionCaisse($sessionOrigine);

        // MISE A JOUR DU SOLDE DE LA CAISSE
        $caisse = $sessionOrigine->getCaisse();
        $soldeActuel = (float)$caisse->getSolde();
        $montant = (float)$operation->getMontant();

        if ($contrePassation->getType() === 'ENCAISSEMENT') {
            $caisse->setSolde((string)($soldeActuel + $montant));
        } else {
            $caisse->setSolde((string)($soldeActuel - $montant));
        }

        // Nettoyage de la demande
        $operation->setEstDemandeAnnulation(false);

        $em->persist($contrePassation);
        $em->persist($caisse);
        $em->flush();

        return $this->json(['message' => 'Contre-passation effectuée avec succès.', 'id' => $contrePassation->getId()]);
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