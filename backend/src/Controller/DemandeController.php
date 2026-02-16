<?php

namespace App\Controller;

use App\Entity\Demande;
use App\Entity\LigneDemande;
use App\Entity\Utilisateur;
use App\Entity\Societe;
use App\Entity\CompteComptable;
use App\Repository\DemandeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/demandes', name: 'api_demandes_')]
final class DemandeController extends AbstractController
{
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse 
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $societe = $user->getSociete();
        $data = json_decode($request->getContent(), true);
        $isDraft = !empty($data['isDraft']);

        // 1. Récupération Config Société & Rôles
        $modeValidation = $societe ? $societe->getModeValidation() : Societe::MODE_STANDARD;
        $roles = $user->getRoles();

        if (empty($data['titre']) || empty($data['montant'])) {
            return $this->json(['error' => 'Champs obligatoires manquants'], 400);
        }
        if (!$societe) {
            return $this->json(['error' => 'Vous devez être rattaché à une société pour créer une demande'], 403);
        }

        $demande = new Demande();
        $demande->setSociete($societe);
        $demande->setTitre($data['titre']);
        
        // Gestion montant
        if (method_exists($demande, 'setMontantEstime')) {
            $demande->setMontantEstime((string)$data['montant']);
        } else {
            $demande->setMontant((float)$data['montant']);
        }

        $demande->setType($data['type'] ?? 'FICHE_BESOIN');
        $demande->setDemandeur($user);
        $demande->setSociete($societe);

        // Gestion Bénéficiaire
        if (!empty($data['beneficiaire_id'])) {
            $beneficiaire = $em->getRepository(Utilisateur::class)->find($data['beneficiaire_id']);
            $demande->setBeneficiaire($beneficiaire ?: $user);
        } elseif (!empty($data['beneficiaire_autre'])) {
            if (method_exists($demande, 'setBeneficiaireAutre')) {
                $demande->setBeneficiaireAutre($data['beneficiaire_autre']);
            }
            $demande->setBeneficiaire($user);
        } else {
            $demande->setBeneficiaire($user);
        }

        $description = $data['motif'] ?? '';
        if (method_exists($demande, 'setDescription')) {
            $demande->setDescription($description);
        }

        // --- CŒUR DU REACTEUR : LOGIQUE DES STATUTS ---
        if ($isDraft) {
            $demande->setStatut('BROUILLON');
        } else {
            // CAS 1 : MODE AUTONOMIE (Urgence / Caisse directe)
            if ($modeValidation === Societe::MODE_AUTONOMIE) {
                // Tout le monde passe direct en caisse
                $demande->setStatut('VALIDEE_A_PAYER');
            }
            // CAS 2 : LE MANAGER (Il a tous les droits)
            elseif (in_array('ROLE_MANAGER', $roles)) {
                $demande->setStatut('VALIDEE_A_PAYER');
            }
            // CAS 3 : LE CHEF DE SERVICE
            elseif (in_array('ROLE_CHEF_SERVICE', $roles)) {
                if ($modeValidation === Societe::MODE_DELEGATION) {
                    // Délégation : Le chef valide final, y compris pour lui-même
                    $demande->setStatut('VALIDEE_A_PAYER');
                } else {
                    // Standard : Le chef doit demander au Manager
                    $demande->setStatut('ATTENTE_MANAGER');
                }
            }
            // CAS 4 : EMPLOYE / CAISSIER (Standard)
            else {
                $demande->setStatut('ATTENTE_CHEF');
            }
        }

        // REFERENCE
        if (method_exists($demande, 'setNumeroReference')) {
            $ref = 'DEM-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
            $demande->setNumeroReference($ref);
        }

