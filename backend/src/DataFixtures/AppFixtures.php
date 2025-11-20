<?php

namespace App\DataFixtures;

use App\Entity\ModePaiement;
use App\Entity\Operation;
use App\Entity\Service;
use App\Entity\Utilisateur;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    // On injecte le hasher pour crypter les mots de passe correctement
    private UserPasswordHasherInterface $hasher;

    public function __construct(UserPasswordHasherInterface $hasher)
    {
        $this->hasher = $hasher;
    }

    public function load(ObjectManager $manager): void
    {
        // ======================================================
        // 1. MODES DE PAIEMENT (Le Socle)
        // ======================================================
        $modes = [];
        $libelles = [
            ['Espèces', 'LIQUIDE'],
            ['Carte Bancaire', 'BANQUE'],
            ['Chèque', 'BANQUE'],
            ['Virement', 'BANQUE']
        ];

        foreach ($libelles as [$libelle, $type]) {
            $mode = new ModePaiement();
            $mode->setLibelle($libelle);
            $mode->setType($type);
            $manager->persist($mode);
            
            // On garde une référence pour s'en servir plus bas (clé = nom du mode)
            $modes[$libelle] = $mode;
        }

        // ======================================================
        // 2. SERVICES (L'Structure)
        // ======================================================
        
        // Service A : La Caisse (Vital pour ton application)
        $serviceCaisse = new Service();
        $serviceCaisse->setNom('Caisse Centrale & Compta');
        $manager->persist($serviceCaisse);

        // Service B : IT / Informatique (Service standard pour tester les demandes)
        $serviceIT = new Service();
        $serviceIT->setNom('Département IT');
        $manager->persist($serviceIT);

        // ======================================================
        // 3. UTILISATEURS (Le Casting)
        // ======================================================
        // Mot de passe unique pour tout le monde pour simplifier les tests
        $passwordCommun = 'password123';

        // --- A. LE MANAGER (Big Boss) ---
        // Il n'a PAS de service (NULL), il voit tout.
        $admin = new Utilisateur();
        $admin->setEmail('admin@cashflow.com');
        $admin->setNom('Directeur Général');
        $admin->setRoles(['ROLE_MANAGER']);
        $admin->setPassword($this->hasher->hashPassword($admin, $passwordCommun));
        $manager->persist($admin);

        // --- B. L'ÉQUIPE CAISSE ---
        
        // Le Chef Comptable (Valide les grosses dépenses)
        $chefCaisse = new Utilisateur();
        $chefCaisse->setEmail('chef.caisse@cashflow.com');
        $chefCaisse->setNom('Bernard Compta');
        $chefCaisse->setRoles(['ROLE_CHEF_SERVICE']);
        $chefCaisse->setService($serviceCaisse);
        $chefCaisse->setPassword($this->hasher->hashPassword($chefCaisse, $passwordCommun));
        $manager->persist($chefCaisse);
        
        // On assigne ce chef au service
        $serviceCaisse->setChef($chefCaisse);

        // Le Caissier (Celui qui encaisse et décaisse)
        $caissier = new Utilisateur();
        $caissier->setEmail('caissier@cashflow.com');
        $caissier->setNom('Thomas Guichet');
        $caissier->setRoles(['ROLE_CAISSIER']); // Le caissier est un employé spécial
        $caissier->setService($serviceCaisse);
        $caissier->setPassword($this->hasher->hashPassword($caissier, $passwordCommun));
        $manager->persist($caissier);

        // --- C. L'ÉQUIPE IT (Pour tester les demandes d'employés lambda) ---

        // Le Chef IT (Valide les demandes de ses devs)
        $chefIT = new Utilisateur();
        $chefIT->setEmail('chef.it@cashflow.com');
        $chefIT->setNom('Sarah Tech');
        $chefIT->setRoles(['ROLE_CHEF_SERVICE']);
        $chefIT->setService($serviceIT);
        $chefIT->setPassword($this->hasher->hashPassword($chefIT, $passwordCommun));
        $manager->persist($chefIT);
        
        $serviceIT->setChef($chefIT);

        // Le Développeur (Fait des demandes de remboursement de frais)
        $dev = new Utilisateur();
        $dev->setEmail('dev@cashflow.com');
        $dev->setNom('John Codeur');
        $dev->setRoles(['ROLE_EMPLOYE']);
        $dev->setService($serviceIT);
        $dev->setPassword($this->hasher->hashPassword($dev, $passwordCommun));
        $manager->persist($dev);

        // ======================================================
        // 4. OPÉRATION ZÉRO (Fond de Caisse)
        // ======================================================
        // Pour ne pas démarrer avec un solde à 0€
        
        $fondCaisse = new Operation();
        $fondCaisse->setType('ENCAISSEMENT');
        $fondCaisse->setMontant('200.00'); // String pour le DECIMAL
        $fondCaisse->setDate(new \DateTimeImmutable('now'));
        $fondCaisse->setCompteComptable('530');
        $fondCaisse->setStatut('VALIDEE'); // Directement validée
        $fondCaisse->setUtilisateur($admin); // C'est le boss qui a mis l'argent au début
        $fondCaisse->setModePaiement($modes['Espèces']); // En cash
        
        $manager->persist($fondCaisse);

        // On envoie tout en base de données
        $manager->flush();
    }
}