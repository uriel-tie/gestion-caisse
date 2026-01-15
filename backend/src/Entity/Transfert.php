<?php

namespace App\Entity;

use App\Repository\TransfertRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TransfertRepository::class)]
class Transfert
{
    public const STATUT_EN_ATTENTE = 'EN_ATTENTE';
    public const STATUT_VALIDE = 'VALIDE';
    public const STATUT_REJETE = 'REJETE';

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    private ?string $montant = null;

    #[ORM\Column(length: 50)]
    private ?string $statut = self::STATUT_EN_ATTENTE;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateCreation = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $dateValidation = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $motif = null;

    // La caisse qui donne l'argent
    #[ORM\ManyToOne(inversedBy: 'transfertsSortants')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Caisse $caisseDepart = null;

    // La caisse qui reçoit l'argent
    #[ORM\ManyToOne(inversedBy: 'transfertsEntrants')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Caisse $caisseArrivee = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $emetteur = null;

    #[ORM\ManyToOne]
    private ?Utilisateur $receveur = null;

    #[ORM\ManyToOne(targetEntity: Societe::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Societe $societe = null;

    public function __construct()
    {
        $this->dateCreation = new \DateTimeImmutable();
    }
    
    public function getSociete(): ?Societe { return $this->societe; }
    public function setSociete(?Societe $societe): static { $this->societe = $societe; return $this; }
    public function getId(): ?Uuid { return $this->id; }
    public function getMontant(): ?string { return $this->montant; }
    public function setMontant(string $montant): static { $this->montant = $montant; return $this; }
    public function getStatut(): ?string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }
    public function getDateCreation(): ?\DateTimeImmutable { return $this->dateCreation; }
    public function setDateCreation(\DateTimeImmutable $dateCreation): static { $this->dateCreation = $dateCreation; return $this; }
    public function getDateValidation(): ?\DateTimeImmutable { return $this->dateValidation; }
    public function setDateValidation(?\DateTimeImmutable $dateValidation): static { $this->dateValidation = $dateValidation; return $this; }
    public function getMotif(): ?string { return $this->motif; }
    public function setMotif(?string $motif): static { $this->motif = $motif; return $this; }
    public function getCaisseDepart(): ?Caisse { return $this->caisseDepart; }
    public function setCaisseDepart(?Caisse $caisseDepart): static { $this->caisseDepart = $caisseDepart; return $this; }
    public function getCaisseArrivee(): ?Caisse { return $this->caisseArrivee; }
    public function setCaisseArrivee(?Caisse $caisseArrivee): static { $this->caisseArrivee = $caisseArrivee; return $this; }
    public function getEmetteur(): ?Utilisateur { return $this->emetteur; }
    public function setEmetteur(?Utilisateur $emetteur): static { $this->emetteur = $emetteur; return $this; }
    public function getReceveur(): ?Utilisateur { return $this->receveur; }
    public function setReceveur(?Utilisateur $receveur): static { $this->receveur = $receveur; return $this; }
}