<?php

namespace App\Entity;

use App\Entity\Utilisateur;
use App\Repository\CaisseRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: CaisseRepository::class)]
class Caisse
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 100)]
    private ?string $nom = null; 

    #[ORM\Column]
    private bool $estOuverte = false; // Pour savoir vite si elle est dispo

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2, options: ['default' => '0.00'])]
    private ?string $solde = '0.00';

    #[ORM\OneToOne(targetEntity: Utilisateur::class)]
    #[ORM\JoinColumn(nullable: true, unique: true)]
    private ?Utilisateur $employeAssigne = null;

    #[ORM\ManyToOne(targetEntity: CompteComptable::class)]
    #[ORM\JoinColumn(nullable: true)] // Nullable au début pour ne pas casser l'existant
    private ?CompteComptable $compteComptable = null;

    public function getId(): ?Uuid { return $this->id; }
    
    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function isEstOuverte(): ?bool { return $this->estOuverte; }
    public function setEstOuverte(bool $estOuverte): static { $this->estOuverte = $estOuverte; return $this; }

    public function getCompteComptable(): ?CompteComptable
    {
        return $this->compteComptable;
    }

    public function setCompteComptable(?CompteComptable $compteComptable): static
    {
        $this->compteComptable = $compteComptable;
        return $this;
    }

    public function getEmployeAssigne(): ?Utilisateur
    {
        return $this->employeAssigne;
    }

    public function setEmployeAssigne(?Utilisateur $employeAssigne): static
    {
        $this->employeAssigne = $employeAssigne;
        return $this;
    }

    public function getSolde(): ?string
    {
        return $this->solde;
    }

    public function setSolde(string $solde): static
    {
        $this->solde = $solde;
        return $this;
    }
}