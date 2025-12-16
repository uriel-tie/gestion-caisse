<?php

namespace App\Entity;

use App\Repository\SocieteRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SocieteRepository::class)]
class Societe
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nom = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $forme = null; // SARL, SA, etc.

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $adresse = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $telephone = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $numeroRegistreCommerce = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $siegeSocial = null;

    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    private ?string $capitalSocial = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $logoUrl = null; // Pour stocker le chemin du logo

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;
        return $this;
    }

    
    public function getForme(): ?string { return $this->forme; }
    public function setForme(?string $forme): static { $this->forme = $forme; return $this; }

    public function getAdresse(): ?string { return $this->adresse; }
    public function setAdresse(?string $adresse): static { $this->adresse = $adresse; return $this; }

    public function getTelephone(): ?string { return $this->telephone; }
    public function setTelephone(?string $telephone): static { $this->telephone = $telephone; return $this; }

    public function getNumeroRegistreCommerce(): ?string { return $this->numeroRegistreCommerce; }
    public function setNumeroRegistreCommerce(?string $numeroRegistreCommerce): static { $this->numeroRegistreCommerce = $numeroRegistreCommerce; return $this; }

    public function getSiegeSocial(): ?string { return $this->siegeSocial; }
    public function setSiegeSocial(?string $siegeSocial): static { $this->siegeSocial = $siegeSocial; return $this; }

    public function getCapitalSocial(): ?string { return $this->capitalSocial; }
    public function setCapitalSocial(?string $capitalSocial): static { $this->capitalSocial = $capitalSocial; return $this; }

    public function getLogoUrl(): ?string { return $this->logoUrl; }
    public function setLogoUrl(?string $logoUrl): static { $this->logoUrl = $logoUrl; return $this; }
}