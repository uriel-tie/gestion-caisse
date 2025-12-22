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
        // On récupère les 100 derniers logs
        $audits = $auditRepository->findBy([], ['date' => 'DESC'], 100);

        $data = [];
        foreach ($audits as $audit) {
            $data[] = [
                'id' => $audit->getId(),
                'action' => $audit->getAction(), // CREATE, UPDATE
                'target' => $audit->getEntityClass() . ' #' . $audit->getEntityId(),
                'changes' => $audit->getChanges(), // Le JSON complet
                'actor' => $audit->getActorName(),
                'ip' => $audit->getIpAddress(),
                'date' => $audit->getDate()->format('d/m/Y H:i'),
                // Optionnel : Couleurs pour le frontend
                'color' => match($audit->getAction()) {
                    'CREATE' => 'green',
                    'UPDATE' => 'orange',
                    'DELETE' => 'red',
                    default => 'gray'
                }
            ];
        }

        return $this->json($data);
    }
}