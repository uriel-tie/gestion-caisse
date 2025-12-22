<?php

namespace App\Entity;

use App\Repository\AuditRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AuditRepository::class)]
#[ORM\Index(name: 'idx_audit_date', columns: ['date'])]
#[ORM\Index(name: 'idx_audit_entity', columns: ['entity_class', 'entity_id'])] // Recherche rapide par objet
class Audit
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?string $id = null;

    #[ORM\Column(length: 50)]
    private ?string $action = null; // CREATE, UPDATE, DELETE, LOGIN...

    #[ORM\Column(length: 255)]
    private ?string $actorName = null; // Nom stocké en dur (si l'user est supprimé)

    #[ORM\Column(length: 255)]
    private ?string $entityClass = null; // Ex: App\Entity\Demande

    #[ORM\Column(length: 255)]
    private ?string $entityId = null; // Ex: UUID-1234-5678

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $changes = null; // Le fameux Diff { "montant": {"old": 500, "new": 1000} }

    #[ORM\Column(length: 45, nullable: true)]
    private ?string $ipAddress = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $date = null;

    // Relation optionnelle pour lier à l'user actuel (si toujours existant)
    #[ORM\ManyToOne(targetEntity: Utilisateur::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Utilisateur $utilisateur = null;

    public function __construct()
    {
        $this->date = new \DateTimeImmutable();
    }

    // --- Getters & Setters ---

    public function getId(): ?string { return $this->id; }
    
    public function getAction(): ?string { return $this->action; }
    public function setAction(string $action): static { $this->action = $action; return $this; }

    public function getActorName(): ?string { return $this->actorName; }
    public function setActorName(string $actorName): static { $this->actorName = $actorName; return $this; }

    public function getEntityClass(): ?string { return $this->entityClass; }
    public function setEntityClass(string $entityClass): static { $this->entityClass = $entityClass; return $this; }

    public function getEntityId(): ?string { return $this->entityId; }
    public function setEntityId(string $entityId): static { $this->entityId = $entityId; return $this; }

    public function getChanges(): ?array { return $this->changes; }
    public function setChanges(?array $changes): static { $this->changes = $changes; return $this; }

    public function getIpAddress(): ?string { return $this->ipAddress; }
    public function setIpAddress(?string $ipAddress): static { $this->ipAddress = $ipAddress; return $this; }

    public function getDate(): ?\DateTimeImmutable { return $this->date; }
    public function setDate(\DateTimeImmutable $date): static { $this->date = $date; return $this; }

    public function getUtilisateur(): ?Utilisateur { return $this->utilisateur; }
    public function setUtilisateur(?Utilisateur $utilisateur): static { $this->utilisateur = $utilisateur; return $this; }
}