<?php

namespace App\Repository;

use App\Entity\CompteLie;
use App\Entity\CompteComptable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CompteLie>
 */
class CompteLieRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CompteLie::class);
    }

    /**
     * Récupère tous les comptes "type" liés à une nature donnée
     */
    public function findTypesByNature(CompteComptable $nature): array
    {
        // Utiliser l'entité directement - Doctrine gère la comparaison
        return $this->createQueryBuilder('cl')
            ->innerJoin('cl.compteType', 'ct')
            ->where('cl.compteNature = :nature')
            ->setParameter('nature', $nature)
            ->getQuery()
            ->getResult();
    }

    /**
     * Récupère la nature d'un compte type donné
     */
    public function findNatureByType(CompteComptable $type): ?CompteLie
    {
        // Utiliser l'entité directement - Doctrine gère la comparaison
        return $this->createQueryBuilder('cl')
            ->where('cl.compteType = :type')
            ->setParameter('type', $type)
            ->getQuery()
            ->getOneOrNullResult();
    }
}

