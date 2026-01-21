<?php

namespace App\Entity;

use App\Repository\LigneDemandeRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: LigneDemandeRepository::class)]
class LigneDemande
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    private ?string $designation = null;

    #[ORM\Column]
    private ?int $quantite = null;

    #[ORM\Column]
    private ?float $prixUnitaireEstimatif = null;

    #[ORM\ManyToOne(inversedBy: 'lignes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Demande $demande = null;

    #[ORM\ManyToOne(targetEntity: CompteComptable::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?CompteComptable $compte = null;

    public function getId(): ?Uuid { return $this->id; }

    public function getDesignation(): ?string { return $this->designation; }
    public function setDesignation(string $designation): static { $this->designation = $designation; return $this; }

    public function getQuantite(): ?int { return $this->quantite; }
    public function setQuantite(int $quantite): static { $this->quantite = $quantite; return $this; }

    public function getPrixUnitaireEstimatif(): ?float { return $this->prixUnitaireEstimatif; }
    public function setPrixUnitaireEstimatif(float $prixUnitaireEstimatif): static { $this->prixUnitaireEstimatif = $prixUnitaireEstimatif; return $this; }

    public function getTotalLigne(): float {
        return $this->quantite * $this->prixUnitaireEstimatif;
    }

    public function getDemande(): ?Demande { return $this->demande; }
    public function setDemande(?Demande $demande): static { $this->demande = $demande; return $this; }

    public function getCompte(): ?CompteComptable { return $this->compte; }
    public function setCompte(?CompteComptable $compte): static { $this->compte = $compte; return $this; }
}