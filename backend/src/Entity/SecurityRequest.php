<?php

namespace App\Entity;

use App\Repository\SecurityRequestRepository;
use Doctrine\ORM\Mapping as ORMapping;
use Doctrine\DBAL\Types\Types;

#[ORMapping\Entity(repositoryClass: SecurityRequestRepository::class)]
class SecurityRequest
{
    // Constantes pour les types de requêtes
    const TYPE_PASSWORD_RESET = 'PASSWORD_RESET';
    const TYPE_EMAIL_VERIFICATION = 'EMAIL_VERIFICATION';

    #[ORMapping\Id]
    #[ORMapping\GeneratedValue]
    #[ORMapping\Column]
    private ?int $id = null;

    #[ORMapping\ManyToOne(targetEntity: Utilisateur::class)]
    #[ORMapping\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Utilisateur $user = null;

    #[ORMapping\Column(length: 255)]
    private ?string $code = null;

    #[ORMapping\Column(length: 30)]
    private ?string $type = null;

    #[ORMapping\Column]
    private ?\DateTimeImmutable $expiresAt = null;

    #[ORMapping\Column]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getUser(): ?Utilisateur { return $this->user; }
    public function setUser(?Utilisateur $user): self { $this->user = $user; return $this; }

    public function getCode(): ?string { return $this->code; }
    public function setCode(string $code): self { $this->code = $code; return $this; }

    public function getType(): ?string { return $this->type; }
    public function setType(string $type): self { $this->type = $type; return $this; }

    public function getExpiresAt(): ?\DateTimeImmutable { return $this->expiresAt; }
    public function setExpiresAt(\DateTimeImmutable $expiresAt): self { $this->expiresAt = $expiresAt; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
}