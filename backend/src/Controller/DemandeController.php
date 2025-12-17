<?php

namespace App\Controller;

use App\Entity\Demande;
use App\Entity\LigneDemande;
use App\Entity\Utilisateur;
use App\Entity\Societe;
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
        $data = json_decode($request->getContent(), true);

        // 1. Récupération Config Société & Rôles
        $societe = $em->getRepository(Societe::class)->findOneBy([]);
        $modeValidation = $societe ? $societe->getModeValidation() : Societe::MODE_STANDARD;
        $roles = $user->getRoles();

        if (empty($data['titre']) || empty($data['montant'])) {
            return $this->json(['error' => 'Champs obligatoires manquants'], 400);
        }

        $demande = new Demande();
        $demande->setTitre($data['titre']);
        
        // Gestion montant
        if (method_exists($demande, 'setMontantEstime')) {
            $demande->setMontantEstime((string)$data['montant']);
        } else {
            $demande->setMontant((float)$data['montant']);
        }

        $demande->setType($data['type'] ?? 'FICHE_BESOIN');
        $demande->setDemandeur($user);

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
                $demande->addLigne($ligne);
            }
        }

        $em->persist($demande);
        $em->flush();

        return $this->json(['id' => $demande->getId(), 'statut' => $demande->getStatut()], 201);
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

    // ... (Les autres méthodes listCurrentUser, search, show restent inchangées comme avant) ...
    // Je les remets ici pour que le fichier soit complet si tu fais un copier-coller

    #[Route('/me', name: 'list_current_user', methods: ['GET'])]
    public function listCurrentUser(DemandeRepository $repo): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $demandes = $repo->findBy(['demandeur' => $user], ['createdAt' => 'DESC']); 

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
        return $this->json($data);
    }
    
    #[Route('/to-validate', name: 'list_to_validate', methods: ['GET'])]
    public function listToValidate(DemandeRepository $repo): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $roles = $user->getRoles();

        $qb = $repo->createQueryBuilder('d')
            ->join('d.demandeur', 'u')
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
                $lignes[] = [
                    'id' => $l->getId(),
                    'designation' => $l->getDesignation(),
                    'quantite' => $l->getQuantite(),
                    'prixUnitaire' => $l->getPrixUnitaireEstimatif(),
                    'total' => $l->getTotalLigne()
                ];
            }
        }
        
        $montant = method_exists($d, 'getMontantEstime') ? $d->getMontantEstime() : $d->getMontant();
        $dateObj = method_exists($d, 'getCreatedAt') ? $d->getCreatedAt() : $d->getDateCreation();
        $motif = method_exists($d, 'getDescription') ? $d->getDescription() : $d->getMotif();
        $ref = method_exists($d, 'getNumeroReference') ? $d->getNumeroReference() : null;
        $beneficiaireNom = $d->getBeneficiaire() ? $d->getBeneficiaire()->getNom() : $d->getDemandeur()->getNom();
        if (method_exists($d, 'getBeneficiaireAutre') && $d->getBeneficiaireAutre()) $beneficiaireNom = $d->getBeneficiaireAutre();

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
            'lignes' => $lignes
        ]);
    }
}