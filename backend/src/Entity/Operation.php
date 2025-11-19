<?php

namespace App\Entity;

use App\Repository\OperationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: OperationRepository::class)]
#[ORM\Index(name: 'idx_operation_date', columns: ['date'])] // Optimisation requise par le guide (Section 6)
class Operation
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 20)]
    private ?string $type = null; // ENCAISSEMENT, DECAISSEMENT

    // Utilisation de string pour les décimaux afin de garantir la précision comptable (pas de float !)
    #[ORM\Column(type: 'decimal', precision: 12, scale: 2)]
    private ?string $montant = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $date = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $compteComptable = null; // Ex: 530 (Caisse), 707 (Ventes)...

    #[ORM\Column(length: 20)]
    private string $statut = 'BROUILLON'; // BROUILLON, VALIDEE, ANNULEE

    // --- Relations ---

    #[ORM\ManyToOne(targetEntity: Utilisateur::class, inversedBy: 'operations')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $utilisateur = null;

    #[ORM\ManyToOne(targetEntity: ModePaiement::class, inversedBy: 'operations')]
    #[ORM\JoinColumn(nullable: false)]
    private ?ModePaiement $modePaiement = null;

    // Auto-référence pour la contre-passation (une opération annule une autre)
    #[ORM\ManyToOne(targetEntity: self::class)]
    private ?self $operationLiee = null;

    #[ORM\OneToOne(mappedBy: 'operation', targetEntity: Justificatif::class, cascade: ['persist', 'remove'])]
    private ?Justificatif $justificatif = null;

    public function __construct()
    {
        $this->date = new \DateTimeImmutable();
    }

    public function __toString(): string
    {
        return sprintf('%s - %s (%s)', $this->type, $this->montant, $this->date->format('d/m/Y'));
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getMontant(): ?string
    {
        return $this->montant;
    }

    public function setMontant(string $montant): static
    {
        $this->montant = $montant;

        return $this;
    }

    public function getDate(): ?\DateTimeImmutable
    {
        return $this->date;
    }

    public function setDate(\DateTimeImmutable $date): static
    {
        $this->date = $date;

        return $this;
    }

    public function getCompteComptable(): ?string
    {
        return $this->compteComptable;
    }

    public function setCompteComptable(?string $compteComptable): static
    {
        $this->compteComptable = $compteComptable;

        return $this;
    }

    public function getStatut(): string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getUtilisateur(): ?Utilisateur
    {
        return $this->utilisateur;
    }

    public function setUtilisateur(?Utilisateur $utilisateur): static
    {
        $this->utilisateur = $utilisateur;

        return $this;
    }

    public function getModePaiement(): ?ModePaiement
    {
        return $this->modePaiement;
    }

    public function setModePaiement(?ModePaiement $modePaiement): static
    {
        $this->modePaiement = $modePaiement;

        return $this;
    }

    public function getOperationLiee(): ?self
    {
        return $this->operationLiee;
    }

    public function setOperationLiee(?self $operationLiee): static
    {
        $this->operationLiee = $operationLiee;

        return $this;
    }

    public function getJustificatif(): ?Justificatif
    {
        return $this->justificatif;
    }

    public function setJustificatif(Justificatif $justificatif): static
    {
        // set the owning side of the relation if necessary
        if ($justificatif->getOperation() !== $this) {
            $justificatif->setOperation($this);
        }

        $this->justificatif = $justificatif;

        return $this;
    }
}