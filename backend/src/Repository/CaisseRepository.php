<?php

namespace App\Repository;

use App\Entity\Caisse;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Caisse>
 */
class CaisseRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Caisse::class);
    }

    /**
     * Trouve toutes les caisses ouvertes
     */
    public function findOuvertes(): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.estOuverte = :val')
            ->setParameter('val', true)
            ->orderBy('c.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByEmploye(Utilisateur $utilisateur): ?Caisse
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.employeAssigne = :user')
            ->setParameter('user', $utilisateur)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}