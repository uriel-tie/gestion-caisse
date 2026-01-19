<?php

namespace App\Entity;

use App\Repository\UtilisateurRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Uid\Uuid;
use Scheb\TwoFactorBundle\Model\Google\TwoFactorInterface;

#[ORM\Entity(repositoryClass: UtilisateurRepository::class)]
class Utilisateur implements UserInterface, PasswordAuthenticatedUserInterface, TwoFactorInterface
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nom = null;

    #[ORM\Column(length: 180, unique: true)]
    private ?string $email = null;

    /**
     * @var list<string> The user roles
     * Note : Symfony exige un tableau JSON pour les rôles.
     * On stockera ici ["ROLE_CAISSIER"] ou ["ROLE_ADMIN"].
     */
    #[ORM\Column]
    private array $roles = [];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(type: 'boolean')]
    private bool $estActif = true;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    // --- Relations ---

    #[ORM\OneToMany(mappedBy: 'utilisateur', targetEntity: Operation::class)]
    private Collection $operations;

    #[ORM\OneToMany(mappedBy: 'utilisateur', targetEntity: Cloture::class)]
    private Collection $clotures;

    #[ORM\OneToMany(mappedBy: 'utilisateur', targetEntity: Audit::class)]
    private Collection $audits;

    // AJOUT : L'utilisateur appartient à un service
    #[ORM\ManyToOne(inversedBy: 'employes', targetEntity: Service::class)]
    #[ORM\JoinColumn(nullable: true)] 
    private ?Service $service = null;

    // AJOUT : Liste des demandes faites par cet utilisateur
    #[ORM\OneToMany(mappedBy: 'demandeur', targetEntity: Demande::class)]
    private Collection $demandes;

    // ...
    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $passwordMustBeChanged = true;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $derniereModificationNom = null;

    #[ORM\Column(type: 'string', nullable: true)]
    private ?string $googleAuthenticatorSecret = null;

    #[ORM\Column(type: 'boolean')]
    private bool $is2faEnabled = false;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isDeleted = false;

   #[ORM\ManyToOne(targetEntity: Societe::class, inversedBy: 'utilisateurs')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Societe $societe = null;

    // Rôle personnalisé (optionnel) - Si présent, remplace le rôle par défaut
    #[ORM\ManyToOne(targetEntity: Role::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Role $customRole = null;

  #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isEmailVerified = false;


    public function getSociete(): ?Societe
    {
        return $this->societe;
    }

    public function setSociete(?Societe $societe): static
    {
        $this->societe = $societe;

        return $this;
    }

    public function isDeleted(): bool
    {
        return $this->isDeleted;
    }

    public function setIsDeleted(bool $isDeleted): static
    {
        $this->isDeleted = $isDeleted;
        return $this;
    }

    public function getGoogleAuthenticatorSecret(): ?string
    {
        return $this->googleAuthenticatorSecret;
    }

    public function setGoogleAuthenticatorSecret(?string $googleAuthenticatorSecret): self
    {
        $this->googleAuthenticatorSecret = $googleAuthenticatorSecret;
        return $this;
    }

    public function is2faEnabled(): bool
    {
        return $this->is2faEnabled;
    }

    public function setIs2faEnabled(bool $is2faEnabled): self
    {
        $this->is2faEnabled = $is2faEnabled;
        return $this;
    }

    public function isGoogleAuthenticatorEnabled(): bool
    {
        return $this->is2faEnabled; // On retourne notre booléen
    }

    public function getGoogleAuthenticatorUsername(): string
    {
        return $this->email; // Ce qui s'affiche dans l'appli Google Auth
    }

    public function isPasswordMustBeChanged(): bool
    {
        return $this->passwordMustBeChanged;
    }

    public function setPasswordMustBeChanged(bool $passwordMustBeChanged): static
    {
        $this->passwordMustBeChanged = $passwordMustBeChanged;
        return $this;
    }

    public function __construct()
    {
        $this->operations = new ArrayCollection();
        $this->clotures = new ArrayCollection();
        $this->audits = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->demandes = new ArrayCollection();
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

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user has at least ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * @see UserInterface
     */
    public function eraseCredentials(): void
    {
        // If you store any temporary, sensitive data on the user, clear it here
        // $this->plainPassword = null;
    }

    public function isEstActif(): ?bool
    {
        return $this->estActif;
    }

    public function setEstActif(bool $estActif): static
    {
        $this->estActif = $estActif;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
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
            $operation->setUtilisateur($this);
        }
        return $this;
    }

    public function removeOperation(Operation $operation): static
    {
        if ($this->operations->removeElement($operation)) {
            if ($operation->getUtilisateur() === $this) {
                // Side effect: This might cause an error if operation requires a user
                // Mais c'est le comportement standard
            }
        }
        return $this;
    }

    public function getService(): ?Service
    {
        return $this->service;
    }

    public function setService(?Service $service): static
    {
        $this->service = $service;
        return $this;
    }

    /**
     * @return Collection<int, Demande>
     */
    public function getDemandes(): Collection
    {
        return $this->demandes;
    }

    public function addDemande(Demande $demande): static
    {
        if (!$this->demandes->contains($demande)) {
            $this->demandes->add($demande);
            $demande->setDemandeur($this);
        }
        return $this;
    }

    public function removeDemande(Demande $demande): static
    {
        if ($this->demandes->removeElement($demande)) {
            if ($demande->getDemandeur() === $this) {
                 // set the owning side to null (unless already changed)
            }
        }
        return $this;
    }

    public function getDerniereModificationNom(): ?\DateTimeImmutable
    {
        return $this->derniereModificationNom;
    }

    public function setDerniereModificationNom(?\DateTimeImmutable $derniereModificationNom): static
    {
        $this->derniereModificationNom = $derniereModificationNom;

        return $this;
    }

    public function isIsEmailVerified(): ?bool
    {
        return $this->isEmailVerified;
    }

    public function setIsEmailVerified(bool $isEmailVerified): self
    {
        $this->isEmailVerified = $isEmailVerified;
        return $this;
    }

    public function getCustomRole(): ?Role
    {
        return $this->customRole;
    }

    public function setCustomRole(?Role $customRole): self
    {
        $this->customRole = $customRole;
        return $this;
    }
}