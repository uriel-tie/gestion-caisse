<?php

namespace App\Entity;

use App\Repository\AuditRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AuditRepository::class)]
#[ORM\Index(name: 'idx_audit_date', columns: ['date'])] // Optimisation requise par le guide (Section 6)
class Audit
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')] // "Bigint" est excellent pour une table de logs qui va grossir
    private ?string $id = null; // En PHP, Doctrine mappe souvent bigint en string pour éviter les dépassements d'entier 32bits, mais ?int marche sur les OS 64bits.

    #[ORM\Column(length: 255)]
    private ?string $action = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $details = null;

    // Utilisation de DateTimeImmutable pour garantir que la date du log ne soit jamais modifiée
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $date = null;

    // Note : Assure-toi que l'entité "Utilisateur" existe bien, sinon cette ligne fera une erreur
    #[ORM\ManyToOne(targetEntity: Utilisateur::class, inversedBy: 'audits')]
    #[ORM\JoinColumn(nullable: false)] // Un audit doit forcément être lié à un utilisateur (ou null si système, à décider)
    private ?Utilisateur $utilisateur = null;

    public function __construct()
    {
        $this->date = new \DateTimeImmutable();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getAction(): ?string
    {
        return $this->action;
    }

    public function setAction(string $action): static
    {
        $this->action = $action;

        return $this;
    }

    public function getDetails(): ?string
    {
        return $this->details;
    }

    public function setDetails(?string $details): static
    {
        $this->details = $details;

        return $this;
    }

    public function getDate(): ?\DateTimeImmutable
    {
        return $this->date;
    }

    public function setDate(\DateTimeImmutable $date): static
    {
        $this->date = $date;

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
}