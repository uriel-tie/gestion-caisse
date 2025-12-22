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
    private UserPasswordHasherInterface $hasher;

    public function __construct(UserPasswordHasherInterface $hasher)
    {
        $this->hasher = $hasher;
    }

    public function load(ObjectManager $manager): void
    {
        // 1. CRÉATION DE LA SOCIÉTÉ
        $societe = new Societe();
        $societe->setNom('Ma Super Entreprise');
        $societe->setForme('SARL');
        $societe->setAdresse('Abidjan, Cocody Riviera');
        $societe->setTelephone('+225 07 07 07 07 07');
        $societe->setCapitalSocial('10 000 000 FCFA');
        $societe->setModeValidation(Societe::MODE_STANDARD); 
        $manager->persist($societe);

        // 2. MODES DE PAIEMENT & COMPTES
        $modeEspece = new ModePaiement();
        $modeEspece->setLibelle('Espèces');
        $modeEspece->setType('ESPECE'); 
        $manager->persist($modeEspece);

        $modeCheque = new ModePaiement();
        $modeCheque->setLibelle('Chèque');
        $modeCheque->setType('CHEQUE');
        $manager->persist($modeCheque);

        $compteCaisse = new CompteComptable();
        $compteCaisse->setNumero('531');
        $compteCaisse->setLibelle('Caisse Siège');
        $compteCaisse->setType('CAISSE');
        $manager->persist($compteCaisse);

        $compteAchats = new CompteComptable();
        $compteAchats->setNumero('606');
        $compteAchats->setLibelle('Achats Fournitures');
        $compteAchats->setType('CHARGE');
        $manager->persist($compteAchats);

        // 3. SERVICES
        $serviceDirection = new Service(); 
        $serviceDirection->setNom('Direction Générale');
        $manager->persist($serviceDirection);

        $serviceCompta = new Service(); 
        $serviceCompta->setNom('Comptabilité & Finances');
        $manager->persist($serviceCompta);

        $serviceIT = new Service(); 
        $serviceIT->setNom('Informatique (DSI)');
        $manager->persist($serviceIT);

        // 4. UTILISATEURS (HIERARCHIE)
        
        // -> Le Manager (Directeur)
        $managerUser = new Utilisateur();
        $managerUser->setEmail('manager@app.com');
        $managerUser->setNom('Directeur Général');
        $managerUser->setRoles(['ROLE_MANAGER']);
        $managerUser->setPassword($this->hasher->hashPassword($managerUser, 'password'));
        $managerUser->setService($serviceDirection);
        $manager->persist($managerUser);

        // -> Le Chef de Service IT
        $chefIT = new Utilisateur();
        $chefIT->setEmail('chef.it@app.com');
        $chefIT->setNom('Chef DSI');
        $chefIT->setRoles(['ROLE_CHEF_SERVICE']);
        $chefIT->setPassword($this->hasher->hashPassword($chefIT, 'password'));
        $chefIT->setService($serviceIT);
        $manager->persist($chefIT);
        // On lie le chef au service (si la méthode existe dans Service)
        // $serviceIT->setChef($chefIT); 

        // -> Le Caissier
        $caissier = new Utilisateur();
        $caissier->setEmail('caissier@app.com');
        $caissier->setNom('Jean Caissier');
        $caissier->setRoles(['ROLE_CAISSIER']);
        $caissier->setPassword($this->hasher->hashPassword($caissier, 'password'));
        $caissier->setService($serviceCompta);
        $manager->persist($caissier);

        // -> Une employée (Assistante)
        $employe = new Utilisateur();
        $employe->setEmail('employe@app.com');
        $employe->setNom('Sophie Assistante');
        $employe->setRoles(['ROLE_USER']);
        $employe->setPassword($this->hasher->hashPassword($employe, 'password'));
        $employe->setService($serviceIT);
        $manager->persist($employe);

        // 5. CAISSE & SESSION
        $caisse = new Caisse();
        $caisse->setNom('Caisse Principale');
        $caisse->setSolde('500000.00'); 
        $caisse->setEstOuverte(true);
        $caisse->setEmployeAssigne($caissier);
        $caisse->setCompteComptable($compteCaisse);
        $manager->persist($caisse);

        $session = new SessionCaisse();
        $session->setCaissier($caissier);
        $session->setCaisse($caisse);
        $session->setDateOuverture(new \DateTimeImmutable());
        $session->setMontantOuverture('500000.00');
        $session->setStatut(SessionCaisse::STATUT_OUVERTE);
        $manager->persist($session);

        // 6. DEMANDES (POUR TESTER LES NOTIFICATIONS)

        // Cas A : Pour le Chef de Service (Attente Chef)
        $demandeSimple = new Demande();
        $demandeSimple->setTitre("Achat Claviers");
        $demandeSimple->setMontantEstime("25000");
        $demandeSimple->setDescription("Remplacement matériel défectueux");
        $demandeSimple->setType(Demande::TYPE_BESOIN);
        $demandeSimple->setDemandeur($employe); // Employé du service IT
        $demandeSimple->setBeneficiaire($employe);
        $demandeSimple->setStatut(Demande::STATUT_ATTENTE_CHEF);
        $manager->persist($demandeSimple);

        // Cas B : Pour le Manager (Attente Manager - Validé par Chef)
        $demandeManager = new Demande();
        $demandeManager->setTitre("Renouvellement Licences");
        $demandeManager->setMontantEstime("150000");
        $demandeManager->setDescription("Licences annuelles Adobe");
        $demandeManager->setType(Demande::TYPE_BESOIN);
        $demandeManager->setDemandeur($chefIT); // Demandé par le chef
        $demandeManager->setBeneficiaire($chefIT);
        $demandeManager->setStatut(Demande::STATUT_ATTENTE_MANAGER); // <--- TEST MANAGER
        $manager->persist($demandeManager);

        // Cas C : Pour le Caissier (Validée - À Payer)
        $demandeTiers = new Demande();
        $demandeTiers->setTitre("Déjeuner Client VIP");
        $demandeTiers->setMontantEstime("45000");
        $demandeTiers->setDescription("Avance sur frais de mission");
        $demandeTiers->setType(Demande::TYPE_MISSION);
        $demandeTiers->setDemandeur($employe);
        $demandeTiers->setBeneficiaire($chefIT);
        $demandeTiers->setStatut(Demande::STATUT_VALIDEE);
        $manager->persist($demandeTiers);

        // 7. OPERATIONS

        // Opération Historique (Déjà faite)
        $opExterne = new Operation();
        $opExterne->setType('DECAISSEMENT');
        $opExterne->setMontant('15000');
        $opExterne->setDate(new \DateTimeImmutable('-1 hour'));
        $opExterne->setStatut(Operation::STATUT_VALIDEE);
        $opExterne->setCompteComptable('606');
        $opExterne->setUtilisateur($caissier);
        $opExterne->setSessionCaisse($session);
        $opExterne->setModePaiement($modeEspece);
        $opExterne->setMotif("Facture Eau Mois Mars");
        $opExterne->setBeneficiaire("SODECI Agence Riviera"); 
        $manager->persist($opExterne);

        // Opération en attente (Pour tester validation Manager)
        $opPending = new Operation();
        $opPending->setType('DECAISSEMENT');
        $opPending->setMontant('200000'); // Gros montant > Seuil
        $opPending->setDate(new \DateTimeImmutable());
        $opPending->setStatut('PENDING'); // <--- TEST MANAGER (Opération en attente)
        $opPending->setCompteComptable('606');
        $opPending->setUtilisateur($caissier);
        $opPending->setSessionCaisse($session);
        $opPending->setModePaiement($modeEspece);
        $opPending->setMotif("Achat Exceptionnel Serveur");
        $opPending->setBeneficiaire("DELL Import");
        $manager->persist($opPending);

        // Mise à jour solde (500000 - 15000 validés)
        $caisse->setSolde('485000.00'); 

        $manager->flush();
    }
}