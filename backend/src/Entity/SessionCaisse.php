<?php

namespace App\Entity;

use App\Repository\SessionCaisseRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SessionCaisseRepository::class)]
class SessionCaisse
{
    public const STATUT_EN_ATTENTE = 'EN_ATTENTE';
    public const STATUT_OUVERTE = 'OUVERTE';
    public const STATUT_FERMEE = 'FERMEE';
    public const STATUT_ECART = 'FERMEE_AVEC_ECART';

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Utilisateur::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $caissier = null;

    #[ORM\ManyToOne(targetEntity: Caisse::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Caisse $caisse = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $dateOuverture = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $dateFermeture = null;

    #[ORM\Column(length: 50)]
    private ?string $statut = self::STATUT_OUVERTE;

    // Combien il y a au début (Fond de caisse)
    #[ORM\Column(type: 'decimal', precision: 12, scale: 2)]
    private ?string $montantOuverture = '0.00';

    // Combien le caissier a compté à la fin
    #[ORM\Column(type: 'decimal', precision: 12, scale: 2, nullable: true)]
    private ?string $montantFermeture = null;

    // Le total théorique calculé par le système (pour comparer)
    #[ORM\Column(type: 'decimal', precision: 12, scale: 2, nullable: true)]
    private ?string $montantTheorique = null;

    // Lien vers les opérations de CETTE session
    #[ORM\OneToMany(mappedBy: 'sessionCaisse', targetEntity: Operation::class)]
    private Collection $operations;

    public function __construct()
    {
        $this->dateOuverture = new \DateTimeImmutable();
        $this->operations = new ArrayCollection();
    }

    // --- GETTERS / SETTERS (Je mets les principaux, génère les autres avec ton IDE) ---
    public function getId(): ?Uuid { return $this->id; }
    
    public function getCaissier(): ?Utilisateur { return $this->caissier; }
    public function setCaissier(?Utilisateur $caissier): static { $this->caissier = $caissier; return $this; }

    public function getCaisse(): ?Caisse { return $this->caisse; }
    public function setCaisse(?Caisse $caisse): static { $this->caisse = $caisse; return $this; }

    public function getStatut(): ?string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getOperations(): Collection { return $this->operations; }
    public function getMontantOuverture(): ?string
    {
        return $this->montantOuverture;
    }

    public function setMontantOuverture(string $montantOuverture): static
    {
        $this->montantOuverture = $montantOuverture;

        return $this;
    }

    public function getMontantFermeture(): ?string
    {
        return $this->montantFermeture;
    }

    public function setMontantFermeture(?string $montantFermeture): static
    {
        $this->montantFermeture = $montantFermeture;

        return $this;
    }

    public function getMontantTheorique(): ?string
    {
        return $this->montantTheorique;
    }

    public function setMontantTheorique(?string $montantTheorique): static
    {
        $this->montantTheorique = $montantTheorique;

        return $this;
    }

    public function getDateFermeture(): ?\DateTimeImmutable
    {
        return $this->dateFermeture;
    }

    public function setDateFermeture(?\DateTimeImmutable $dateFermeture): static
    {
        $this->dateFermeture = $dateFermeture;

        return $this;
    }

    public function getDateOuverture(): ?\DateTimeImmutable
    {
        return $this->dateOuverture;
    }

    public function setDateOuverture(\DateTimeImmutable $dateOuverture): static
    {
        $this->dateOuverture = $dateOuverture;
        return $this;
    }
}