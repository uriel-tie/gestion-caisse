<?php
namespace App\Controller;
use App\Entity\Operation;
use App\Entity\Justificatif; 
use App\Entity\ModePaiement;
use App\Entity\SessionCaisse; 
use App\Entity\Demande;       
use App\Entity\Societe;
use App\Entity\BonDeCaisse;
use App\Repository\ModePaiementRepository;
use App\Repository\OperationRepository;
use App\Repository\SessionCaisseRepository;
use App\Repository\CompteComptableRepository;
use App\Repository\UtilisateurRepository;
use App\Repository\DemandeRepository;
use App\Repository\BonDeCaisseRepository;
use App\Service\BonDeCaisseManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid; 
use DateTimeImmutable;

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
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', 30);
        
        $filters = [
            'type' => $request->query->get('type'),         
            'date_debut' => $request->query->get('date_debut'),
            'date_fin' => $request->query->get('date_fin'),
            'mode' => $request->query->get('mode'),       
            'statut' => $request->query->get('statut'),
            'compte' => $request->query->get('compte'),
            'caisse' => $request->query->get('caisse'),
            'ref' => $request->query->get('ref'),
        ];  

        $caisseRestrict = null;
        if (!$this->isGranted('ROLE_MANAGER')) {
            $caisseRestrict = $caisseRepo->findOneBy(['employeAssigne' => $user]);
            if (!$caisseRestrict) return $this->json([]);
        }

        // Si un filtre caisse est fourni (pour les managers), récupérer l'entité Caisse
        $caisseFilter = null;
        if (!empty($filters['caisse']) && $this->isGranted('ROLE_MANAGER')) {
            $caisseFilter = $caisseRepo->find($filters['caisse']);
        }

        $paginator = $operationRepository->findWithFilters($filters, $page, $limit, $caisseRestrict, $caisseFilter);
        $totalItems = count($paginator);
        $totalPages = ceil($totalItems / $limit);

        $data = [];
        foreach ($paginator as $op) {
            try {
                $sessionCaisse = $op->getSessionCaisse();
                $caisse = $sessionCaisse ? $sessionCaisse->getCaisse() : null;
                $nomCaisse = $caisse ? $caisse->getNom() : 'N/A';
                $demande = $op->getDemande();
                $bonDeCaisse = $op->getBonDeCaisse();
                // Récupération sécurisée du retour de fond
                $retourOp = null;
                if ($bonDeCaisse) {
                    $retourOp = $bonDeCaisse->getOperationRetourFond();
                }

                $data[] = [
                    'id' => (string) $op->getId(),
                    'type' => $op->getType(),
                    'montant' => (float) $op->getMontant(),
                    'date' => $op->getDate()->format('d/m/Y H:i'),
                    'statut' => $op->getStatut(),
                    'mode' => $op->getModePaiement() ? $op->getModePaiement()->getLibelle() : 'N/A',
                    'utilisateur' => $op->getUtilisateur() ? $op->getUtilisateur()->getNom() : 'Inconnu',
                    'motif' => $op->getMotif() ?? 'Non précisé',
                    'motif_annulation' => $op->getMotifAnnulation(), 
                    'operationLiee' => $op->getOperationLiee() !== null, 
                    'caisse' => $nomCaisse,
                    'estDemandeAnnulation' => $op->isEstDemandeAnnulation(),
                    'beneficiaire' => $op->getBeneficiaire(),
                    'ref' => $op->getRef(),
                    'demande' => $demande ? [
                        'id' => (string) $demande->getId(),
                        'numeroReference' => method_exists($demande, 'getNumeroReference') ? $demande->getNumeroReference() : null,
                    ] : null,
                    'justificatif' => $op->getJustificatif() ? [
                        'type' => $op->getJustificatif()->getType(),
                        'url' => $op->getJustificatif()->getChemin(), 
                        'fichier' => $op->getJustificatif()->getFichier(),
                    ] : null,
                    'bonDeCaisse' => $bonDeCaisse ? [
                        'id' => (string) $bonDeCaisse->getId(),
                        'numero' => $bonDeCaisse->getReference(), 
                        'retourFond' => $retourOp ? [
                            'montant' => (float) $retourOp->getMontant()
                        ] : null
                    ] : null,
                ];
            } catch (\Exception $e) {
                // En cas d'erreur, on log et on continue avec des valeurs par défaut
                error_log('Erreur lors du traitement de l\'opération ' . $op->getId() . ': ' . $e->getMessage());
                $data[] = [
                    'id' => (string) $op->getId(),
                    'type' => $op->getType(),
                    'montant' => (float) $op->getMontant(),
                    'date' => $op->getDate()->format('d/m/Y H:i'),
                    'statut' => $op->getStatut(),
                    'mode' => 'N/A',
                    'utilisateur' => 'Erreur',
                    'motif' => 'Erreur lors du traitement',
                    'motif_annulation' => null,
                    'operationLiee' => false,
                    'caisse' => 'N/A',
                    'estDemandeAnnulation' => false,
                    'beneficiaire' => null,
                    'demande' => null,
                    'justificatif' => null,
                    'bonDeCaisse' => null,
                    'ref' => null,
                ];
            }
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

    #[Route('/{id}/attach-justificatif', name: 'attach_justificatif', methods: ['POST'])]
    public function attachJustificatif(
        Operation $operation,
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse
    {
        if ($operation->getJustificatif()) {
            return $this->json(['error' => 'Cette opération possède déjà un justificatif.'], 400);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['fichier_data']) || empty($data['fichier_nom'])) {
            return $this->json(['error' => 'Fichier manquant ou invalide.'], 400);
        }

        try {
            $this->processJustificatif($operation, $data, $em);
            $em->flush();
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
        SessionCaisseRepository $sessionRepo,
        BonDeCaisseManager $bonManager
    ): JsonResponse

    {
       /** @var Utilisateur $user */
        $user = $this->getUser();
        $societe = $user->getSociete();
        // On cherche une session active (via string ou constante si importée)
        $session = $sessionRepo->findOneBy(['caissier' => $user, 'statut' => 'OUVERTE']);
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
        $op->setSociete($societe);
        $em->persist($op);
        $this->processJustificatif($op, $data, $em);
        $caisse = $session->getCaisse();
        $nouveauSolde = (float)$caisse->getSolde() + (float)$data['montant'];
        $caisse->setSolde((string)$nouveauSolde);
        $em->persist($caisse);
        $em->flush();
        // Création du bon de caisse de référence pour cet encaissement
        $bon = $bonManager->creerPourOperation($op, null);
        $em->flush();

        return $this->json([
            'message' => 'Encaissement enregistré !',
            'nouveau_solde' => $nouveauSolde,
            'id' => (string) $op->getId(), // Retourne l'ID pour impression éventuelle
            'bon_de_caisse_id' => (string) $bon->getId(),
            'bon_de_caisse_ref' => $bon->getReference(),
        ], 201);
    }

    #[Route('/{id}/retour-fond', name: 'retour_fond', methods: ['POST'])]
        public function retourFond(
            string $id, 
            Request $request, 
            OperationRepository $opRepo, 
            EntityManagerInterface $em
        ): JsonResponse {
            $opOriginale = $opRepo->find($id);
            $data = json_decode($request->getContent(), true);
            $montant = $data['montant'] ?? 0;
            if (!$opOriginale || !$opOriginale->getBonDeCaisse()) {
                return $this->json(['error' => 'Opération ou Bon de Caisse introuvable'], 404);
            }
            if ($montant > $opOriginale->getMontant()) {
                return $this->json(['error' => 'Le montant du retour de fond est supérieur au montant de l\'opération'], 400);
            }

            // 1. Création de l'encaissement (le retour de fond)
            $retour = new Operation();
            $retour->setType('ENCAISSEMENT');
            $retour->setMontant($montant);
            $retour->setMotif("Retour de fond " . $opOriginale->getBonDeCaisse()->getReference());
            $retour->setStatut('VALIDEE');
            $retour->setDate(new DateTimeImmutable());
            $retour->setUtilisateur($this->getUser());
            $retour->setSessionCaisse($opOriginale->getSessionCaisse());
            $retour->setSociete($opOriginale->getSociete());
            $retour->setModePaiement($opOriginale->getModePaiement());
            $retour->setCompteComptable($opOriginale->getCompteComptable());
            $caisse = $opOriginale->getSessionCaisse()->getCaisse();
            $nouveauSolde = (float)$caisse->getSolde() + (float)$data['montant'];
            $caisse->setSolde((string)$nouveauSolde);
            $em->persist($caisse);
            $em->flush();

            // 2. Lien avec le Bon de Caisse original
            $bon = $opOriginale->getBonDeCaisse();
            $bon->setOperationRetourFond($retour);
            $em->persist($retour);
            $em->flush();

            return $this->json(['message' => 'Retour de fond enregistré', 'id' => $retour->getId()]);
        }

    #[Route('/decaissement', name: 'create_decaissement', methods: ['POST'])]
    public function createDecaissement(
        Request $request, 
        EntityManagerInterface $em, 
        ModePaiementRepository $modeRepo,
        SessionCaisseRepository $sessionRepo,
        CompteComptableRepository $compteRepo, 
        DemandeRepository $demandeRepo,
        BonDeCaisseManager $bonManager
    ): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $societe = $user->getSociete();

        // On cherche une session active
        $session = $sessionRepo->findOneBy(['caissier' => $user, 'statut' => 'OUVERTE']);

        if (!$session) {
            return $this->json(['error' => 'Aucune session de caisse ouverte.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $montant = (float) ($data['montant'] ?? 0);

        if ($montant <= 0) return $this->json(['error' => 'Montant invalide'], 400);

        $demande = null;
        $beneficiaireFinal = "Inconnu";
        $detailsLignes = null;


        if (!empty($data['demande_id'])) {
            $demande = $demandeRepo->find($data['demande_id']);
            if ($demande) {
                // Vérif statut (chaine pour éviter erreur constante)
                if ($demande->getStatut() !== 'VALIDEE_A_PAYER') {
                    return $this->json(['error' => 'Cette demande n\'est pas au statut "VALIDEE_A_PAYER".'], 400);
                }

                // Récupération intelligente du bénéficiaire
                if (method_exists($demande, 'getBeneficiaireAutre') && $demande->getBeneficiaireAutre()) {
                    $beneficiaireFinal = $demande->getBeneficiaireAutre();
                } elseif ($demande->getBeneficiaire()) {
                    $beneficiaireFinal = $demande->getBeneficiaire()->getNom();
                } else {
                    $beneficiaireFinal = $demande->getDemandeur()->getNom();
                }
            }
        } else {
            // Décaissement direct
            $beneficiaireFinal = $data['beneficiaire'] ?? 'Porteur';
        }

        if (!empty($data['lignes']) && is_array($data['lignes'])) {
                $detailsLignes = $data['lignes']; // On stocke le tableau JSON direct
            }

        // --- VERIFICATION SOLDE ---
        $caisse = $session->getCaisse();
        $soldeReel = (float)$caisse->getSolde();

        if ($montant > $soldeReel) {
            return $this->json([
                'error' => 'Solde insuffisant (' . number_format($soldeReel, 0, ',', ' ') . ' F).',
                'solde_disponible' => $soldeReel
            ], 400);
        }

        $numeroCompte = '606'; 
        if (!empty($data['compte_id'])) {
            $compte = $compteRepo->find($data['compte_id']);
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
        $op->setSessionCaisse($session);
        $op->setBeneficiaire($beneficiaireFinal); 
        $op->setSociete($societe);

        if ($detailsLignes) {
            $op->setDetails($detailsLignes);
        }
        if ($demande) {
            $op->setMotif("Règlement Demande " . $demande->getNumeroReference());
            $op->setDemande($demande); // Liaison explicite
        } else {
            $op->setMotif($data['motif'] ?? 'Décaissement divers');
        }

        // Validation Seuil
        $seuilCaisse = (float) ($caisse->getSeuilDecaissement() ?? 50000);
        $isManager = in_array('ROLE_MANAGER', $user->getRoles());
        $isDemandeValidee = ($demande !== null);

        if ($isManager || $isDemandeValidee || $montant <= $seuilCaisse) {
            $op->setStatut(Operation::STATUT_VALIDEE);
            $msg = "Décaissement validé.";
            // DÉBIT IMMEDIAT
            $caisse->setSolde((string)($soldeReel - $montant));
            $em->persist($caisse);

            // CLOTURE DEMANDE
            if ($demande) {
                $demande->setStatut('PAYEE');
                $demande->setOperation($op);
                $demande->setCaissierTraitant($user);
                $em->persist($demande);
            }
        } else {
            $op->setStatut(Operation::STATUT_EN_ATTENTE);
            $msg = "En attente de validation (Montant > " . $seuilCaisse . ")";
        }

        $em->persist($op);
        $this->processJustificatif($op, $data, $em);
        $em->flush();
        // Création du bon de caisse lié à cette opération (avec la demande si présente)
        $bon = $bonManager->creerPourOperation($op, $demande);
        $em->flush();

        // ICI : On retourne l'ID en string pour éviter le bug "undefined"
        return $this->json([
            'message' => $msg, 
            'statut' => $op->getStatut(), 
            'id' => (string) $op->getId(),
            'bon_de_caisse_id' => (string) $bon->getId(),
            'bon_de_caisse_ref' => $bon->getReference(),

        ], 201);
    }

   #[Route('/{id}/print-data', name: 'print_data', methods: ['GET'])]
    public function getPrintData(string $id, OperationRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        if (!Uuid::isValid($id)) return $this->json(['error' => 'ID invalide'], 400);

        $op = $repo->find($id);
        if (!$op) return $this->json(['error' => 'Introuvable'], 404);

        $societe = $em->getRepository(Societe::class)->findOneBy([]);

        // --- CONSTRUCTION DES LIGNES (FAÇON FACTURE) ---
        $lignes = [];

        // Cas 1 : Lignes venant d'une Demande liée
        if ($op->getDemande()) {
            foreach ($op->getDemande()->getLignes() as $ligne) {
                $lignes[] = [
                    'designation' => $ligne->getDesignation(),
                    'quantite' => $ligne->getQuantite(),
                    'prix' => $ligne->getPrixUnitaireEstimatif(),
                    'total' => $ligne->getTotalLigne()
                ];
            }
        }
        // Cas 2 : Lignes stockées directement dans l'Opération (Décaissement direct)
        elseif ($op->getDetails()) {
            $lignes = $op->getDetails(); // On suppose que le format est déjà bon
        }
        // Cas 3 : Fallback (Juste le motif global)
        else {
            $lignes[] = [
                'designation' => $op->getMotif(),
                'quantite' => 1,
                'prix' => (float)$op->getMontant(),
                'total' => (float)$op->getMontant()
            ];
        }

        return $this->json([
            'operation' => [
                'id' => (string) $op->getId(),
                // Numéro d'affichage : on privilégie la référence métier si présente
                'numero' => $op->getRef() ?: 'OP-' . str_pad((string)$op->getId(), 6, '0', STR_PAD_LEFT),
                'ref' => $op->getRef(),
                'date' => $op->getDate()->format('d/m/Y H:i'),
                'montant' => $op->getMontant(),
                'motif' => $op->getMotif(),
                'beneficiaire' => $op->getBeneficiaire(),
                'mode' => $op->getModePaiement() ? $op->getModePaiement()->getLibelle() : 'Espèces',
                'caissier' => $op->getUtilisateur()->getNom(),
            ],
            // On envoie les lignes préparées
            'lignes' => $lignes, 
            'demande_ref' => $op->getDemande() ? $op->getDemande()->getNumeroReference() : null,
            'societe' => $societe ? [
                'nom' => $societe->getNom(),
                'adresse' => $societe->getAdresse(),
                'telephone' => $societe->getTelephone(),
            ] : null
        ]);
    }

    #[Route('/me', name: 'my_operations', methods: ['GET'])]
    public function myOperations(OperationRepository $opRepo): JsonResponse
    {
        $user = $this->getUser();
        $operations = $opRepo->findBy(
            ['utilisateur' => $user],
            ['date' => 'DESC'],
            10
        );

        $data = [];
        foreach ($operations as $op) {
            $data[] = [
                'id' => (string)$op->getId(),
                'type' => $op->getType(),
                'montant' => (float)$op->getMontant(),
                'date' => $op->getDate()->format('Y-m-d H:i:s'),
                'motif' => $op->getMotif(),
                'statut' => $op->getStatut(),
                'beneficiaire' => $op->getBeneficiaire()
            ];
        }
        return $this->json($data);
    }

    #[Route('/to-validate', name: 'list_to_validate', methods: ['GET'])]
    public function listToValidate(OperationRepository $opRepo): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');
        $operations = $opRepo->findBy(['statut' => Operation::STATUT_EN_ATTENTE], ['date' => 'DESC']);

        $data = [];
        foreach ($operations as $op) {
            $user = $op->getUtilisateur();
            $data[] = [
                'id' => (string)$op->getId(),
                'type' => $op->getType(),
                'montant' => (float)$op->getMontant(),
                'motif' => $op->getMotif(),
                'date' => $op->getDate()->format('d/m/Y H:i'),
                'caissier' => $user ? $user->getNom() : 'Inconnu',
                'has_justificatif' => $op->getJustificatif() !== null
            ];
        }
        return $this->json($data);
    }

    #[Route('/{id}/workflow', name: 'workflow', methods: ['PATCH'])]
    public function workflow(Operation $operation, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');
        $data = json_decode($request->getContent(), true);
        $action = $data['action'] ?? null;

        if ($operation->getStatut() !== Operation::STATUT_EN_ATTENTE) {
            return $this->json(['error' => 'Opération non éligible.'], 400);
        }

        if ($action === 'valider') {
            $operation->setStatut(Operation::STATUT_VALIDEE);
            $session = $operation->getSessionCaisse();
            if ($session) {
                $caisse = $session->getCaisse();
                $montant = (float) $operation->getMontant();
                if ($operation->getType() === 'DECAISSEMENT') {
                    if ($caisse->getSolde() < $montant) {
                        return $this->json(['error' => 'Solde insuffisant.'], 400);
                    }
                    $caisse->setSolde((string)($caisse->getSolde() - $montant));
                } 
                // Si c'était un encaissement en attente (rare), on ajouterait ici
                $em->persist($caisse);
            }
        } elseif ($action === 'refuser') {
            $operation->setStatut(Operation::STATUT_ANNULEE);
        }

        $em->flush();
        return $this->json(['status' => $operation->getStatut()]);
    }

    private function processJustificatif(Operation $op, array $data, EntityManagerInterface $em): void
    {
        $justificatif = new Justificatif();
        $societe = $op->getSociete();
        $hasJustif = false;

        if (isset($data['is_bon_interne']) && $data['is_bon_interne'] === true) {
            $justificatif->setType('BON_INTERNE');
            if (!empty($data['details'])) $justificatif->setContenuJson($data['details']);
            if (!empty($data['signature'])) $justificatif->setSignatureData($data['signature']);
            if (!empty($data['beneficiaire'])) {
                $content = $justificatif->getContenuJson() ?? [];
                $content['beneficiaire_nom'] = $data['beneficiaire'];
                $justificatif->setContenuJson($content);
            }
            $hasJustif = true;
        } elseif (!empty($data['fichier_data']) && !empty($data['fichier_nom'])) {
            $justificatif->setType('FICHIER');
            $parts = explode(',', $data['fichier_data']);
            $fileData = base64_decode(count($parts) > 1 ? $parts[1] : $parts[0]);
            $newFilename = uniqid('justif_') . '.' . pathinfo($data['fichier_nom'], PATHINFO_EXTENSION);
            $targetDir = $this->getParameter('kernel.project_dir') . '/public/uploads/justificatifs';
            if (!is_dir($targetDir)) mkdir($targetDir, 0777, true);
            file_put_contents($targetDir . '/' . $newFilename, $fileData);
            $justificatif->setFichier($data['fichier_nom']);
            $justificatif->setChemin('uploads/justificatifs/' . $newFilename);
            $hasJustif = true;
        }

        if ($hasJustif) {
            $justificatif->setOperation($op);
            $justificatif->setSociete($societe); 
            $em->persist($justificatif);
        }
    }
}