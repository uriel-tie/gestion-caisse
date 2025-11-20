<?php

namespace App\Controller;

use App\Repository\OperationRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/operations', name: 'api_operations_')]
class OperationController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function index(OperationRepository $operationRepository): JsonResponse
    {
        // ICI : On veut la LISTE des 10 derniers
        $operations = $operationRepository->findLatest(10);

        $data = [];
        foreach ($operations as $op) {
            $data[] = [
                'id' => $op->getId(),
                'type' => $op->getType(),
                'montant' => (float) $op->getMontant(),
                'date' => $op->getDate()->format('d/m/Y H:i'),
                'statut' => $op->getStatut(),
                'mode' => $op->getModePaiement() ? $op->getModePaiement()->getLibelle() : 'N/A',
                'utilisateur' => $op->getUtilisateur() ? $op->getUtilisateur()->getNom() : 'Inconnu',
            ];
        }

        return $this->json($data);
    }
}