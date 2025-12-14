<?php

namespace App\DataFixtures;

use App\Entity\Caisse;
use App\Entity\CompteComptable;
use App\Entity\ModePaiement;
use App\Entity\Operation;
use App\Entity\Service;
use App\Entity\SessionCaisse;
use App\Entity\Utilisateur;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    private UserPasswordHasherInterface $hasher;

    public function __construct(UserPasswordHasherInterface $hasher)
    {
        $this->hasher = $hasher;
    }

    public function load(ObjectManager $manager): void
    {
        // 1. SERVICES
        $serviceCompta = new Service();
        $serviceCompta->setNom('Comptabilité');
        $manager->persist($serviceCompta);

        $serviceRH = new Service();
        $serviceRH->setNom('Ressources Humaines');
        $manager->persist($serviceRH);

        // 2. UTILISATEURS
        $admin = new Utilisateur();
        $admin->setEmail('admin@gmail.com');
        $admin->setNom('Super Admin');
        $admin->setRoles(['ROLE_ADMIN', 'ROLE_MANAGER']);
        $admin->setPassword($this->hasher->hashPassword($admin, 'password123'));
        $admin->setEstActif(true);
        $admin->setPasswordMustBeChanged(false);
        $manager->persist($admin);

        $managerUser = new Utilisateur();
        $managerUser->setEmail('manager@gmail.com');
        $managerUser->setNom('Directeur Financier');
        $managerUser->setRoles(['ROLE_MANAGER']);
        $managerUser->setPassword($this->hasher->hashPassword($managerUser, 'password123'));
        $managerUser->setEstActif(true);
        $managerUser->setPasswordMustBeChanged(false);
        $manager->persist($managerUser);

        $chefService = new Utilisateur();
        $chefService->setEmail('chef@gmail.com');
        $chefService->setNom('Chef Compta');
        $chefService->setRoles(['ROLE_CHEF_SERVICE']);
        $chefService->setService($serviceCompta);
        $chefService->setPassword($this->hasher->hashPassword($chefService, 'password123'));
        $chefService->setEstActif(true);
        $chefService->setPasswordMustBeChanged(false);
        $manager->persist($chefService);

        $caissier = new Utilisateur();
        $caissier->setEmail('caissier@gmail.com');
        $caissier->setNom('Thomas Guichet');
        $caissier->setRoles(['ROLE_CAISSIER']);
        $caissier->setPassword($this->hasher->hashPassword($caissier, 'password123'));
        $caissier->setEstActif(true);
        $caissier->setPasswordMustBeChanged(false); // Pour éviter la redirection au login
        $manager->persist($caissier);

        // 3. COMPTES COMPTABLES
        $compteCaisse = new CompteComptable();
        $compteCaisse->setNumero('530');
        $compteCaisse->setLibelle('Caisse Principale');
        $compteCaisse->setType('TRESORERIE');
        $manager->persist($compteCaisse);

        $compteAchat = new CompteComptable();
        $compteAchat->setNumero('606');
        $compteAchat->setLibelle('Achats Fournitures');
        $compteAchat->setType('DEPENSE');
        $manager->persist($compteAchat);

        $compteVente = new CompteComptable();
        $compteVente->setNumero('707');
        $compteVente->setLibelle('Ventes Marchandises');
        $compteVente->setType('RECETTE');
        $manager->persist($compteVente);

        // 4. MODES DE PAIEMENT
        $especes = new ModePaiement();
        $especes->setLibelle('Espèces');
        $especes->setType('ESPECE');
        $manager->persist($especes);

        $cb = new ModePaiement();
        $cb->setLibelle('Carte Bancaire');
        $cb->setType('ELECTRONIQUE');
        $manager->persist($cb);

        // 5. CAISSES PHYSIQUES
        $caissePrincipale = new Caisse();
        $caissePrincipale->setNom('Caisse Principale (Accueil)');
        $caissePrincipale->setEstOuverte(true); // On simule qu'elle est déjà ouverte
        $caissePrincipale->setSolde('1500.00'); // Fond de départ
        $caissePrincipale->setEmployeAssigne($caissier);
        $caissePrincipale->setCompteComptable($compteCaisse);
        $manager->persist($caissePrincipale);

        $caisseSecondaire = new Caisse();
        $caisseSecondaire->setNom('Caisse Boutique');
        $caisseSecondaire->setEstOuverte(false);
        $caisseSecondaire->setSolde('0.00');
        $manager->persist($caisseSecondaire);

        // 6. SESSION ACTIVE (Pour le caissier)
        $session = new SessionCaisse();
        $session->setCaissier($caissier);
        $session->setCaisse($caissePrincipale);
        $session->setDateOuverture(new \DateTimeImmutable());
        $session->setMontantOuverture('500.00'); // Il a ouvert avec 500
        $session->setStatut(SessionCaisse::STATUT_OUVERTE);
        $manager->persist($session);

        // 7. OPÉRATIONS (Historique)
        $op1 = new Operation();
        $op1->setType('ENCAISSEMENT');
        $op1->setMontant('1000.00');
        $op1->setDate(new \DateTimeImmutable('-1 hour'));
        $op1->setStatut(Operation::STATUT_VALIDEE);
        $op1->setModePaiement($especes);
        $op1->setUtilisateur($caissier);
        $op1->setSessionCaisse($session);
        $op1->setMotif('Vente initale importante');
        $manager->persist($op1);

        $manager->flush();
    }
}