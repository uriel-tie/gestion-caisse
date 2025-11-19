<?php

namespace App\EventSubscriber;

use App\Entity\Utilisateur;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class JWTSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            // On s'abonne à l'événement "AUTHENTICATION_SUCCESS" du bundle JWT
            Events::AUTHENTICATION_SUCCESS => 'onAuthenticationSuccess',
        ];
    }

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        // 1. On récupère les données actuelles (juste le token pour l'instant)
        $data = $event->getData();
        
        // 2. On récupère l'utilisateur connecté
        $user = $event->getUser();

        // Vérification de sécurité pour s'assurer qu'on a bien notre entité Utilisateur
        if (!$user instanceof Utilisateur) {
            return;
        }

        // 3. On ajoute les informations personnalisées
        // Attention : getId() retourne un objet Uuid, on le force en string
        $data['user'] = [
            'id' => (string) $user->getId(),
            'nom' => $user->getNom(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
        ];

        // 4. On renvoie les nouvelles données modifiées
        $event->setData($data);
    }
}