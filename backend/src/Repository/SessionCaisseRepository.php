<?php

namespace App\Repository;

use App\Entity\SessionCaisse;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SessionCaisse>
 */
class SessionCaisseRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SessionCaisse::class);
    }

    /**
     * Trouve la session active (OUVERTE) pour un caissier donné.
     * Indispensable pour créer une opération.
     */
    public function findSessionActive(Utilisateur $caissier): ?SessionCaisse
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.caissier = :caissier')
            ->andWhere('s.statut = :statut')
            ->setParameter('caissier', $caissier)
            ->setParameter('statut', SessionCaisse::STATUT_OUVERTE)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}