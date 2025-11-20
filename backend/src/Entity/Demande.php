<?php

namespace App\Entity;

use App\Repository\DemandeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: DemandeRepository::class)]
class Demande
{
    // Constantes pour éviter les fautes de frappe dans le code
    public const TYPE_BESOIN = 'FICHE_BESOIN';
    public const TYPE_MISSION = 'ORDRE_MISSION';

    public const STATUT_BROUILLON = 'BROUILLON';
    public const STATUT_ATTENTE_CHEF = 'ATTENTE_CHEF';
    public const STATUT_ATTENTE_MANAGER = 'ATTENTE_MANAGER';
    public const STATUT_VALIDEE = 'VALIDEE_A_PAYER'; // Prêt pour le caissier
    public const STATUT_PAYEE = 'PAYEE';
    public const STATUT_REFUSEE = 'REFUSEE';

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 50)]
    private ?string $type = null; // Utiliser les constantes TYPE_*

    #[ORM\Column(length: 255)]
    private ?string $titre = null; // Ex: "Achat fournitures", "Déplacement Lyon"

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2)]
    private ?string $montantEstime = null;

    #[ORM\Column(length: 50)]
    private ?string $statut = self::STATUT_BROUILLON;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    // --- Relations ---

    // Qui demande ?
    #[ORM\ManyToOne(targetEntity: Utilisateur::class, inversedBy: 'demandes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $demandeur = null;

    // Lien final vers la caisse (Une fois payée, on lie l'opération réelle ici)
    #[ORM\OneToOne(inversedBy: 'demande', targetEntity: Operation::class, cascade: ['persist', 'remove'])]
    private ?Operation $operation = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
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

    public function getTitre(): ?string
    {
        return $this->titre;
    }

    public function setTitre(string $titre): static
    {
        $this->titre = $titre;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getMontantEstime(): ?string
    {
        return $this->montantEstime;
    }

    public function setMontantEstime(string $montantEstime): static
    {
        $this->montantEstime = $montantEstime;
        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getDemandeur(): ?Utilisateur
    {
        return $this->demandeur;
    }

    public function setDemandeur(?Utilisateur $demandeur): static
    {
        $this->demandeur = $demandeur;
        return $this;
    }

    public function getOperation(): ?Operation
    {
        return $this->operation;
    }

    public function setOperation(?Operation $operation): static
    {
        $this->operation = $operation;
        return $this;
    }
}