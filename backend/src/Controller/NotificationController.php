<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/notifications', name: 'api_notifications_')]
class NotificationController extends AbstractController
{
    // 1. Récupérer les notifications de l'utilisateur connecté
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(NotificationRepository $repo): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) return $this->json([]);

        // On récupère les 20 dernières, triées par date
        $notifs = $repo->findBy(
            ['user' => $user], 
            ['createdAt' => 'DESC'], 
            20
        );

        $data = [];
        $unreadCount = 0;

        foreach ($notifs as $n) {
            if (!$n->isIsRead()) $unreadCount++;
            
            $data[] = [
                'id' => $n->getId(),
                'message' => $n->getMessage(),
                'type' => $n->getType(),
                'link' => $n->getLink(),
                'isRead' => $n->isIsRead(),
                'date' => $n->getCreatedAt()->format('d/m H:i'), // Format court
                'time_ago' => $this->timeElapsedString($n->getCreatedAt())
            ];
        }

        return $this->json([
            'notifications' => $data,
            'unread_count' => $unreadCount
        ]);
    }

    // 2. Marquer une notification comme "Lue"
    #[Route('/{id}/read', name: 'mark_read', methods: ['PATCH'])]
    public function markAsRead(Notification $notification, EntityManagerInterface $em): JsonResponse
    {
        // Sécurité : on ne peut marquer que ses propres notifs
        if ($notification->getUser() !== $this->getUser()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $notification->setIsRead(true);
        $em->flush();

        return $this->json(['message' => 'Marquée comme lue']);
    }

    // 3. Tout marquer comme lu
    #[Route('/read-all', name: 'read_all', methods: ['PATCH'])]
    public function readAll(NotificationRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $repo->createQueryBuilder('n')
            ->update()
            ->set('n.isRead', 'true')
            ->where('n.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();

        return $this->json(['message' => 'Tout marqué comme lu']);
    }

    // Helper pour afficher "Il y a 5 min"
    private function timeElapsedString($datetime, $full = false) {
        $now = new \DateTime();
        $ago = $datetime;
        $diff = $now->diff($ago);

        $diff->w = floor($diff->d / 7);
        $diff->d -= $diff->w * 7;

        $string = [
            'y' => 'an', 'm' => 'mois', 'w' => 'semaine',
            'd' => 'jour', 'h' => 'heure', 'i' => 'minute', 's' => 'seconde',
        ];
        foreach ($string as $k => &$v) {
            if ($diff->$k) {
                $v = $diff->$k . ' ' . $v . ($diff->$k > 1 && $k != 'm' ? 's' : '');
            } else {
                unset($string[$k]);
            }
        }

        if (!$full) $string = array_slice($string, 0, 1);
        return $string ? 'Il y a ' . implode(', ', $string) : 'À l\'instant';
    }
}