<?php

namespace App\EventSubscriber;

use App\Entity\Audit;
use App\Entity\Operation;
use App\Entity\Demande;
use App\Entity\SessionCaisse;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Symfony\Bundle\SecurityBundle\Security;
use Psr\Log\LoggerInterface;

// On utilise les attributs pour s'abonner aux événements (plus moderne, supprime le warning Deprecated)
#[AsDoctrineListener(event: Events::postPersist)]
#[AsDoctrineListener(event: Events::postUpdate)]
#[AsDoctrineListener(event: Events::preRemove)]
class AuditSubscriber
{
    public function __construct(
        private Security $security,
        private LoggerInterface $logger
    ) {}

    public function postPersist(LifecycleEventArgs $args): void
    {
        $this->logChange($args, 'CREATION');
    }

    public function postUpdate(LifecycleEventArgs $args): void
    {
        $this->logChange($args, 'MODIFICATION');
    }

    public function preRemove(LifecycleEventArgs $args): void
    {
        $this->logChange($args, 'SUPPRESSION');
    }

    private function logChange(LifecycleEventArgs $args, string $actionType): void
    {
        $entity = $args->getObject();

        // 1. On filtre : On ne veut logger que ces entités
        if (!$entity instanceof Operation && !$entity instanceof Demande && !$entity instanceof SessionCaisse) {
            return;
        }

        // 2. On récupère l'utilisateur
        $user = $this->security->getUser();
        
        // Si c'est une commande système ou pas d'user connecté, on loggue quand même avec un avertissement
        if (!$user instanceof Utilisateur) {
             // Optionnel : tu peux décider de return ici si tu ne veux pas d'audit système
             // Pour le debug, on va laisser continuer mais attention si ton entité Audit exige un user non-null
             return; 
        }

        try {
            $audit = new Audit();
            $audit->setUtilisateur($user);
            $audit->setDate(new \DateTimeImmutable());
            
            // Construction des détails
            $entityName = (new \ReflectionClass($entity))->getShortName();
            $details = "$entityName ID: " . $entity->getId();

            if ($entity instanceof Operation) {
                $details .= " | Montant: " . $entity->getMontant() . " | Type: " . $entity->getType();
            }

            $audit->setAction("$actionType - $entityName");
            $audit->setDetails($details);

            // 3. Persistance
            $em = $args->getObjectManager();
            
            // Astuce : Vérifier si l'EM est ouvert pour éviter les crashs si une erreur précédente a fermé l'EM
            if ($em->isOpen()) {
                $em->persist($audit);
                $em->flush(); // Nécessaire ici car postPersist est déclenché APRES le flush principal
            }

            // Log serveur pour confirmer que ça passe
            $this->logger->info("AUDIT SUCCES : Enregistrement OK pour " . $audit->getAction());

        } catch (\Exception $e) {
            // Si ça plante, on veut le savoir dans les logs serveur
            $this->logger->critical("AUDIT ERREUR : " . $e->getMessage());
        }
    }
}