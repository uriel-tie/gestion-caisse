<?php

namespace App\Doctrine\Filter;

use App\Entity\Utilisateur;
use Doctrine\ORM\Mapping\ClassMetadata;
use Doctrine\ORM\Query\Filter\SQLFilter;

class SocieteFilter extends SQLFilter
{
    public function addFilterConstraint(ClassMetadata $targetEntity, $targetTableAlias): string
    {
        // Liste des entités à cloisonner
        $societeAwareEntities = [
            Utilisateur::class,
        ];

        if (!in_array($targetEntity->reflClass->name, $societeAwareEntities)) {
            return '';
        }

        // Utilisation de try/catch pour récupérer le paramètre en toute sécurité
        try {
            $societeId = $this->getParameter('societe_id');
        } catch (\InvalidArgumentException $e) {
            // Si le paramètre n'est pas encore défini, on ne filtre pas (évite le crash au login)
            return '';
        }

        if (empty($societeId)) {
            return '';
        }

        // Important : PostgreSQL et MySQL utilisent souvent des guillemets différents pour les alias
        // On retourne la contrainte SQL
        return sprintf('%s.societe_id = %s', $targetTableAlias, $societeId);
    }
}