        // LIGNES
        if (!empty($data['lignes']) && is_array($data['lignes']) && method_exists($demande, 'addLigne')) {
            foreach ($data['lignes'] as $l) {
                $ligne = new LigneDemande();
                $ligne->setDesignation($l['designation']);
                $ligne->setQuantite((int)$l['quantite']);
                $ligne->setPrixUnitaireEstimatif((float)$l['prixUnitaire']);
                
                // Associer le compte comptable par UUID SEULEMENT
                if (!empty($l['compte_id']) && is_string($l['compte_id'])) {
                    try {
                        $compte = $em->getRepository(CompteComptable::class)->find($l['compte_id']);
                        if ($compte) {
                            $ligne->setCompte($compte);
                        }
                    } catch (\Exception $e) {
                        // UUID invalide - on ignore
                        \error_log('Invalid CompteComptable UUID: ' . $l['compte_id']);
                    }
                }
                
                $demande->addLigne($ligne);
            }
        }

        $em->persist($demande);
        $em->flush();

        return $this->json(['id' => $demande->getId(), 'statut' => $demande->getStatut()], 201);
    }

    #[Route('/{id}/envoyer', name: 'envoyer', methods: ['POST'])]
        public function envoyer(string $id, DemandeRepository $demandeRepository, EntityManagerInterface $em): JsonResponse
        {
            /** @var Utilisateur $user */
            $user = $this->getUser();
            $demande = $demandeRepository->find($id);

            // 1. Vérifications de base
            if (!$demande) {
                return $this->json(['error' => 'Demande introuvable'], 404);
            }

            if ($demande->getStatut() !== Demande::STATUT_BROUILLON) {
                return $this->json(['error' => 'Cette demande n\'est plus un brouillon'], 400);
            }

            // Sécurité : Seul le demandeur peut envoyer son brouillon
            if ($demande->getDemandeur() !== $user) {
                return $this->json(['error' => 'Action non autorisée'], 403);
            }

            // 2. Calcul du statut cible (Copie de ta logique de validation)
            $societe = $user->getSociete();
            $modeValidation = $societe ? $societe->getModeValidation() : Societe::MODE_STANDARD;
            $roles = $user->getRoles();

            $nouveauStatut = Demande::STATUT_ATTENTE_CHEF; // Par défaut

            if ($modeValidation === Societe::MODE_AUTONOMIE || in_array('ROLE_MANAGER', $roles)) {
                $nouveauStatut = Demande::STATUT_VALIDEE;
            } elseif ($modeValidation === Societe::MODE_DELEGATION || in_array('ROLE_CHEF_SERVICE', $roles)) {
                $nouveauStatut = Demande::STATUT_ATTENTE_MANAGER;
            }

            // 3. Mise à jour et sauvegarde
            $demande->setStatut($nouveauStatut);
            $demande->setCreatedAt(new \DateTimeImmutable()); // On rafraîchit la date à l'envoi réel
            
            $em->flush();

            return $this->json([
                'message' => 'Demande envoyée avec succès',
                'id' => $demande->getId(),
                'nouveauStatut' => $nouveauStatut
            ]);
        }

         #[Route('/{id}/annuler', name: 'annuler', methods: ['POST'])]
    public function annuler(string $id, DemandeRepository $demandeRepository, EntityManagerInterface $em): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $demande = $demandeRepository->find($id);

        // 1. Vérifications de base
        if (!$demande) {
            return $this->json(['error' => 'Demande introuvable'], 404);
        }

        // On ne peut pas annuler une demande déjà annulée, payée ou refusée
        if (in_array($demande->getStatut(), ['ANNULEE', 'PAYEE', 'REFUSEE'])) {
            return $this->json(['error' => 'Cette demande ne peut pas être annulée'], 400);
        }

        // Sécurité : Seul le demandeur ou un manager peut annuler
        if ($demande->getDemandeur() !== $user && !in_array('ROLE_MANAGER', $user->getRoles())) {
            return $this->json(['error' => 'Action non autorisée'], 403);
        }

        // 2. Mise à jour du statut
        $demande->setStatut('ANNULEE');
        $em->flush();

        return $this->json([
            'message' => 'Demande annulée avec succès',
            'id' => $demande->getId(),
            'statut' => $demande->getStatut()
        ]);
    }

    #[Route('/{id}/workflow', name: 'workflow_action', methods: ['PATCH'])]
    public function workflowAction(Demande $demande, Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $roles = $user->getRoles();

        $societe = $em->getRepository(Societe::class)->findOneBy([]);
        $modeValidation = $societe ? $societe->getModeValidation() : Societe::MODE_STANDARD;

        $data = json_decode($request->getContent(), true);
        $action = $data['action'] ?? null;

        if ($action === 'valider') {
            
            // --- POUVOIR SPECIAL CAISSIER (MODE AUTONOMIE) ---
            // Le caissier peut forcer la validation immédiate
            if ($modeValidation === Societe::MODE_AUTONOMIE && in_array('ROLE_CAISSIER', $roles)) {
                $demande->setStatut('VALIDEE_A_PAYER');
                $em->flush();
                return $this->json(['status' => 'VALIDEE_A_PAYER', 'message' => 'Validation forcée par la caisse']);
            }

            // --- WORKFLOW HIERARCHIQUE CLASSIQUE ---
            if ($demande->getStatut() === 'ATTENTE_CHEF') {
                // Vérif droits Chef ou Manager
                if (!in_array('ROLE_CHEF_SERVICE', $roles) && !in_array('ROLE_MANAGER', $roles)) {
                    return $this->json(['error' => 'Non autorisé'], 403);
                }

                if ($modeValidation === Societe::MODE_DELEGATION) {
                    $demande->setStatut('VALIDEE_A_PAYER'); // Saute le Manager
                } else {
                    $demande->setStatut('ATTENTE_MANAGER'); // Va chez le Manager
                }
            }
            elseif ($demande->getStatut() === 'ATTENTE_MANAGER') {
                if (!in_array('ROLE_MANAGER', $roles)) {
                    return $this->json(['error' => 'Seul le Manager peut valider'], 403);
                }
                $demande->setStatut('VALIDEE_A_PAYER');
            }
        
        } elseif ($action === 'refuser') {
            $demande->setStatut('REFUSEE');
        }

        $em->flush();
        return $this->json(['status' => $demande->getStatut()]);
    }

    /**
     * Liste des demandes validées prêtes à payer.
     * C'est ici qu'on applique la règle des 30 jours pour le mode Autonomie.
     */
    #[Route('/payable', name: 'list_payable', methods: ['GET'])]
    public function listPayable(DemandeRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        // 1. Nettoyage des demandes expirées (Mode Autonomie > 30 jours)
        $this->expireOldRequests($em);

        // 2. Récupération des demandes valides
        $demandes = $repo->findBy(['statut' => 'VALIDEE_A_PAYER'], ['createdAt' => 'DESC']);
        
        $data = [];
        foreach ($demandes as $d) {
            $montant = method_exists($d, 'getMontantEstime') ? $d->getMontantEstime() : $d->getMontant();
            $dateObj = method_exists($d, 'getCreatedAt') ? $d->getCreatedAt() : $d->getDateCreation();
            $ref = method_exists($d, 'getNumeroReference') ? $d->getNumeroReference() : null;

            // Gestion Bénéficiaire
            $beneficiaireNom = $d->getBeneficiaire() ? $d->getBeneficiaire()->getNom() : $d->getDemandeur()->getNom();
            if (method_exists($d, 'getBeneficiaireAutre') && $d->getBeneficiaireAutre()) {
                $beneficiaireNom = $d->getBeneficiaireAutre();
            }

            $data[] = [
                'id' => $d->getId(),
                'numeroReference' => $ref,
                'titre' => $d->getTitre(),
                'montant' => $montant,
                'demandeur' => $d->getDemandeur()->getNom(),
                'beneficiaire' => $beneficiaireNom,
                'date' => $dateObj ? $dateObj->format('Y-m-d H:i') : 'N/A',
                'type' => $d->getType(),
            ];
        }

        return $this->json($data);
    }

    /**
     * Méthode privée pour invalider les vieilles demandes en mode Autonomie
     */
    private function expireOldRequests(EntityManagerInterface $em): void
    {
        $societe = $em->getRepository(Societe::class)->findOneBy([]);
        if (!$societe || $societe->getModeValidation() !== Societe::MODE_AUTONOMIE) {
            return; // Cette règle ne s'applique qu'en mode Autonomie
        }

        // Date limite = Aujourd'hui - 30 jours
        $limitDate = new \DateTime();
        $limitDate->modify('-30 days');

        // On cherche les demandes VALIDEE_A_PAYER vieilles de +30 jours
        // Note: Idéalement, faire ça en DQL pour la perf, mais ici en PHP pour la simplicité
        $repo = $em->getRepository(Demande::class);
        $oldDemandes = $repo->createQueryBuilder('d')
            ->where('d.statut = :statut')
            ->andWhere('d.createdAt < :limitDate')
            ->setParameter('statut', 'VALIDEE_A_PAYER')
            ->setParameter('limitDate', $limitDate)
            ->getQuery()
            ->getResult();

        foreach ($oldDemandes as $d) {
            $d->setStatut('EXPIREE'); // Nouveau statut pour dire "Trop tard"
        }

        if (count($oldDemandes) > 0) {
            $em->flush();
        }
    }

    #[Route('/me', name: 'list_current_user', methods: ['GET'])]
