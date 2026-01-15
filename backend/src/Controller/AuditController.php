<?php

namespace App\Controller;

use App\Repository\AuditRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\Pagination\Paginator; // <--- Important
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request; // <--- Pour récupérer les params
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/audits', name: 'api_audits_')]
#[IsGranted('ROLE_MANAGER')]
class AuditController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function index(
        AuditRepository $auditRepository, 
        EntityManagerInterface $entityManager,
        Request $request
    ): JsonResponse
    {
        // 1. Récupération des paramètres de pagination et filtres
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', 20);
        $startDate = $request->query->get('startDate'); // Format YYYY-MM-DD
        $endDate = $request->query->get('endDate');     // Format YYYY-MM-DD
        $search = $request->query->get('search');       // Recherche texte

        // 2. Désactiver le filtre Société (comme avant)
        if ($entityManager->getFilters()->isEnabled('societe_filter')) {
            $entityManager->getFilters()->disable('societe_filter');
        }

        try {
            // 3. Construction de la requête (QueryBuilder)
            $qb = $auditRepository->createQueryBuilder('a')
                ->leftJoin('a.utilisateur', 'u')
                ->addSelect('u')
                ->where('a.societe = :maSociete')
                ->setParameter('maSociete', $this->getUser()->getSociete())
                ->orderBy('a.date', 'DESC');

            // --- A. FILTRES SERVEUR ---
            
            // Filtre Date Début
            if ($startDate) {
                $qb->andWhere('a.date >= :start')
                   ->setParameter('start', new \DateTime($startDate . ' 00:00:00'));
            }

            // Filtre Date Fin
            if ($endDate) {
                $qb->andWhere('a.date <= :end')
                   ->setParameter('end', new \DateTime($endDate . ' 23:59:59'));
            }

            // Filtre Recherche (Action ou Nom de l'acteur)
            if ($search) {
                $qb->andWhere('a.action LIKE :search OR u.nom LIKE :search OR a.actorName LIKE :search')
                   ->setParameter('search', '%' . $search . '%');
            }

            // --- B. PAGINATION ---
            $qb->setFirstResult(($page - 1) * $limit)
               ->setMaxResults($limit);

            // Utilisation du Paginator pour avoir le compte total exact
            $paginator = new Paginator($qb);
            $totalItems = count($paginator);
            $totalPages = ceil($totalItems / $limit);

            // 4. Transformation des données
            $data = [];
            foreach ($paginator as $audit) {
                
                // ... (Votre logique de récupération des noms et cibles reste identique ici) ...
                $actorDisplayName = $audit->getActorName(); 
                if ($audit->getUtilisateur()) {
                    $actorDisplayName = $audit->getUtilisateur()->getNom();
                }

                $targetType = $this->cleanClassName($audit->getEntityClass());
                $targetLabel = '#' . $audit->getEntityId();
                // (Ajoutez ici votre logique de récupération du nom de la cible si besoin)

                $data[] = [
                    'id' => $audit->getId(),
                    'action' => $audit->getAction(),
                    'target_type' => $targetType,
                    'target_label' => $targetLabel,
                    'changes' => $audit->getChanges(),
                    'actor' => $actorDisplayName,
                    'ip' => $audit->getIpAddress(),
                    'date' => $audit->getDate()->format('d/m/Y H:i'),
                ];
            }

        } finally {
            // 5. Réactiver le filtre
            if (!$entityManager->getFilters()->isEnabled('societe_filter')) {
                $entityManager->getFilters()->enable('societe_filter');
            }
        }

        // 6. Réponse enrichie avec métadonnées de pagination
        return $this->json([
            'data' => $data,
            'pagination' => [
                'currentPage' => $page,
                'totalPages' => $totalPages,
                'totalItems' => $totalItems,
                'limit' => $limit
            ]
        ]);
    }

    private function cleanClassName(?string $fullClass): string 
    {
        if (!$fullClass) return 'Système';
        $parts = explode('\\', $fullClass);
        return end($parts);
    }
}