<?php

namespace App\Repository;

use App\Entity\Operation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use App\Entity\SessionCaisse;

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

    /**
     * Recherche avancée avec filtres et pagination
     */
    public function findWithFilters(array $filters, int $page = 1, int $limit = 15, ?\App\Entity\Caisse $caisseRestrict = null, ?\App\Entity\Caisse $caisseFilter = null)
    {
        $qb = $this->createQueryBuilder('o')
            ->orderBy('o.date', 'DESC');

        // 1. Restriction Sécurité (Si c'est un caissier, il ne voit que sa caisse)
        if ($caisseRestrict) {
            $qb->join('o.sessionCaisse', 's')
               ->andWhere('s.caisse = :caisseRestrict')
               ->setParameter('caisseRestrict', $caisseRestrict);
        }

        // 2. Filtre par caisse (pour les managers)
        if ($caisseFilter) {
            // Si on n'a pas déjà fait le join pour caisseRestrict, on le fait maintenant
            if (!$caisseRestrict) {
                $qb->join('o.sessionCaisse', 's');
            }
            $qb->andWhere('s.caisse = :caisseFilter')
               ->setParameter('caisseFilter', $caisseFilter);
        }

        // 3. Filtres Dynamiques
        if (!empty($filters['type'])) {
            $qb->andWhere('o.type = :type')
               ->setParameter('type', $filters['type']);
        }

        if (!empty($filters['date_debut'])) {
            $qb->andWhere('o.date >= :debut')
               ->setParameter('debut', new \DateTime($filters['date_debut'] . ' 00:00:00'));
        }

        if (!empty($filters['date_fin'])) {
            $qb->andWhere('o.date <= :fin')
               ->setParameter('fin', new \DateTime($filters['date_fin'] . ' 23:59:59'));
        }

        if (!empty($filters['mode'])) {
             // Suppose que tu passes l'ID ou le libellé du mode
             $qb->join('o.modePaiement', 'm')
                ->andWhere('m.libelle = :mode')
                ->setParameter('mode', $filters['mode']);
        }
        
        if (!empty($filters['statut'])) {
            $qb->andWhere('o.statut = :statut')
               ->setParameter('statut', $filters['statut']);
        }

        if (!empty($filters['compte'])) {
            // On suppose que l'entité Operation stocke le numéro (ex: '606') dans la colonne compteComptable
            $qb->andWhere('o.compteComptable LIKE :compte')
               ->setParameter('compte', '%' . $filters['compte'] . '%');
        }

        if (!empty($filters['ref'])) {
            // Recherche par référence (ID de l'opération ou référence du bon de caisse)
            $qb->andWhere('o.id LIKE :ref OR o.ref LIKE :ref')
               ->setParameter('ref', '%' . $filters['ref'] . '%');
        }

        // 4. Pagination
        $query = $qb->getQuery();
        
        // On utilise Doctrine Paginator pour gérer correctement le LIMIT/OFFSET
        $paginator = new \Doctrine\ORM\Tools\Pagination\Paginator($query);
        
        $paginator->getQuery()
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        return $paginator;
    }

    /**
     * Trouve les dernières opérations liées à une Caisse spécifique
     */
    public function findLatestByCaisse(\App\Entity\Caisse $caisse, int $limit = 10): array
    {
        return $this->createQueryBuilder('o')
            ->join('o.sessionCaisse', 's') // On passe par la session
            ->where('s.caisse = :caisse')  // On filtre sur la caisse
            ->setParameter('caisse', $caisse)
            ->orderBy('o.date', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
    
    public function getSoldeMouvementsSession(SessionCaisse $session): float
    {
        $qb = $this->createQueryBuilder('o')
            ->select('SUM(o.montant) as total, o.type')
            ->where('o.sessionCaisse = :session')
            ->andWhere('o.statut = :statut') // Seules les opérations validées comptent
            ->setParameter('session', $session)
            ->setParameter('statut', 'VALIDEE')
            ->groupBy('o.type');

        $results = $qb->getQuery()->getResult();

        $solde = 0.0;
        foreach ($results as $row) {
            $montant = $row['total'] === null ? 0.0 : (float) $row['total'];
            if ($row['type'] === 'ENCAISSEMENT') {
                $solde += $montant;
            } elseif ($row['type'] === 'DECAISSEMENT') {
                $solde -= $montant;
            }
        }

        return $solde;
    }

    public function getSumEntreesBySession(\App\Entity\SessionCaisse $session): float
{
    return (float) $this->createQueryBuilder('o')
        ->select('SUM(o.montant)')
        ->where('o.sessionCaisse = :session')
        ->andWhere('o.type = :type') // Adapte selon tes types ('ENCAISSEMENT', 'ENTREE'...)
        ->setParameter('session', $session)
        ->setParameter('type', 'ENCAISSEMENT') 
        ->getQuery()
        ->getSingleScalarResult();
}

public function getSumSortiesBySession(\App\Entity\SessionCaisse $session): float
{
    return (float) $this->createQueryBuilder('o')
        ->select('SUM(o.montant)')
        ->where('o.sessionCaisse = :session')
        ->andWhere('o.type = :type') // Adapte selon tes types ('DECAISSEMENT', 'SORTIE'...)
        ->setParameter('session', $session)
        ->setParameter('type', 'DECAISSEMENT')
        ->getQuery()
        ->getSingleScalarResult();
}
}