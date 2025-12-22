<?php

namespace App\Service;

use App\Entity\Notification;
use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public function __construct(
        private EntityManagerInterface $em,
        private UtilisateurRepository $userRepo
    ) {}

    // Notifier une personne précise
    public function notify(Utilisateur $user, string $message, string $type = 'INFO', ?string $lien = null): void
    {
        $notif = new Notification();
        $notif->setUtilisateur($user);
        $notif->setMessage($message);
        $notif->setType($type);
        $notif->setLien($lien);
        
        $this->em->persist($notif);
        $this->em->flush();
    }

    // Notifier tout un groupe (ex: tous les Managers)
    public function notifyRole(string $role, string $message, string $type = 'INFO', ?string $lien = null): void
    {
        // On récupère tous les users qui ont ce rôle
        // Note: C'est une implémentation simple. Pour la prod avec 1000 users, on ferait une requête SQL custom.
        $users = $this->userRepo->findAll();
        
        foreach ($users as $user) {
            if (in_array($role, $user->getRoles())) {
                // On clone pour éviter les soucis de référence, ou on crée une nouvelle instance
                $notif = new Notification();
                $notif->setUtilisateur($user);
                $notif->setMessage($message);
                $notif->setType($type);
                $notif->setLien($lien);
                $this->em->persist($notif);
            }
        }
        $this->em->flush();
    }
}