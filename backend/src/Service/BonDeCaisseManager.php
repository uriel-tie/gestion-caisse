<?php

namespace App\Service;

use App\Entity\BonDeCaisse;
use App\Entity\Operation;
use App\Entity\Demande;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Service centralisant la logique de création / liaison des bons de caisse.
 */
class BonDeCaisseManager
{
    public function __construct(
        private readonly EntityManagerInterface $em
    ) {
    }

    /**
     * Crée (ou retourne) le bon de caisse associé à une opération.
     *
     * - La référence du bon est calée sur Operation::getRef().
     * - La demande est optionnelle (toutes les opérations ne viennent pas d'une demande).
     */
    public function creerPourOperation(Operation $operation, ?Demande $demande = null): BonDeCaisse
    {
        if ($operation->getBonDeCaisse()) {
            return $operation->getBonDeCaisse();
        }

        $bon = new BonDeCaisse();
        $bon->setOperationPrincipale($operation);
        // La référence opération peut être générée en PrePersist,
        // on accepte donc temporairement une chaine vide, mais idéalement
        // ce service est appelé après le flush de l'opération.
        $bon->setReference($operation->getRef() ?? '');
        $bon->setSociete($operation->getSociete());

        if ($demande) {
            $bon->setDemande($demande);
        } elseif ($operation->getDemande()) {
            // fallback : si la demande est déjà liée sur l'opération
            $bon->setDemande($operation->getDemande());
        }

        $operation->setBonDeCaisse($bon);

        $this->em->persist($bon);

        return $bon;
    }

    /**
     * Lie une opération d'encaissement comme retour de fond à un bon existant.
     * On ne gère qu'un seul retour de fond par bon (contrainte métier).
     */
    public function attacherRetourFond(BonDeCaisse $bon, Operation $operationRetourFond): void
    {
        if ($bon->getOperationRetourFond()) {
            throw new \LogicException('Ce bon de caisse possède déjà un retour de fond.');
        }

        $bon->setOperationRetourFond($operationRetourFond);
        $this->em->persist($bon);
    }
}


