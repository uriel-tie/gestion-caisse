<?php

namespace App\Entity;

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
    private ?string $nom = null; // Ex: "Caisse Principale", "Caisse Boutique 1"

    #[ORM\Column]
    private bool $estOuverte = false; // Pour savoir vite si elle est dispo

    public function getId(): ?Uuid { return $this->id; }
    
    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function isEstOuverte(): ?bool { return $this->estOuverte; }
    public function setEstOuverte(bool $estOuverte): static { $this->estOuverte = $estOuverte; return $this; }
}