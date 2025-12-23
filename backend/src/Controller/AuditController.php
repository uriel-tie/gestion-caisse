<?php

namespace App\Controller;

use App\Repository\AuditRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/audits', name: 'api_audits_')]
#[IsGranted('ROLE_MANAGER')]
class AuditController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function index(AuditRepository $auditRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $audits = $auditRepository->findBy([], ['date' => 'DESC'], 100);

        $data = [];
        foreach ($audits as $audit) {
            
            // --- GESTION ACTEUR (Comme vu précédemment) ---
            $actorDisplayName = $audit->getActorName(); 
            if (method_exists($audit, 'getUtilisateur') && $audit->getUtilisateur()) {
                $actorDisplayName = $audit->getUtilisateur()->getNom();
            }

            // --- GESTION CIBLE (TARGET) ---
            // 1. Le Type (ex: "Utilisateur", "Caisse", "Demande")
            $targetType = $audit->getEntityClass();
            
            // 2. Le Label (ex: "Caisse Principale", "Doe")
            $targetLabel = '#' . $audit->getEntityId(); // Par défaut : l'ID

            try {
                $fullClassName = 'App\\Entity\\' . $targetType;
                
                if (class_exists($fullClassName)) {
                    $targetEntity = $entityManager->find($fullClassName, $audit->getEntityId());

                    if ($targetEntity) {
                        // On cherche le nom selon l'entité
                        if (method_exists($targetEntity, 'getNom')) {
                            $targetLabel = $targetEntity->getNom();
                        } elseif (method_exists($targetEntity, 'getTitre')) {
                            $targetLabel = $targetEntity->getTitre();
                        }
                    } else {
                        $targetLabel .= ' (Supprimé)';
                    }
                }
            } catch (\Exception $e) {
                // On garde l'ID par défaut en cas d'erreur
            }

            $data[] = [
                'id' => $audit->getId(),
                'action' => $audit->getAction(),
                
                // NOUVEAUX CHAMPS POUR LE FRONT
                'target_type' => $targetType,  // ex: "Caisse"
                'target_label' => $targetLabel, // ex: "Caisse Principale"
                
                'changes' => $audit->getChanges(),
                'actor' => $actorDisplayName,
                'ip' => $audit->getIpAddress(),
                'date' => $audit->getDate()->format('d/m/Y H:i'),
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