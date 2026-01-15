<?php

namespace App\Controller;

use App\Entity\Service;
use App\Repository\ServiceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/services', name: 'api_services_')]
class ServiceController extends AbstractController
{
    // Lister les services
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(ServiceRepository $repo): JsonResponse
    {
        $services = $repo->findAll();
        $data = [];
        foreach ($services as $s) {
            $data[] = [
                'id' => $s->getId(),
                'nom' => $s->getNom(),
            ];
        }
        return $this->json($data);
    }

    // Créer un service (Manager uniquement)
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER'); // Sécurité

        $data = json_decode($request->getContent(), true);

        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié'], 401);
        }

        if (empty($data['nom'])) {
            return $this->json(['error' => 'Le nom est obligatoire'], 400);
        }

        $service = new Service();
        $service->setNom($data['nom']);
        $service->setSociete($user->getSociete());

        $em->persist($service);
        $em->flush();

        return $this->json(['message' => 'Service créé', 'id' => $service->getId()], 201);
    }
}