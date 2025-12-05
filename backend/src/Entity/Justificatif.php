<?php

namespace App\Entity;

use App\Repository\JustificatifRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: JustificatifRepository::class)]
class Justificatif
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    private ?string $fichier = null; // Nom d'origine du fichier (ex: facture.pdf)

    #[ORM\Column(length: 255)]
    private ?string $chemin = null; // Chemin de stockage sécurisé sur le serveur

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $hash = null; // Ajouté selon le point 9 du guide (Sécurité/Intégrité)

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $dateUpload = null;

    // Note : L'entité Operation doit exister pour que cette relation fonctionne.
    // On définit ici que le Justificatif "possède" la clé étrangère operation_id.
    #[ORM\OneToOne(targetEntity: Operation::class, inversedBy: 'justificatif')]
    #[ORM\JoinColumn(name: 'operation_id', nullable: false)]
    private ?Operation $operation = null;

    #[ORM\Column(length: 20, options: ['default' => self::TYPE_FICHIER])]
    private ?string $type = self::TYPE_FICHIER;

    // Contiendra : { "beneficiaire": "Nom", "items": [{ "nom": "Balais", "qte": 2, "prix": 1500 }] }
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $contenuJson = null;

    // Contiendra l'image en Base64 de la signature
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $signatureData = null;

    public const TYPE_FICHIER = 'fichier';

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getContenuJson(): ?array
    {
        return $this->contenuJson;
    }

    public function setContenuJson(?array $contenuJson): static
    {
        $this->contenuJson = $contenuJson;
        return $this;
    }

    public function getSignatureData(): ?string
    {
        return $this->signatureData;
    }

    public function setSignatureData(?string $signatureData): static
    {
        $this->signatureData = $signatureData;
        return $this;
    }

    public function __construct()
    {
        $this->dateUpload = new \DateTimeImmutable();
    }

    public function __toString(): string
    {
        return (string) $this->id;
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getFichier(): ?string
    {
        return $this->fichier;
    }

    public function setFichier(string $fichier): static
    {
        $this->fichier = $fichier;

        return $this;
    }

    public function getChemin(): ?string
    {
        return $this->chemin;
    }

    public function setChemin(string $chemin): static
    {
        $this->chemin = $chemin;

        return $this;
    }

    public function getHash(): ?string
    {
        return $this->hash;
    }

    public function setHash(?string $hash): static
    {
        $this->hash = $hash;

        return $this;
    }

    public function getDateUpload(): ?\DateTimeImmutable
    {
        return $this->dateUpload;
    }

    public function setDateUpload(\DateTimeImmutable $dateUpload): static
    {
        $this->dateUpload = $dateUpload;

        return $this;
    }

    public function getOperation(): ?Operation
    {
        return $this->operation;
    }

    public function setOperation(Operation $operation): static
    {
        $this->operation = $operation;

        return $this;
    }
}

    
