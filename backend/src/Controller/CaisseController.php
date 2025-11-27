<?php

namespace App\Controller;

use App\Entity\Caisse;
use App\Entity\Utilisateur;
use App\Repository\CaisseRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/caisses', name: 'api_caisses_')]
class CaisseController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(CaisseRepository $repo): JsonResponse
    {
        $caisses = $repo->findAll();
        $data = [];
        foreach ($caisses as $c) {
            $employe = $c->getEmployeAssigne();
            $data[] = [
                'id' => $c->getId(),
                'nom' => $c->getNom(),
                'estOuverte' => $c->isEstOuverte(),
                'employeAssigne' => $employe ? [
                    'id' => $employe->getId(),
                    'nom' => $employe->getNom(),
                    'email' => $employe->getEmail(),
                ] : null
            ];
        }
        return $this->json($data);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        UtilisateurRepository $userRepo
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $data = json_decode($request->getContent(), true);

        if (empty($data['nom'])) {
            return $this->json(['error' => 'Nom de caisse obligatoire'], 400);
        }

        $caisse = new Caisse();
        $caisse->setNom($data['nom']);
        $caisse->setEstOuverte(false); // Fermée par défaut à la création

        if (!empty($data['employe_id'])) {
            $employe = $userRepo->find($data['employe_id']);
            if (!$employe) {
                return $this->json(['error' => 'Employé introuvable'], 404);
            }
            $this->detachExistingAssignment($employe, $em);
            $caisse->setEmployeAssigne($employe);
        }

        $em->persist($caisse);
        $em->flush();

        return $this->json(['message' => 'Caisse créée', 'id' => $caisse->getId()], 201);
    }

    #[Route('/{id}/assign', name: 'assign', methods: ['PATCH'])]
    public function assign(
        Caisse $caisse,
        Request $request,
        UtilisateurRepository $userRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $data = json_decode($request->getContent(), true);
        $employeId = $data['employe_id'] ?? null;

        if ($employeId) {
            $employe = $userRepo->find($employeId);
            if (!$employe) {
                return $this->json(['error' => 'Employé introuvable'], 404);
            }

            $this->detachExistingAssignment($employe, $em, $caisse);
            $caisse->setEmployeAssigne($employe);
        } else {
            $caisse->setEmployeAssigne(null);
        }

        $em->flush();

        return $this->json([
            'message' => 'Affectation mise à jour',
            'caisse' => [
                'id' => $caisse->getId(),
                'employe' => $caisse->getEmployeAssigne() ? $caisse->getEmployeAssigne()->getNom() : null,
            ]
        ]);
    }

    #[Route('/me', name: 'my_caisse', methods: ['GET'])]
    public function myCaisse(CaisseRepository $repo): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(null);
        }

        $caisse = $repo->findOneByEmploye($user);
        if (!$caisse) {
            return $this->json(null);
        }

        return $this->json([
            'id' => $caisse->getId(),
            'nom' => $caisse->getNom(),
            'estOuverte' => $caisse->isEstOuverte(),
        ]);
    }

    private function detachExistingAssignment(Utilisateur $employe, EntityManagerInterface $em, ?Caisse $current = null): void
    {
        $existing = $em->getRepository(Caisse::class)->findOneBy(['employeAssigne' => $employe]);
        $existingId = $existing?->getId()?->toRfc4122();
        $currentId = $current?->getId()?->toRfc4122();

        if ($existing && (!$current || $existingId !== $currentId)) {
            $existing->setEmployeAssigne(null);
            $em->persist($existing);
        }
    }
}