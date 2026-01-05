<?php

namespace App\Entity;

use App\Repository\DemandeRepository;
use App\Entity\Societe;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use App\Entity\LigneDemande;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

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
    #[ORM\Column(length: 50, unique: true, nullable: true)]
    private ?string $numeroReference = null; // Ex: DEM-2025-001

    #[ORM\OneToMany(mappedBy: 'demande', targetEntity: LigneDemande::class, cascade: ['persist', 'remove'])]
    private Collection $lignes;

    // Qui demande ?
    #[ORM\ManyToOne(targetEntity: Utilisateur::class, inversedBy: 'demandes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $demandeur = null;

    // Lien final vers la caisse (Une fois payée, on lie l'opération réelle ici)
    #[ORM\OneToOne(inversedBy: 'demande', targetEntity: Operation::class, cascade: ['persist', 'remove'])]
    private ?Operation $operation = null;

    #[ORM\ManyToOne(targetEntity: Utilisateur::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Utilisateur $beneficiaire = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $beneficiaireAutre = null;

    #[ORM\ManyToOne(targetEntity: Societe::class)]
    #[ORM\JoinColumn(nullable: false)] 
    private ?Societe $societe = null;

    public function getBeneficiaireAutre(): ?string
    {
        return $this->beneficiaireAutre;
    }

    public function setBeneficiaireAutre(?string $beneficiaireAutre): static
    {
        $this->beneficiaireAutre = $beneficiaireAutre;
        return $this;
    }

    public function getBeneficiaire(): ?Utilisateur
    {
        return $this->beneficiaire;
    }

    public function setBeneficiaire(?Utilisateur $beneficiaire): static
    {
        $this->beneficiaire = $beneficiaire;
        return $this;
    }

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->lignes = new ArrayCollection();
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

    public function getNumeroReference(): ?string
    {
        return $this->numeroReference;
    }

    public function setNumeroReference(?string $numeroReference): static
    {
        $this->numeroReference = $numeroReference;
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

    /**
     * @return Collection<int, LigneDemande>
     */
    public function getLignes(): Collection
    {
        return $this->lignes;
    }

    public function addLigne(LigneDemande $ligne): static
    {
        if (!$this->lignes->contains($ligne)) {
            $this->lignes->add($ligne);
            $ligne->setDemande($this);
        }
        return $this;
    }

    public function removeLigne(LigneDemande $ligne): static
    {
        if ($this->lignes->removeElement($ligne)) {
            if ($ligne->getDemande() === $this) {
                // set the owning side to null (unless already changed)
            }
        }
        return $this;
    }

    public const STATUT_ATTENTE_TRAITEMENT_CAISSE = 'ATTENTE_TRAITEMENT_CAISSE';

    #[ORM\ManyToOne(targetEntity: Utilisateur::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Utilisateur $caissierTraitant = null;

    public function getCaissierTraitant(): ?Utilisateur
    {
        return $this->caissierTraitant;
    }

    public function setCaissierTraitant(?Utilisateur $caissierTraitant): static
    {
        $this->caissierTraitant = $caissierTraitant;
        return $this;
    }
}