public function listCurrentUser(DemandeRepository $repo, Request $request): JsonResponse
{
    /** @var Utilisateur $user */
    $user = $this->getUser();
    
    $page = max(1, (int) $request->query->get('page', 1));
    $limit = max(1, min(50, (int) $request->query->get('limit', 6)));
    
    $statut = $request->query->get('statut');
    $periode = $request->query->get('periode');
    $dateDebut = $request->query->get('date_debut');
    $dateFin = $request->query->get('date_fin');
    
    // 1. Construction de la base de la query (Filtres uniquement)
    $qb = $repo->createQueryBuilder('d')
        ->where('d.demandeur = :user')
        ->setParameter('user', $user);
        
    if ($statut && $statut !== 'all') {
        $qb->andWhere('d.statut = :statut')
           ->setParameter('statut', $statut);
    }
    
    if ($periode || ($dateDebut && $dateFin)) {
        $now = new \DateTime();
        switch ($periode) {
            case '7jours':
                $qb->andWhere('d.createdAt >= :dateStart')
                   ->setParameter('dateStart', (clone $now)->modify('-7 days'));
                break;
            case '30jours':
                $qb->andWhere('d.createdAt >= :dateStart')
                   ->setParameter('dateStart', (clone $now)->modify('-30 days'));
                break;
            case '3mois':
                $qb->andWhere('d.createdAt >= :dateStart')
                   ->setParameter('dateStart', (clone $now)->modify('-3 months'));
                break;
            case 'custom':
                if ($dateDebut) {
                    $qb->andWhere('d.createdAt >= :dateStart')
                       ->setParameter('dateStart', new \DateTime($dateDebut));
                }
                if ($dateFin) {
                    $dateEnd = new \DateTime($dateFin);
                    $qb->andWhere('d.createdAt <= :dateEnd')
                       ->setParameter('dateEnd', $dateEnd->setTime(23, 59, 59));
                }
                break;
        }
    }

    // 2. COMPTAGE DU TOTAL (On clone AVANT d'ajouter le tri et la pagination)
    $totalQb = clone $qb;
    $total = (int) $totalQb->select('COUNT(d.id)')
                           ->getQuery()
                           ->getSingleScalarResult();

    // 3. TRI ET PAGINATION (Uniquement sur le QB original)
    $sortBy = $request->query->get('sort', 'createdAt');
    $sortOrder = strtoupper($request->query->get('order', 'DESC')) === 'ASC' ? 'ASC' : 'DESC';
    
    $allowedSortFields = ['createdAt', 'montant', 'titre', 'statut'];
    if (!in_array($sortBy, $allowedSortFields)) {
        $sortBy = 'createdAt';
    }
    
    $offset = ($page - 1) * $limit;
    $qb->orderBy("d.$sortBy", $sortOrder) // Le tri est ajouté ICI
       ->setFirstResult($offset)
       ->setMaxResults($limit);
    
    $demandes = $qb->getQuery()->getResult();
    
    $data = [];
        foreach ($demandes as $d) {
            $montant = method_exists($d, 'getMontantEstime') ? $d->getMontantEstime() : $d->getMontant();
            $dateObj = method_exists($d, 'getCreatedAt') ? $d->getCreatedAt() : $d->getDateCreation();
            $ref = method_exists($d, 'getNumeroReference') ? $d->getNumeroReference() : null;
            
            $beneficiaireNom = $d->getBeneficiaire() ? $d->getBeneficiaire()->getNom() : 'Moi-même';
            if (method_exists($d, 'getBeneficiaireAutre') && $d->getBeneficiaireAutre()) {
                $beneficiaireNom = $d->getBeneficiaireAutre() . ' (Externe)';
            }

            $data[] = [
                'id' => $d->getId(),
                'numeroReference' => $ref,
                'titre' => $d->getTitre(),
                'montant' => $montant,
                'type' => $d->getType(),
                'statut' => $d->getStatut(),
                'beneficiaire' => $beneficiaireNom,
                'date' => $dateObj ? $dateObj->format('Y-m-d H:i') : null,
            ];
        }

    return $this->json([
        'data' => $data,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}
    
    #[Route('/to-validate', name: 'list_to_validate', methods: ['GET'])]
    public function listToValidate(DemandeRepository $repo): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $roles = $user->getRoles();
        $societe = $user->getSociete();

        // Vérif que l'utilisateur appartient à une société
        if (!$societe) {
            return $this->json(['error' => 'Vous devez être rattaché à une société'], 403);
        }

        $qb = $repo->createQueryBuilder('d')
            ->join('d.demandeur', 'u')
            ->andWhere('d.societe = :societe')
            ->setParameter('societe', $societe)
            ->orderBy('d.createdAt', 'DESC');

        if (in_array('ROLE_MANAGER', $roles)) {
            $qb->andWhere('d.statut = :statut')->setParameter('statut', 'ATTENTE_MANAGER');
        } elseif (in_array('ROLE_CHEF_SERVICE', $roles)) {
            $service = $user->getService();
            if (!$service) return $this->json([]);
            $qb->andWhere('d.statut = :statut')
               ->andWhere('u.service = :service')
               ->setParameter('statut', 'ATTENTE_CHEF')
               ->setParameter('service', $service);
        } else {
            return $this->json([]);
        }

        $demandes = $qb->getQuery()->getResult();
        $data = [];
        foreach ($demandes as $d) {
            $montant = method_exists($d, 'getMontantEstime') ? $d->getMontantEstime() : $d->getMontant();
            $dateObj = method_exists($d, 'getCreatedAt') ? $d->getCreatedAt() : $d->getDateCreation();
            $ref = method_exists($d, 'getNumeroReference') ? $d->getNumeroReference() : null;
            $beneficiaireNom = $d->getBeneficiaire() ? $d->getBeneficiaire()->getNom() : $d->getDemandeur()->getNom();
            if (method_exists($d, 'getBeneficiaireAutre') && $d->getBeneficiaireAutre()) $beneficiaireNom = $d->getBeneficiaireAutre();

            $data[] = [
                'id' => $d->getId(),
                'titre' => $d->getTitre(),
                'montant' => $montant,
                'demandeur' => $d->getDemandeur()->getNom(),
                'beneficiaire' => $beneficiaireNom,
                'date' => $dateObj ? $dateObj->format('Y-m-d') : 'N/A',
                'numeroReference' => $ref,
            ];
        }
        return $this->json($data);
    }
    
    #[Route('/search/{query}', name: 'search_by_ref', methods: ['GET'])]
    public function searchByReference(string $query, DemandeRepository $repo): JsonResponse
    {
        $demande = $repo->findOneBy(['numeroReference' => $query]);
        if (!$demande && \Symfony\Component\Uid\Uuid::isValid($query)) $demande = $repo->find($query);
        if (!$demande) return $this->json(['error' => 'Aucune demande trouvée.'], 404);

        $montant = method_exists($demande, 'getMontantEstime') ? $demande->getMontantEstime() : $demande->getMontant();
        $motif = method_exists($demande, 'getDescription') ? $demande->getDescription() : $demande->getMotif();
        $beneficiaireNom = $demande->getBeneficiaire() ? $demande->getBeneficiaire()->getNom() : 'Inconnu';
        if (method_exists($demande, 'getBeneficiaireAutre') && $demande->getBeneficiaireAutre()) $beneficiaireNom = $demande->getBeneficiaireAutre();

        return $this->json([
            'id' => $demande->getId(),
            'numeroReference' => $demande->getNumeroReference(),
            'titre' => $demande->getTitre(),
            'montant' => $montant,
            'statut' => $demande->getStatut(),
            'beneficiaire' => $beneficiaireNom,
            'motif' => $motif
        ]);
    }
    
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(string $id, DemandeRepository $repo): JsonResponse
    {
        $d = $repo->find($id);
        if (!$d) return $this->json(['error' => 'Non trouvé'], 404);

        $lignes = [];
        if (method_exists($d, 'getLignes')) {
            foreach ($d->getLignes() as $l) {
                $compte = $l->getCompte();
                $lignes[] = [
                    'id' => $l->getId(),
                    'designation' => $l->getDesignation(),
                    'quantite' => $l->getQuantite(),
                    'prixUnitaire' => $l->getPrixUnitaireEstimatif(),
                    'total' => $l->getTotalLigne(),
                    'compte' => $compte ? [
                        'id' => $compte->getId(),
                        'numero' => $compte->getNumero(),
                        'libelle' => $compte->getLibelle()
                    ] : null
                ];
            }
        }
        
        $montant = method_exists($d, 'getMontantEstime') ? $d->getMontantEstime() : $d->getMontant();
        $dateObj = method_exists($d, 'getCreatedAt') ? $d->getCreatedAt() : $d->getDateCreation();
        $motif = method_exists($d, 'getDescription') ? $d->getDescription() : $d->getMotif();
        $ref = method_exists($d, 'getNumeroReference') ? $d->getNumeroReference() : null;
        $beneficiaireNom = $d->getBeneficiaire() ? $d->getBeneficiaire()->getNom() : $d->getDemandeur()->getNom();
        if (method_exists($d, 'getBeneficiaireAutre') && $d->getBeneficiaireAutre()) $beneficiaireNom = $d->getBeneficiaireAutre();

        // Informations éventuelles de bon de caisse associé via l'opération
        $bonData = null;
        if (method_exists($d, 'getOperation') && $d->getOperation()) {
            $operation = $d->getOperation();
            if (method_exists($operation, 'getBonDeCaisse') && $operation->getBonDeCaisse()) {
                $bon = $operation->getBonDeCaisse();
                $retour = $bon->getOperationRetourFond();
                $bonData = [
                    'id' => $bon->getId(),
                    'reference' => $bon->getReference(),
                    'hasRetourFond' => $retour !== null,
                    'retourFond' => $retour ? [
                        'id' => $retour->getId(),
                        'montant' => $retour->getMontant(),
                        'date' => $retour->getDate() ? $retour->getDate()->format('d/m/Y H:i') : null,
                    ] : null,
                ];
            }
        }

        return $this->json([
            'id' => $d->getId(),
            'numeroReference' => $ref,
            'titre' => $d->getTitre(),
            'montant' => $montant,
            'statut' => $d->getStatut(),
            'motif' => $motif,
            'date' => $dateObj ? $dateObj->format('d/m/Y') : 'N/A',
            'demandeur' => $d->getDemandeur()->getNom(),
            'beneficiaire' => $beneficiaireNom,
            'service' => $d->getDemandeur()->getService() ? $d->getDemandeur()->getService()->getNom() : 'N/A',
            'lignes' => $lignes,
            'bonDeCaisse' => $bonData,
        ]);
    }
}