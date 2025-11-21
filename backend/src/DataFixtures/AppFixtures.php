<?php

namespace App\DataFixtures;

use App\Entity\Caisse;
use App\Entity\SessionCaisse; // <--- Nouveau
use App\Entity\ModePaiement;
use App\Entity\Operation;
use App\Entity\Service;
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
        // 1. MODES DE PAIEMENT
        $modes = [];
        $libelles = [['Espèces', 'LIQUIDE'], ['Carte Bancaire', 'BANQUE'], ['Chèque', 'BANQUE'], ['Virement', 'BANQUE']];
        foreach ($libelles as [$libelle, $type]) {
            $mode = new ModePaiement();
            $mode->setLibelle($libelle);
            $mode->setType($type);
            $manager->persist($mode);
            $modes[$libelle] = $mode;
        }

        // 2. SERVICES
        $serviceCaisse = new Service();
        $serviceCaisse->setNom('Caisse Centrale & Compta');
        $manager->persist($serviceCaisse);

        $serviceIT = new Service();
        $serviceIT->setNom('Département IT');
        $manager->persist($serviceIT);

        // 3. UTILISATEURS
        $password = 'password123';

        // Manager
        $admin = new Utilisateur();
        $admin->setEmail('admin@cashflow.com');
        $admin->setNom('Directeur Général');
        $admin->setRoles(['ROLE_MANAGER']);
        $admin->setPassword($this->hasher->hashPassword($admin, $password));
        $manager->persist($admin);

        // Caissier
        $caissier = new Utilisateur();
        $caissier->setEmail('caissier@cashflow.com');
        $caissier->setNom('Thomas Guichet');
        $caissier->setRoles(['ROLE_CAISSIER']);
        $caissier->setService($serviceCaisse);
        $caissier->setPassword($this->hasher->hashPassword($caissier, $password));
        $manager->persist($caissier);

        // 4. CAISSES (NOUVEAU)
        // On crée la caisse physique
        $caissePrincipale = new Caisse();
        $caissePrincipale->setNom('Caisse Principale 01');
        $caissePrincipale->setEstOuverte(true); // Elle est utilisée
        $manager->persist($caissePrincipale);

        // 5. SESSION DE CAISSE (NOUVEAU & CRUCIAL)
        // On simule que Thomas a ouvert sa caisse ce matin
        $session = new SessionCaisse();
        $session->setCaisse($caissePrincipale);
        $session->setCaissier($caissier);
        $session->setStatut(SessionCaisse::STATUT_OUVERTE);
        $session->setMontantOuverture('0.00'); // Il a commencé à vide (ou avec un fond)
        $manager->persist($session);

        // 6. OPÉRATION (Fond de Caisse)
        // Cette opération appartient à la session créée juste au-dessus
        $fondCaisse = new Operation();
        $fondCaisse->setType('ENCAISSEMENT');
        $fondCaisse->setMontant('200.00');
        $fondCaisse->setDate(new \DateTimeImmutable('now'));
        $fondCaisse->setCompteComptable('530');
        $fondCaisse->setStatut(Operation::STATUT_VALIDEE);
        $fondCaisse->setMotif('Fond de caisse initial (Fixtures)');
        
        // Liaisons
        $fondCaisse->setUtilisateur($caissier); // C'est Thomas qui a fait l'op
        $fondCaisse->setModePaiement($modes['Espèces']);
        $fondCaisse->setSessionCaisse($session); // <--- OBLIGATOIRE MAINTENANT

        $manager->persist($fondCaisse);

        $manager->flush();
    }
}