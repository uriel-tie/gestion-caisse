<?php

namespace App\Entity;

use App\Repository\SocieteRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: SocieteRepository::class)]
class Societe
{
    // Constantes pour les modes de validation
    public const MODE_STANDARD = 'STANDARD';     // Chef -> Manager -> Caissier
    public const MODE_DELEGATION = 'DELEGATION'; // Chef -> Caissier
    public const MODE_AUTONOMIE = 'AUTONOMIE';   // Caissier direct

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

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $telephone = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $registreCommerce = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $siegeSocial = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $capitalSocial = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $numeroCompteContribuable = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private ?bool $isActive = true;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private ?bool $isDeleted = false;

    #[ORM\OneToMany(mappedBy: 'societe', targetEntity: Utilisateur::class)]
    private Collection $utilisateurs;

    // --- CONFIGURATION DU WORKFLOW ---
    
    #[ORM\Column(length: 50, options: ['default' => self::MODE_STANDARD])]
    private ?string $modeValidation = self::MODE_STANDARD;

    public function getId(): ?Uuid { return $this->id; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getForme(): ?string { return $this->forme; }
    public function setForme(?string $forme): static { $this->forme = $forme; return $this; }

    public function getAdresse(): ?string { return $this->adresse; }
    public function setAdresse(?string $adresse): static { $this->adresse = $adresse; return $this; }

    public function getTelephone(): ?string { return $this->telephone; }
    public function setTelephone(?string $telephone): static { $this->telephone = $telephone; return $this; }

    public function getRegistreCommerce(): ?string { return $this->registreCommerce; }
    public function setRegistreCommerce(?string $registreCommerce): static { $this->registreCommerce = $registreCommerce; return $this; }

    public function getSiegeSocial(): ?string { return $this->siegeSocial; }
    public function setSiegeSocial(?string $siegeSocial): static { $this->siegeSocial = $siegeSocial; return $this; }

    public function getCapitalSocial(): ?string { return $this->capitalSocial; }
    public function setCapitalSocial(?string $capitalSocial): static { $this->capitalSocial = $capitalSocial; return $this; }

    public function getNumeroCompteContribuable(): ?string { return $this->numeroCompteContribuable; }
    public function setNumeroCompteContribuable(?string $ncc): static { 
        $this->numeroCompteContribuable = $ncc; 
        return $this; 
}

    public function getModeValidation(): ?string { return $this->modeValidation; }
    public function setModeValidation(string $modeValidation): static { 
        // Sécurité basique pour ne pas mettre n'importe quoi
        if (in_array($modeValidation, [self::MODE_STANDARD, self::MODE_DELEGATION, self::MODE_AUTONOMIE])) {
            $this->modeValidation = $modeValidation; 
        }
        return $this; 
    }
     public function __construct()
    {
        $this->utilisateurs = new ArrayCollection();
    }

    /**
     * @return Collection<int, Utilisateur>
     */
    public function getUtilisateurs(): Collection
    {
        return $this->utilisateurs;
    }

    public function isActive(): ?bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function isDeleted(): ?bool
    {
        return $this->isDeleted;
    }

    public function setIsDeleted(bool $isDeleted): static
    {
        $this->isDeleted = $isDeleted;

        return $this;
    }
}