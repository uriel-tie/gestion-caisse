<?php

namespace App\Controller;

use App\Entity\Demande;
use App\Entity\LigneDemande;
use App\Entity\Utilisateur;
use App\Repository\DemandeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/demandes', name: 'api_demandes_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class DemandeController extends AbstractController
{
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse 
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['titre']) || empty($data['montant'])) {
            return $this->json(['error' => 'Champs obligatoires manquants'], 400);
        }

        $demande = new Demande();
        $demande->setTitre($data['titre']);
        
        // Compatible avec ton entité qui utilise setMontantEstime
        if (method_exists($demande, 'setMontantEstime')) {
            $demande->setMontantEstime((string)$data['montant']);
        } else {
            $demande->setMontant((float)$data['montant']);
        }

        $demande->setType($data['type'] ?? 'FICHE_BESOIN');
        $demande->setDemandeur($user);
        
        // Gestion de la description/motif
        $description = $data['motif'] ?? '';
        if (method_exists($demande, 'setDescription')) {
            $demande->setDescription($description);
        } elseif (method_exists($demande, 'setMotif')) {
            $demande->setMotif($description);
        }

        // WORKFLOW
        $roles = $user->getRoles();

        if (in_array('ROLE_MANAGER', $roles)) {
            // Le Manager s'auto-valide -> Directement prêt à payer
            $demande->setStatut('VALIDEE_A_PAYER');
        } 
        elseif (in_array('ROLE_CHEF_SERVICE', $roles)) {
            // Le Chef saute l'étape Chef -> En attente Manager
            $demande->setStatut('ATTENTE_MANAGER');
        } 
        else {
            // Les autres (Employés) -> En attente Chef
            $demande->setStatut('ATTENTE_CHEF');
        }

        // REFERENCE (Si le champ existe dans l'entité)
        if (method_exists($demande, 'setNumeroReference')) {
            $ref = 'DEM-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
            $demande->setNumeroReference($ref);
        }

        // LIGNES (Si le champ existe)
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

        return $this->json(['id' => $demande->getId()], 201);
    }

    #[Route('/me', name: 'list_current_user', methods: ['GET'])]
    public function listCurrentUser(DemandeRepository $repo): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        // Trie par date de création DESC
        $demandes = $repo->findBy(['demandeur' => $user], ['createdAt' => 'DESC']); 

        $data = [];
        foreach ($demandes as $d) {
            // Sécurisation des getters pour éviter l'erreur 500
            $montant = method_exists($d, 'getMontantEstime') ? $d->getMontantEstime() : $d->getMontant();
            $dateObj = method_exists($d, 'getCreatedAt') ? $d->getCreatedAt() : $d->getDateCreation();
            $ref = method_exists($d, 'getNumeroReference') ? $d->getNumeroReference() : null;

            $data[] = [
                'id' => $d->getId(),
                'numeroReference' => $ref,
                'titre' => $d->getTitre(),
                'montant' => $montant,
                'type' => $d->getType(),
                'statut' => $d->getStatut(),
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
            // Sécurisation maximale des getters
            $montant = method_exists($d, 'getMontantEstime') ? $d->getMontantEstime() : $d->getMontant();
            // Attention au getter de date : getCreatedAt() ou getDateCreation()
            $dateObj = method_exists($d, 'getCreatedAt') ? $d->getCreatedAt() : $d->getDateCreation();
            $motif = method_exists($d, 'getDescription') ? $d->getDescription() : $d->getMotif();
            $ref = method_exists($d, 'getNumeroReference') ? $d->getNumeroReference() : null;

            $data[] = [
                'id' => $d->getId(),
                'titre' => $d->getTitre(),
                'montant' => $montant,
                'demandeur' => $d->getDemandeur()->getNom(),
                'type' => $d->getType(),
                'date' => $dateObj ? $dateObj->format('Y-m-d') : 'N/A',
                'motif' => $motif,
                'numeroReference' => $ref,
            ];
        }
        return $this->json($data);
    }
    
    #[Route('/{id}/workflow', name: 'workflow_action', methods: ['PATCH'])]
    public function workflowAction(Demande $demande, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $action = $data['action'] ?? null;
        
        if ($action === 'valider') {
            if ($demande->getStatut() === 'ATTENTE_CHEF') $demande->setStatut('ATTENTE_MANAGER');
            elseif ($demande->getStatut() === 'ATTENTE_MANAGER') $demande->setStatut('VALIDEE_A_PAYER');
        } elseif ($action === 'refuser') {
            $demande->setStatut('REFUSEE');
        }

        $em->flush();
        return $this->json(['status' => $demande->getStatut()]);
    }

    #[Route('/search/{query}', name: 'search_by_ref', methods: ['GET'])]
    public function searchByReference(string $query, DemandeRepository $repo): JsonResponse
    {
        // 1. Recherche prioritaire par Numéro de Référence (ex: DEM-2025...)
        $demande = $repo->findOneBy(['numeroReference' => $query]);

        // 2. Si pas trouvé, on regarde si c'est un UUID valide pour chercher par ID
        if (!$demande && \Symfony\Component\Uid\Uuid::isValid($query)) {
            $demande = $repo->find($query);
        }

        if (!$demande) {
            return $this->json(['error' => 'Aucune demande trouvée avec cette référence.'], 404);
        }

        // Sécurisation des données renvoyées
        $montant = method_exists($demande, 'getMontantEstime') ? $demande->getMontantEstime() : $demande->getMontant();
        $motif = method_exists($demande, 'getDescription') ? $demande->getDescription() : $demande->getMotif();
        $demandeurName = $demande->getDemandeur() ? $demande->getDemandeur()->getNom() : 'Inconnu';
        $demandeurEmail = $demande->getDemandeur() ? $demande->getDemandeur()->getEmail() : '';

        return $this->json([
            'id' => $demande->getId(),
            'numeroReference' => $demande->getNumeroReference(),
            'titre' => $demande->getTitre(),
            'montant' => $montant,
            'statut' => $demande->getStatut(),
            'demandeur' => "$demandeurName ($demandeurEmail)",
            'type' => $demande->getType(),
            'motif' => $motif
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(string $id, DemandeRepository $repo): JsonResponse
    {
        $d = $repo->find($id);
        if (!$d) return $this->json(['error' => 'Non trouvé'], 404);

        // Récupération des lignes si elles existent
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

        return $this->json([
            'id' => $d->getId(),
            'numeroReference' => $ref,
            'titre' => $d->getTitre(),
            'montant' => $montant,
            'statut' => $d->getStatut(),
            'type' => $d->getType(),
            'motif' => $motif,
            'date' => $dateObj ? $dateObj->format('d/m/Y') : 'N/A',
            'demandeur' => $d->getDemandeur()->getNom(),
            'service' => $d->getDemandeur()->getService() ? $d->getDemandeur()->getService()->getNom() : 'N/A',
            'lignes' => $lignes
        ]);
    }
}