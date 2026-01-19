<?php

namespace App\Controller;

use App\Entity\Role;
use App\Entity\Societe;
use App\Entity\Utilisateur;
use App\Repository\RoleRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/roles')]
class RoleController extends AbstractController
{
    public function __construct(
        private RoleRepository $roleRepo,
        private EntityManagerInterface $em,
        private UtilisateurRepository $userRepo
    ) {}

    /**
     * GET /api/roles - Récupérer les rôles personnalisés de la société
     */
    #[Route('', name: 'roles_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Non autorisé'], 401);

        $societe = $user->getSociete();
        if (!$societe) return $this->json(['error' => 'Pas de société associée'], 400);

        $roles = $this->roleRepo->findBySociete($societe);

        return $this->json(array_map(fn(Role $r) => $this->formatRole($r), $roles));
    }

    /**
     * POST /api/roles - Créer un rôle personnalisé
     */
    #[Route('', name: 'roles_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Non autorisé'], 401);

        // Vérifier que l'utilisateur est manager
        if (!in_array('ROLE_MANAGER', $user->getRoles())) {
            return $this->json(['error' => 'Seuls les managers peuvent créer des rôles'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $societe = $user->getSociete();

        if (!$societe) return $this->json(['error' => 'Pas de société associée'], 400);

        try {
            $role = new Role();
            $role->setNom($data['nom'] ?? 'Rôle sans nom');
            $role->setBaseRole($data['baseRole'] ?? 'ROLE_MANAGER');
            $role->setRestrictions($data['restrictions'] ?? []);
            $role->setAdminRestrictions($data['adminRestrictions'] ?? []);
            $role->setSociete($societe);

            $this->em->persist($role);
            $this->em->flush();

            return $this->json($this->formatRole($role), 201);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * PATCH /api/roles/{id} - Modifier un rôle personnalisé
     */
    #[Route('/{id}', name: 'roles_update', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Non autorisé'], 401);

        $societe = $user->getSociete();
        $role = $this->roleRepo->findOneByIdAndSociete($id, $societe);

        if (!$role) return $this->json(['error' => 'Rôle non trouvé'], 404);

        $data = json_decode($request->getContent(), true);

        if (isset($data['nom'])) $role->setNom($data['nom']);
        if (isset($data['baseRole'])) $role->setBaseRole($data['baseRole']);
        if (isset($data['restrictions'])) $role->setRestrictions($data['restrictions']);
        if (isset($data['adminRestrictions'])) $role->setAdminRestrictions($data['adminRestrictions']);
        if (isset($data['isActive'])) $role->setIsActive($data['isActive']);

        $role->setUpdatedAt(new \DateTimeImmutable());

        $this->em->flush();

        return $this->json($this->formatRole($role));
    }

    /**
     * DELETE /api/roles/{id} - Supprimer un rôle personnalisé
     */
    #[Route('/{id}', name: 'roles_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Non autorisé'], 401);

        $societe = $user->getSociete();
        $role = $this->roleRepo->findOneByIdAndSociete($id, $societe);

        if (!$role) return $this->json(['error' => 'Rôle non trouvé'], 404);

        // Vérifier qu'aucun utilisateur n'a ce rôle
        $usersWithRole = $this->userRepo->findBy(['customRole' => $role]);
        if (count($usersWithRole) > 0) {
            return $this->json(['error' => 'Impossible de supprimer : des utilisateurs ont ce rôle'], 409);
        }

        $this->em->remove($role);
        $this->em->flush();

        return $this->json(['message' => 'Rôle supprimé']);
    }

    /**
     * GET /api/roles/available-base-roles - Récupérer les rôles de base disponibles
     */
    #[Route('/available-base-roles', name: 'roles_available', methods: ['GET'])]
    public function availableBaseRoles(): JsonResponse
    {
        return $this->json([
            'ROLE_MANAGER' => 'Manager',
            'ROLE_CHEF_SERVICE' => 'Chef de Service',
            'ROLE_EMPLOYE' => 'Employé',
        ]);
    }

    private function formatRole(Role $role): array
    {
        return [
            'id' => $role->getId()->toRfc4122(),
            'nom' => $role->getNom(),
            'baseRole' => $role->getBaseRole(),
            'restrictions' => $role->getRestrictions(),
            'adminRestrictions' => $role->getAdminRestrictions(),
            'isActive' => $role->isActive(),
            'createdAt' => $role->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $role->getUpdatedAt()->format('Y-m-d H:i:s'),
        ];
    }
}
