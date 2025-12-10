<?php

namespace App\Controller;

use App\Repository\AuditRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/audits', name: 'api_audits_')]
#[IsGranted('ROLE_MANAGER')]
class AuditController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function index(AuditRepository $auditRepository): JsonResponse
    {
        $audits = $auditRepository->findBy([], ['date' => 'DESC'], 100);

        $data = [];
        foreach ($audits as $audit) {
            $user = $audit->getUtilisateur();
            
            $data[] = [
                'id' => $audit->getId(),
                'action' => $audit->getAction(),
                'details' => $audit->getDetails(),
                'date' => $audit->getDate()->format('d/m/Y H:i:s'),
                'utilisateur' => $user ? [
                    'id' => $user->getId(),
                    'nom' => $user->getNom(),
                    'email' => $user->getEmail(),
                    'service' => $user->getService() ? $user->getService()->getNom() : 'N/A'
                ] : [
                    'nom' => 'Système / Inconnu',
                    'email' => ''
                ]
            ];
        }

        return $this->json($data);
    }
}