<?php

namespace App\Entity;

use App\Repository\ServiceRepository;
use App\Entity\Societe;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ServiceRepository::class)]
class Service
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 100)]
    private ?string $nom = null; // Ex: "Marketing", "DSI", "Ressources Humaines"

    // Le Chef du service (Celui qui valide le 1er niveau)
    #[ORM\OneToOne(targetEntity: Utilisateur::class, cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: true)] // Peut être null à la création
    private ?Utilisateur $chef = null;

    // Les employés du service
    #[ORM\OneToMany(mappedBy: 'service', targetEntity: Utilisateur::class)]
    private Collection $employes;

    #[ORM\ManyToOne(targetEntity: Societe::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Societe $societe = null;

    public function __construct()
    {
        $this->employes = new ArrayCollection();
    }

    public function __toString(): string
    {
        return $this->nom ?? (string) $this->id;
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    public function getChef(): ?Utilisateur
    {
        return $this->chef;
    }

    public function setChef(?Utilisateur $chef): static
    {
        $this->chef = $chef;

        return $this;
    }

    /**
     * @return Collection<int, Utilisateur>
     */
    public function getEmployes(): Collection
    {
        return $this->employes;
    }

    public function addEmploye(Utilisateur $employe): static
    {
        if (!$this->employes->contains($employe)) {
            $this->employes->add($employe);
            $employe->setService($this);
        }

        return $this;
    }

    public function removeEmploye(Utilisateur $employe): static
    {
        if ($this->employes->removeElement($employe)) {
            if ($employe->getService() === $this) {
                $employe->setService(null);
            }
        }

        return $this;
    }

    public function getSociete(): ?Societe
    {
        return $this->societe;
    }

    public function setSociete(?Societe $societe): static
    {
        $this->societe = $societe;
        return $this;
    }
}

