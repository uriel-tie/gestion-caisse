<?php

namespace App\Repository;

use App\Entity\Operation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Operation>
 */
class OperationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Operation::class);
    }

    /**
     * Calcule le solde actuel (Encaissements Validés - Décaissements Validés)
     */
    public function getSoldeActuel(): float
    {
        $qb = $this->createQueryBuilder('o')
            ->select('SUM(o.montant) as total, o.type')
            ->where('o.statut = :statut')
            ->setParameter('statut', 'VALIDEE') // Attention à bien utiliser la string exacte définie dans ton entité
            ->groupBy('o.type');

        $results = $qb->getQuery()->getResult();

        $solde = 0.0;
        foreach ($results as $row) {
            // Sécurité : si total est null (pas d'opération), on prend 0
            $montant = $row['total'] === null ? 0.0 : (float) $row['total'];

            if ($row['type'] === 'ENCAISSEMENT') {
                $solde += $montant;
            } elseif ($row['type'] === 'DECAISSEMENT') {
                $solde -= $montant;
            }
        }

        return $solde;
    }

    public function findJournal(\DateTimeImmutable $dateDebut, \DateTimeImmutable $dateFin): array
    {
        return $this->createQueryBuilder('o')
            ->where('o.date >= :debut')
            ->andWhere('o.date <= :fin')
            ->andWhere('o.statut != :statut') 
            ->setParameter('debut', $dateDebut)
            ->setParameter('fin', $dateFin)
            ->setParameter('statut', 'BROUILLON')
            ->orderBy('o.date', 'DESC')
            ->addOrderBy('o.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
    
    public function findLatest(int $limit = 10): array
    {
        return $this->createQueryBuilder('o')
            ->orderBy('o.date', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}