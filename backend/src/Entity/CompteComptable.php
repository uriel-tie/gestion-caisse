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
    private ?string $typeCompte = null; // 'nature' ou 'type'

    #[ORM\ManyToOne(targetEntity: Societe::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Societe $societe = null;

    // Nouvelles constantes pour typeCompte
    public const TYPECOMPTE_NATURE = 'nature';
    public const TYPECOMPTE_TYPE = 'type';

    public function getSociete(): ?Societe { return $this->societe; }
    public function setSociete(?Societe $societe): static { $this->societe = $societe; return $this; }

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

    public function getTypeCompte(): ?string
    {
        return $this->typeCompte;
    }

    public function setTypeCompte(string $typeCompte): static
    {
        // Validation : seules 'nature' et 'type' sont acceptées
        if (!in_array($typeCompte, [self::TYPECOMPTE_NATURE, self::TYPECOMPTE_TYPE], true)) {
            throw new \InvalidArgumentException("typeCompte doit être 'nature' ou 'type'");
        }
        $this->typeCompte = $typeCompte;
        return $this;
    }

    // Méthode de compatibilité pour l'ancien champ 'type'
    public function getType(): ?string
    {
        return $this->typeCompte;
    }

    public function setType(string $type): static
    {
        return $this->setTypeCompte($type);
    }
}