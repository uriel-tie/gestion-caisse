<?php

namespace App\Controller;

use App\Entity\ModePaiement;
use App\Repository\ModePaiementRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/modes', name: 'api_modes_')]
class ModePaiementController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(ModePaiementRepository $repo): JsonResponse
    {
        $modes = $repo->findAll();
        $data = [];
        foreach ($modes as $m) {
            $data[] = [
                'id' => $m->getId(),
                'libelle' => $m->getLibelle(),
                'type' => $m->getType(),
            ];
        }
        return $this->json($data);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');
        $data = json_decode($request->getContent(), true);

        $user = $this->getUser();
        if (!$user) {            
            return $this->json(['error' => 'Utilisateur non authentifié'], 401);
        }

        if (empty($data['libelle'])) return $this->json(['error' => 'Libellé obligatoire'], 400);

        $mode = new ModePaiement();
        $mode->setLibelle($data['libelle']);
        $mode->setType($data['type'] ?? 'AUTRE');
        $mode->setSociete($user->getSociete());

        $em->persist($mode);
        $em->flush();

        return $this->json(['message' => 'Mode créé', 'id' => $mode->getId()], 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(ModePaiement $mode, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');
        $data = json_decode($request->getContent(), true);

        if (isset($data['libelle'])) $mode->setLibelle($data['libelle']);
        if (isset($data['type'])) $mode->setType($data['type']);

        $em->flush();
        return $this->json(['message' => 'Mode mis à jour']);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(ModePaiement $mode, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');
        
        // Vérification optionnelle : est-ce que ce mode est utilisé dans des opérations ?
        if (!$mode->getOperations()->isEmpty()) {
            return $this->json(['error' => 'Impossible de supprimer un mode utilisé dans des opérations.'], 400);
        }

        $em->remove($mode);
        $em->flush();
        return $this->json(['message' => 'Mode supprimé']);
    }
}