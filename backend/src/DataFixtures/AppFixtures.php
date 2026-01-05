<?php

namespace App\DataFixtures;

use App\Entity\Caisse;
use App\Entity\CompteComptable;
use App\Entity\Demande;
use App\Entity\ModePaiement;
use App\Entity\Operation;
use App\Entity\Service;
use App\Entity\SessionCaisse;
use App\Entity\Societe;
use App\Entity\Utilisateur;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(private UserPasswordHasherInterface $hasher) {}

    public function load(ObjectManager $manager): void
    {
        // 1. Création du Super Admin
        $admin = new Utilisateur();
        $admin->setEmail('admin@gestioncaisse.com'); // Ton email admin
        $admin->setNom('Super Admin');
        $admin->setRoles(['ROLE_SUPER_ADMIN']);
        $admin->setEstActif(true);
        $admin->setSociete(null); // Pas de société
        
        $password = $this->hasher->hashPassword($admin, 'admin123'); // Ton mot de passe
        $admin->setPassword($password);
        
        $manager->persist($admin);
        $manager->flush();
    }
}