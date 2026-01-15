<?php

namespace App\Entity;

use App\Repository\ModePaiementRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ModePaiementRepository::class)]
class ModePaiement
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 100, unique: true)]
    private ?string $libelle = null;

    // Type technique pour le backend (ex: "ESPECE" déclenche l'ouverture du tiroir, "CHEQUE" demande un numéro)
    #[ORM\Column(length: 50)]
    private ?string $type = null;

    // Relation OneToMany : Un mode de paiement peut avoir plusieurs opérations
    #[ORM\OneToMany(mappedBy: 'modePaiement', targetEntity: Operation::class)]
    private Collection $operations;

    #[ORM\ManyToOne(targetEntity: Societe::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Societe $societe = null;

    public function getSociete(): ?Societe { return $this->societe; }
    public function setSociete(?Societe $societe): static { $this->societe = $societe; return $this; }

    public function __construct()
    {
        $this->operations = new ArrayCollection();
    }

    public function __toString(): string
    {
        return $this->libelle ?? (string) $this->id;
    }

    public function getId(): ?Uuid
    {
        return $this->id;
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

    /**
     * @return Collection<int, Operation>
     */
    public function getOperations(): Collection
    {
        return $this->operations;
    }

    public function addOperation(Operation $operation): static
    {
        if (!$this->operations->contains($operation)) {
            $this->operations->add($operation);
            $operation->setModePaiement($this);
        }

        return $this;
    }

    public function removeOperation(Operation $operation): static
    {
        if ($this->operations->removeElement($operation)) {
            // set the owning side to null (unless already changed)
            if ($operation->getModePaiement() === $this) {
                $operation->setModePaiement(null);
            }
        }

        return $this;
    }
}