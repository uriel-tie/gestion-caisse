<?php

namespace App\Repository;

use App\Entity\CompteComptable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CompteComptable>
 */
class CompteComptableRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CompteComptable::class);
    }

    /**
     * Retourne la liste triée par numéro (1, 2, 6, 7...)
     */
    public function findAllSorted(): array
    {
        return $this->createQueryBuilder('c')
            ->orderBy('c.numero', 'ASC')
            ->getQuery()
            ->getResult();
    }
}