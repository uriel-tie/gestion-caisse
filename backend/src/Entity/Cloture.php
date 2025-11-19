<?php

namespace App\Entity;

use App\Repository\ClotureRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ClotureRepository::class)]
class Cloture
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 50)]
    private ?string $periode = null; // Ex: "Octobre 2023" ou "Semaine 42"

    // Doctrine mappe DECIMAL en string PHP pour conserver la précision exacte
    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private ?string $soldeTheorique = null;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private ?string $soldePhysique = null;

    // DateTimeImmutable est préférable pour une clôture qui fige le temps
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $dateCloture = null;

    #[ORM\ManyToOne(targetEntity: Utilisateur::class, inversedBy: 'clotures')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $utilisateur = null;

    public function __construct()
    {
        $this->dateCloture = new \DateTimeImmutable();
    }

    public function __toString(): string
    {
        return (string) $this->id;
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getPeriode(): ?string
    {
        return $this->periode;
    }

    public function setPeriode(string $periode): static
    {
        $this->periode = $periode;

        return $this;
    }

    public function getSoldeTheorique(): ?string
    {
        return $this->soldeTheorique;
    }

    public function setSoldeTheorique(string $soldeTheorique): static
    {
        $this->soldeTheorique = $soldeTheorique;

        return $this;
    }

    public function getSoldePhysique(): ?string
    {
        return $this->soldePhysique;
    }

    public function setSoldePhysique(string $soldePhysique): static
    {
        $this->soldePhysique = $soldePhysique;

        return $this;
    }

    public function getDateCloture(): ?\DateTimeImmutable
    {
        return $this->dateCloture;
    }

    public function setDateCloture(\DateTimeImmutable $dateCloture): static
    {
        $this->dateCloture = $dateCloture;

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

    // Méthode utilitaire pour calculer l'écart de caisse automatiquement
    public function getEcart(): float
    {
        return (float) $this->soldePhysique - (float) $this->soldeTheorique;
    }
}