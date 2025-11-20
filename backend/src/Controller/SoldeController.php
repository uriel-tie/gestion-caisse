<?php

namespace App\Controller;

use App\Repository\OperationRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/solde', name: 'api_solde_')]
class SoldeController extends AbstractController
{
    #[Route('', name: 'get', methods: ['GET'])]
    public function getSolde(OperationRepository $operationRepository): JsonResponse
    {
        // ICI : On veut juste le TOTAL, pas la liste
        try {
            $solde = $operationRepository->getSoldeActuel();
        } catch (\Exception $e) {
            $solde = 0.0;
        }

        return $this->json([
            'solde' => $solde,
            'devise' => 'EUR',
            'date' => date('c')
        ]);
    }
}