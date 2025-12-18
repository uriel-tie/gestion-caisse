<?php

namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: NotificationRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Notification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $message = null;

    // TYPES: 'INFO', 'SUCCESS', 'WARNING', 'DANGER'
    #[ORM\Column(length: 20)]
    private ?string $type = 'INFO'; 

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $lien = null; // Pour cliquer et aller voir (ex: /requests/12)

    #[ORM\Column]
    private ?bool $estLu = false;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'notifications')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $utilisateur = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    // --- Getters & Setters classiques ---
    public function getId(): ?int { return $this->id; }
    public function getMessage(): ?string { return $this->message; }
    public function setMessage(string $message): static { $this->message = $message; return $this; }
    public function getType(): ?string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }
    public function getLien(): ?string { return $this->lien; }
    public function setLien(?string $lien): static { $this->lien = $lien; return $this; }
    public function isEstLu(): ?bool { return $this->estLu; }
    public function setEstLu(bool $estLu): static { $this->estLu = $estLu; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getUtilisateur(): ?Utilisateur { return $this->utilisateur; }
    public function setUtilisateur(?Utilisateur $utilisateur): static { $this->utilisateur = $utilisateur; return $this; }
}