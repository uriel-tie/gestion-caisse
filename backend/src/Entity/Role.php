<?php

namespace App\Entity;

use App\Repository\RoleRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: RoleRepository::class)]
#[ORM\Table(name: '`role`')]
class Role
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private ?Uuid $id = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $nom; // Ex: "Manager Limité", "Caissier Avancé"

    #[ORM\Column(type: 'string', length: 50)]
    private string $baseRole; // Ex: "ROLE_MANAGER", "ROLE_CHEF_SERVICE"

    #[ORM\Column(type: 'json')]
    private array $restrictions = []; // Ex: ["requests", "audit"] = champs à masquer

    #[ORM\Column(type: 'json')]
    private array $adminRestrictions = []; // Onglets masqués en admin

    #[ORM\ManyToOne(targetEntity: Societe::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Societe $societe;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    #[ORM\Column(type: 'boolean')]
    private bool $isActive = true;

    public function __construct()
    {
        $this->id = Uuid::v6();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    // GETTERS & SETTERS
    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getNom(): string
    {
        return $this->nom;
    }

    public function setNom(string $nom): self
    {
        $this->nom = $nom;
        return $this;
    }

    public function getBaseRole(): string
    {
        return $this->baseRole;
    }

    public function setBaseRole(string $baseRole): self
    {
        $this->baseRole = $baseRole;
        return $this;
    }

    public function getRestrictions(): array
    {
        return $this->restrictions;
    }

    public function setRestrictions(array $restrictions): self
    {
        $this->restrictions = $restrictions;
        return $this;
    }

    public function getAdminRestrictions(): array
    {
        return $this->adminRestrictions;
    }

    public function setAdminRestrictions(array $adminRestrictions): self
    {
        $this->adminRestrictions = $adminRestrictions;
        return $this;
    }

    public function getSociete(): Societe
    {
        return $this->societe;
    }

    public function setSociete(Societe $societe): self
    {
        $this->societe = $societe;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        return $this;
    }
}
