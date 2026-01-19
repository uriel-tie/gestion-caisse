<?php

namespace App\Repository;

use App\Entity\Role;
use App\Entity\Societe;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class RoleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Role::class);
    }

    public function findBySociete(Societe $societe)
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.societe = :societe')
            ->andWhere('r.isActive = true')
            ->setParameter('societe', $societe)
            ->orderBy('r.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByIdAndSociete($id, Societe $societe)
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.id = :id')
            ->andWhere('r.societe = :societe')
            ->setParameter('id', $id)
            ->setParameter('societe', $societe)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
