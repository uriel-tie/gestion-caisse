<?php

namespace App\Entity;

use App\Repository\CompteLieRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: CompteLieRepository::class)]
#[ORM\UniqueConstraint(name: 'unique_compte_type', columns: ['compte_type_id'])]
class CompteLie
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: CompteComptable::class)]
    #[ORM\JoinColumn(nullable: false, name: 'compte_nature_id')]
    private ?CompteComptable $compteNature = null;

    #[ORM\ManyToOne(targetEntity: CompteComptable::class)]
    #[ORM\JoinColumn(nullable: false, unique: true, name: 'compte_type_id')]
    private ?CompteComptable $compteType = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getCompteNature(): ?CompteComptable
    {
        return $this->compteNature;
    }

    public function setCompteNature(?CompteComptable $compteNature): static
    {
        // Validation : compteNature doit être de type 'nature'
        if ($compteNature && $compteNature->getTypeCompte() !== CompteComptable::TYPECOMPTE_NATURE) {
            throw new \InvalidArgumentException("compteNature doit être un compte de type 'nature'");
        }
        $this->compteNature = $compteNature;
        return $this;
    }

    public function getCompteType(): ?CompteComptable
    {
        return $this->compteType;
    }

    public function setCompteType(?CompteComptable $compteType): static
    {
        // Validation : compteType doit être de type 'type'
        if ($compteType && $compteType->getTypeCompte() !== CompteComptable::TYPECOMPTE_TYPE) {
            throw new \InvalidArgumentException("compteType doit être un compte de type 'type'");
        }
        $this->compteType = $compteType;
        return $this;
    }
}

