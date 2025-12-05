<?php

namespace App\Controller;

use App\Entity\Demande;
use App\Entity\Utilisateur;
use App\Repository\DemandeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/demandes', name: 'api_demandes_')]
#[IsGranted('ROLE_USER')]
final class DemandeController extends AbstractController
{
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        ValidatorInterface $validator
    ): JsonResponse {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['titre']) || empty($data['montant']) || empty($data['type'])) {
            return $this->json(['error' => 'Champs obligatoires manquants'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $demande = new Demande();
        $demande->setTitre($data['titre']);
        $demande->setMontantEstime((string)$data['montant']);
        $demande->setType($data['type']);
        $demande->setDemandeur($user);
        $demande->setStatut('ATTENTE_CHEF');
        $demande->setDescription($data['motif'] ?? '');

        $errors = $validator->validate($demande);
        if (count($errors) > 0) {
            return $this->json(['error' => (string)$errors], JsonResponse::HTTP_BAD_REQUEST);
        }

        $em->persist($demande);
        $em->flush();

        return $this->json(['id' => $demande->getId()], JsonResponse::HTTP_CREATED);
    }

    #[Route('/me', name: 'list_current_user', methods: ['GET'])]
    public function listCurrentUser(DemandeRepository $repo): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();

        // Récupération des entités
        $demandes = $repo->findBy(['demandeur' => $user], ['createdAt' => 'DESC']);

        // Construction manuelle du tableau (JSON) pour éviter CircularReferenceException
        $data = [];
        foreach ($demandes as $demande) {
            $data[] = [
                'id' => $demande->getId(),
                'titre' => $demande->getTitre(),
                'montant' => (string)$demande->getMontantEstime(),
                'type' => $demande->getType(),
                'statut' => $demande->getStatut(),
                'dateCreation' => $demande->getCreatedAt()?->format('Y-m-d H:i:s'),
                'motif' => $demande->getDescription(),
                'demandeur' => [
                    'nom' => $demande->getDemandeur()->getNom(),
                    'email' => $demande->getDemandeur()->getEmail()
                ]
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

        // On utilise le QueryBuilder pour faire des jointures (nécessaire pour filtrer par service)
        $qb = $repo->createQueryBuilder('d')
            ->join('d.demandeur', 'u') // On joint la table utilisateur (alias 'u')
            ->orderBy('d.createdAt', 'ASC');

        // SCÉNARIO 1 : C'est un MANAGER
        // Il doit voir TOUTES les demandes validées par les chefs (statut ATTENTE_MANAGER)
        if (in_array('ROLE_MANAGER', $roles)) {
            $qb->andWhere('d.statut = :statut')
               ->setParameter('statut', 'ATTENTE_MANAGER');
        } 
        // SCÉNARIO 2 : C'est un CHEF DE SERVICE
        // Il ne doit voir QUE les demandes de SON service (statut ATTENTE_CHEF)
        elseif (in_array('ROLE_CHEF_SERVICE', $roles)) {
            $service = $user->getService();

            if (!$service) {
                // Si le chef n'est affecté à aucun service, il ne voit rien (sécurité)
                return $this->json([]);
            }

            $qb->andWhere('d.statut = :statut')
               ->andWhere('u.service = :service') // FILTRE MAGIQUE : Seulement les gens de son service
               ->setParameter('statut', 'ATTENTE_CHEF')
               ->setParameter('service', $service);
        }else {
    return $this->json([
        'error' => 'DEBUG MODE : Accès refusé',
        'roles_trouves_dans_token' => $roles, // On veut voir ça !
        'role_attendu' => 'ROLE_CHEF_SERVICE',
        'user_connecte' => $user->getUserIdentifier()
    ], 403);
}

        $demandes = $qb->getQuery()->getResult();
        
        // Construction manuelle du JSON
        $data = [];
        foreach ($demandes as $d) {
            $data[] = [
                'id' => $d->getId(),
                'titre' => $d->getTitre(),
                'montant' => $d->getMontantEstime(),
                // On affiche le nom et le service pour info
                'demandeur' => $d->getDemandeur()->getNom() . ' (' . $d->getDemandeur()->getEmail() . ')',
                'type' => $d->getType(),
                'date' => $d->getCreatedAt()->format('Y-m-d'),
                'motif' => $d->getDescription()
            ];
        }

        return $this->json($data);
    }

    #[Route('/{id}/workflow', name: 'workflow_action', methods: ['PATCH'])]
    public function workflowAction(Demande $demande, Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);
        $action = $data['action'] ?? null;

        if ($demande->getStatut() === 'ATTENTE_CHEF') {
            if ($action === 'valider') $demande->setStatut('ATTENTE_MANAGER');
            elseif ($action === 'refuser') $demande->setStatut('REFUSEE');
        }
        elseif ($demande->getStatut() === 'ATTENTE_MANAGER') {
            if ($action === 'valider') $demande->setStatut('VALIDEE_A_PAYER');
            elseif ($action === 'refuser') $demande->setStatut('REFUSEE');
        }
        elseif ($demande->getStatut() === 'VALIDEE_A_PAYER') {
            if ($action === 'payer') {
                $demande->setStatut('PAYEE');
                $demande->setCaissierTraitant($user);
            }
        }

        $em->flush();
        return $this->json(['status' => $demande->getStatut()]);
    }

    #[Route('/search/{id}', name: 'search_by_id', methods: ['GET'])]
    public function searchById(string $id, DemandeRepository $repo): JsonResponse
    {
        $demande = $repo->find($id);
        if (!$demande) return $this->json(['error' => 'Demande introuvable'], 404);

        return $this->json([
            'id' => $demande->getId(),
            'titre' => $demande->getTitre(),
            'montant' => $demande->getMontantEstime(),
            'statut' => $demande->getStatut(),
            // CORRECTION ICI AUSSI
            'demandeur' => $demande->getDemandeur()->getNom() . ' (' . $demande->getDemandeur()->getEmail() . ')',
            'type' => $demande->getType(),
            'description' => $demande->getDescription()
        ]);
    }
}