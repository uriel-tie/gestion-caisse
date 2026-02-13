<?php

namespace App\Entity;

use App\Repository\BonDeCaisseRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: BonDeCaisseRepository::class)]
#[ORM\Index(name: 'idx_bdc_reference', columns: ['reference'])]
class BonDeCaisse
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    /**
     * Référence métier du bon de caisse.
     * Par convention, on la cale sur la ref de l'opération principale.
     */
    #[ORM\Column(length: 100, unique: true)]
    private ?string $reference = null;

    /**
     * Opération principale qui a généré ce bon de caisse
     * (décaissement, encaissement, transfert, etc.)
     */
    #[ORM\OneToOne(inversedBy: 'bonDeCaisse', targetEntity: Operation::class)]
    #[ORM\JoinColumn(nullable: false, unique: true)]
    private ?Operation $operationPrincipale = null;

    /**
     * Demande éventuellement à l'origine de cette opération.
     * Nullable car toutes les opérations ne proviennent pas d'une demande.
     */
    #[ORM\ManyToOne(targetEntity: Demande::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Demande $demande = null;

    /**
     * Opération d'encaissement correspondant au retour de fond.
     * Contrainte métier : au plus UNE opération de retour de fond par bon.
     */
    #[ORM\OneToOne(targetEntity: Operation::class)]
    #[ORM\JoinColumn(nullable: true, unique: true)]
    private ?Operation $operationRetourFond = null;

    /**
     * Pour filtrer facilement par société comme le reste du modèle.
     */
    #[ORM\ManyToOne(targetEntity: Societe::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Societe $societe = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getReference(): ?string
    {
        return $this->reference;
    }

    public function setReference(string $reference): static
    {
        $this->reference = $reference;

        return $this;
    }

    public function getOperationPrincipale(): ?Operation
    {
        return $this->operationPrincipale;
    }

    public function setOperationPrincipale(Operation $operationPrincipale): static
    {
        $this->operationPrincipale = $operationPrincipale;

        return $this;
    }

    public function getDemande(): ?Demande
    {
        return $this->demande;
    }

    public function setDemande(?Demande $demande): static
    {
        $this->demande = $demande;

        return $this;
    }

    public function getOperationRetourFond(): ?Operation
    {
        return $this->operationRetourFond;
    }

    public function setOperationRetourFond(?Operation $operationRetourFond): static
    {
        $this->operationRetourFond = $operationRetourFond;

        return $this;
    }

    public function getSociete(): ?Societe
    {
        return $this->societe;
    }

    public function setSociete(?Societe $societe): static
    {
        $this->societe = $societe;

        return $this;
    }
}


