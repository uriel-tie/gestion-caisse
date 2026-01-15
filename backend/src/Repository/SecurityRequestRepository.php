<?php

namespace App\Repository;

use App\Entity\SecurityRequest;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SecurityRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SecurityRequest::class);
    }

    /**
     * Compte les demandes de MDP oublié pour un utilisateur sur les dernières 24h
     */
    public function countRequestsToday(Utilisateur $user): int
    {
        return (int) $this->createQueryBuilder('s')
            ->select('count(s.id)')
            ->where('s.user = :user')
            ->andWhere('s.type = :type')
            ->andWhere('s.createdAt >= :start')
            ->setParameter('user', $user)
            ->setParameter('type', SecurityRequest::TYPE_PASSWORD_RESET)
            ->setParameter('start', new \DateTimeImmutable('today'))
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Trouve la dernière demande pour vérifier le délai de 2 heures
     */
    public function findLastRequest(Utilisateur $user): ?SecurityRequest
    {
        return $this->findOneBy(
            ['user' => $user, 'type' => SecurityRequest::TYPE_PASSWORD_RESET],
            ['createdAt' => 'DESC']
        );
    }
}