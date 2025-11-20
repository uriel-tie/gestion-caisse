<?php

namespace App\Repository;

use App\Entity\Demande;
use App\Entity\Service;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Demande>
 */
class DemandeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Demande::class);
    }

    /**
     * Trouve les demandes qu'un Chef de Service doit valider
     * Logique : Statut "ATTENTE_CHEF" + Demandeurs appartenant au service du Chef
     */
    public function findPendingForChef(Service $service): array
    {
        return $this->createQueryBuilder('d')
            ->join('d.demandeur', 'u') // On joint l'utilisateur pour filtrer par service
            ->andWhere('d.statut = :statut')
            ->andWhere('u.service = :service') // Plus robuste que de passer la liste des employés
            ->setParameter('statut', Demande::STATUT_ATTENTE_CHEF)
            ->setParameter('service', $service)
            ->orderBy('d.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les demandes que le Manager doit valider
     */
    public function findPendingForManager(): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.statut = :statut')
            ->setParameter('statut', Demande::STATUT_ATTENTE_MANAGER)
            ->orderBy('d.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les demandes validées prêtes à être payées par le Caissier
     */
    public function findReadyToPay(): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.statut = :statut')
            ->setParameter('statut', Demande::STATUT_VALIDEE)
            ->orderBy('d.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByDemandeur(Utilisateur $user): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.demandeur = :user')
            ->setParameter('user', $user)
            ->orderBy('d.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}