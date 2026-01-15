<?php

namespace App\Controller;

use App\Repository\DemandeRepository;
use App\Repository\OperationRepository;
use App\Repository\TransfertRepository;
use App\Repository\CaisseRepository;
use App\Repository\SessionCaisseRepository;
use App\Entity\Demande; // On importe l'entité pour utiliser les constantes
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/alerts', name: 'api_alerts_')]
class AlertController extends AbstractController
{

#[Route('', name: 'get_summary', methods: ['GET'])]
public function getAlerts(
    DemandeRepository $demandeRepo,
    OperationRepository $operationRepo,
    TransfertRepository $transfertRepo,
    CaisseRepository $caisseRepo,
    SessionCaisseRepository $sessionRepo
): JsonResponse {
    $user = $this->getUser();
    if (!$user) {
        return $this->json(['error' => 'Non authentifié'], 401);
    }

    // --- SÉCURITÉ CLOISONNEMENT ---
    $societe = $user->getSociete();
    // Le Super Admin n'a pas d'alertes de gestion quotidienne
    if (!$societe) {
        return $this->json([]); 
    }

    $alerts = [];
    $roles = $user->getRoles();

    // --- 1. MANAGER ---
    if (in_array('ROLE_MANAGER', $roles)) {
        $alerts['manager'] = [
            'validations' => $demandeRepo->count(['statut' => 'ATTENTE_MANAGER']), 
            // Correction du statut 'PENDING' -> 'EN_ATTENTE' selon ton entité Operation
            'operations' => $operationRepo->count(['statut' => 'EN_ATTENTE']), 
            'cancellations' => 0 ,
            'ecarts' => $sessionRepo->count(['statut' => 'ECART', 'societe' => $societe])
        ];
    }

    // --- 2. CHEF DE SERVICE ---
    if (in_array('ROLE_CHEF_SERVICE', $roles)) {
        $service = $user->getService();
        if ($service) {
            $count = $demandeRepo->createQueryBuilder('d')
                ->select('count(d.id)')
                ->join('d.demandeur', 'u')
                ->where('u.service = :service')
                ->andWhere('d.statut = :statut')
                // Sécurité supplémentaire : on s'assure que la demande appartient à la même société
                ->andWhere('d.societe = :societe') 
                ->setParameter('service', $service)
                ->setParameter('statut', 'ATTENTE_CHEF')
                ->setParameter('societe', $societe)
                ->getQuery()
                ->getSingleScalarResult();

            $alerts['chef'] = ['team_validations' => (int) $count];
        }
    }

    // --- 3. CAISSIER ---
    if (in_array('ROLE_CAISSIER', $roles)) {
        $caisse = $caisseRepo->findOneBy(['employeAssigne' => $user, 'isDeleted' => false]); 
        
        if ($caisse) {
            $incoming = $transfertRepo->count([
                'caisseArrivee' => $caisse,
                'statut' => 'EN_ATTENTE' 
            ]);

            $yesterday = new \DateTimeImmutable('-24 hours');
            $recentUpdates = $transfertRepo->createQueryBuilder('t')
                ->where('t.caisseDepart = :maCaisse')
                ->andWhere('t.statut IN (:finishedStatuses)')
                ->andWhere('t.dateCreation >= :dateLimit')
                ->setParameter('maCaisse', $caisse)
                ->setParameter('finishedStatuses', ['VALIDE', 'REJETE'])
                ->setParameter('dateLimit', $yesterday)
                ->getQuery()
                ->getResult();

            $alerts['caisse'] = [
                'incoming_transfers' => $incoming,
                'transfer_updates' => array_map(function($t) {
                    return [
                        'id' => $t->getId(),
                        'montant' => $t->getMontant(),
                        'statut' => $t->getStatut(),
                        'destinataire' => $t->getCaisseArrivee()->getNom(),
                        'date' => $t->getDateCreation()->format('H:i')
                    ];
                }, $recentUpdates)
            ];
        }
    }

    // --- 4. EMPLOYE (MES DEMANDES) ---
    $myActiveRequests = $demandeRepo->findBy(
        ['demandeur' => $user], 
        ['id' => 'DESC'],
        5
    );

    $filteredRequests = [];
    foreach($myActiveRequests as $d) {
        // On filtre pour ne garder que ce qui est "en cours"
        if (!in_array($d->getStatut(), ['PAYEE', 'REFUSEE', 'REJETEE'])) {
            $filteredRequests[] = [
                'id' => $d->getId(),
                'motif' => mb_strimwidth($d->getTitre(), 0, 25, "..."),
                'statut' => $d->getStatut(),
                'montant' => $d->getMontantEstime(),
                'numero_reference' => $d->getNumeroReference()
            ];
        }
    }
    $alerts['my_requests'] = $filteredRequests;

    return $this->json($alerts);
}
}