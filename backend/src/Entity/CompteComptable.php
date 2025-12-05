<?php

namespace App\Entity;

use App\Repository\CompteComptableRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: CompteComptableRepository::class)]
class CompteComptable
{
    public const TYPE_RECETTE = 'RECETTE';   // Pour les Encaissements
    public const TYPE_DEPENSE = 'DEPENSE';   // Pour les Décaissements
    public const TYPE_TRESORERIE = 'TRESORERIE'; // Pour les Caisses elles-mêmes

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 20, unique: true)]
    private ?string $numero = null; // Ex: "606", "571"

    #[ORM\Column(length: 255)]
    private ?string $libelle = null; // Ex: "Achats Marchandises"

    #[ORM\Column(length: 50)]
    private ?string $type = null; // RECETTE, DEPENSE, ou TRESORERIE

    public function __toString(): string
    {
        return $this->numero . ' - ' . $this->libelle;
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getNumero(): ?string
    {
        return $this->numero;
    }

    public function setNumero(string $numero): static
    {
        $this->numero = $numero;
        return $this;
    }

    public function getLibelle(): ?string
    {
        return $this->libelle;
    }

    public function setLibelle(string $libelle): static
    {
        $this->libelle = $libelle;
        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }
}