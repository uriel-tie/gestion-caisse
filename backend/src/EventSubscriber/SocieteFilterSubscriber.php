<?php

namespace App\EventSubscriber;

use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Bundle\SecurityBundle\Security;

class SocieteFilterSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private Security $security,
        private EntityManagerInterface $em
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        $user = $this->security->getUser();

        // Si pas d'utilisateur ou pas un Utilisateur de notre App (ex: token invalide), on sort
        if (!$user instanceof Utilisateur) {
            return;
        }

        // Si c'est le SUPER ADMIN, on n'active PAS le filtre (il voit tout)
        if (in_array('ROLE_SUPER_ADMIN', $user->getRoles())) {
            return;
        }

        // Sinon, on récupère sa société
        $societe = $user->getSociete();
        
        if ($societe) {
            $filter = $this->em->getFilters()->enable('societe_filter');
            $filter->setParameter('societe_id', $societe->getId());
        }
    }

    public static function getSubscribedEvents(): array
    {
        return [
            // On se place assez tôt dans le processus
            KernelEvents::REQUEST => [['onKernelRequest', 5]],
        ];
    }
}