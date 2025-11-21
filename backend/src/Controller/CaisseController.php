<?php

namespace App\Controller;

use App\Entity\Caisse;
use App\Repository\CaisseRepository;
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
            $data[] = [
                'id' => $c->getId(),
                'nom' => $c->getNom(),
                'estOuverte' => $c->isEstOuverte()
            ];
        }
        return $this->json($data);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $data = json_decode($request->getContent(), true);

        if (empty($data['nom'])) {
            return $this->json(['error' => 'Nom de caisse obligatoire'], 400);
        }

        $caisse = new Caisse();
        $caisse->setNom($data['nom']);
        $caisse->setEstOuverte(false); // Fermée par défaut à la création

        $em->persist($caisse);
        $em->flush();

        return $this->json(['message' => 'Caisse créée', 'id' => $caisse->getId()], 201);
    }
}