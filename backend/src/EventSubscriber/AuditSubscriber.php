<?php

namespace App\EventSubscriber;

use App\Entity\Audit;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Events;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;

#[AsDoctrineListener(event: Events::onFlush)]
class AuditSubscriber
{
    public function __construct(
        private Security $security,
        private RequestStack $requestStack
    ) {}

    public function onFlush(OnFlushEventArgs $args): void
    {
        $em = $args->getObjectManager();
        $uow = $em->getUnitOfWork();

        // 1. On récupère toutes les actions en cours
        foreach ($uow->getScheduledEntityInsertions() as $entity) {
            $this->createAudit($em, $entity, 'CREATE');
        }

        foreach ($uow->getScheduledEntityUpdates() as $entity) {
            $this->createAudit($em, $entity, 'UPDATE');
        }

        foreach ($uow->getScheduledEntityDeletions() as $entity) {
            $this->createAudit($em, $entity, 'DELETE');
        }
    }

    private function createAudit($em, $entity, string $action): void
    {
        // 1. Filtrage : On ne surveille pas l'Audit lui-même ni les logs techniques
        if ($entity instanceof Audit) return;

        // Liste blanche des entités à surveiller (Pour ne pas polluer avec tout)
        $watchedEntities = [
            \App\Entity\Demande::class,
            \App\Entity\Operation::class,
            \App\Entity\Caisse::class,
            \App\Entity\Utilisateur::class,
            \App\Entity\Transfert::class,
            \App\Entity\SessionCaisse::class,
        ];
        
        $className = get_class($entity);
        // Gestion des Proxies Doctrine (parfois la classe est Proxies\__CG__\App\Entity\...)
        if (strpos($className, 'Proxies') !== false) {
            $className = $em->getClassMetadata($className)->rootEntityName;
        }

        if (!in_array($className, $watchedEntities)) return;

        // 2. Contexte Utilisateur & IP
        $user = $this->security->getUser();
        $request = $this->requestStack->getCurrentRequest();
        $ip = $request ? $request->getClientIp() : 'CLI/System';
        
        // 3. Calcul du Diff (Le coeur du système)
        $changes = null;
        $uow = $em->getUnitOfWork();

        if ($action === 'UPDATE') {
            $changeSet = $uow->getEntityChangeSet($entity);
            $changes = [];
            foreach ($changeSet as $field => $values) {
                // On ignore les champs techniques
                if (in_array($field, ['updatedAt', 'createdAt', 'password'])) continue;
                
                // On formate les valeurs (Date, Objet...)
                $old = $this->formatValue($values[0]);
                $new = $this->formatValue($values[1]);

                if ($old !== $new) {
                    $changes[$field] = ['old' => $old, 'new' => $new];
                }
            }
            if (empty($changes)) return; // Si rien d'important n'a changé, on ne loggue pas
        }

        // 4. Création de l'Audit
        $audit = new Audit();
        $audit->setAction($action);
        $audit->setEntityClass((new \ReflectionClass($entity))->getShortName()); // Juste "Demande" au lieu du namespace complet
        $audit->setEntityId((string) $entity->getId());
        $audit->setIpAddress($ip);
        $audit->setDate(new \DateTimeImmutable());
        $audit->setChanges($changes);

        if ($user instanceof Utilisateur) {
            $audit->setUtilisateur($user);
            $audit->setActorName($user->getNom());
        } else {
            $audit->setActorName('Système');
        }

        // 5. Injection directe dans le flux de Doctrine (Sans refaire un flush global)
        $em->persist($audit);
        $auditMeta = $em->getClassMetadata(Audit::class);
        $uow->computeChangeSet($auditMeta, $audit);
    }

    private function formatValue(mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('d/m/Y H:i:s');
        }

        // 1. Si c'est un Utilisateur, on retourne son nom
        if ($value instanceof \App\Entity\Utilisateur) {
            // Vous pouvez concaténer prénom et nom si nécessaire : 
            // return $value->getPrenom() . ' ' . $value->getNom();
            return $value->getNom(); 
        }

        // 2. Si c'est une Caisse, on retourne son nom
        if ($value instanceof \App\Entity\Caisse) {
            return $value->getNom();
        }


        if (is_object($value) && method_exists($value, 'getId')) {
            // Fallback : Si c'est une autre entité qu'on a oublié de gérer spécifiquement
            return 'Ref#' . $value->getId(); 
        }

        if (is_array($value)) return 'Array(...)';
        
        return $value;
    }
}