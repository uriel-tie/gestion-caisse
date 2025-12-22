<?php

namespace App\Controller;

use App\Repository\DemandeRepository;
use App\Repository\OperationRepository;
use App\Repository\TransfertRepository;
use App\Repository\CaisseRepository;
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
        CaisseRepository $caisseRepo
    ): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        $alerts = [];
        $roles = $user->getRoles();
        $debugErrors = [];

        // --- 1. MANAGER ---
        // Le manager voit ce qui est validé par les chefs (ATTENTE_MANAGER)
        if (in_array('ROLE_MANAGER', $roles) || in_array('ROLE_ADMIN', $roles)) {
            try {
                $alerts['manager'] = [
                    // CORRECTION STATUT : On utilise la constante ou la string exacte
                    'validations' => $demandeRepo->count(['statut' => 'ATTENTE_MANAGER']), 
                    'operations' => $operationRepo->count(['statut' => 'PENDING']),
                    'cancellations' => 0 
                ];
            } catch (\Exception $e) {
                $debugErrors['manager'] = $e->getMessage();
            }
        }

        // --- 2. CHEF DE SERVICE ---
        // Le chef voit les demandes de SON service qui sont en ATTENTE_CHEF
        if (in_array('ROLE_CHEF_SERVICE', $roles)) {
            try {
                $service = method_exists($user, 'getService') ? $user->getService() : null;
                
                if ($service) {
                    // CORRECTION MAJEURE : On doit faire une jointure car Demande n'a pas de champ 'service'
                    // On cherche : Les demandes (d) dont le demandeur (u) appartient au service (:service)
                    $count = $demandeRepo->createQueryBuilder('d')
                        ->select('count(d.id)')
                        ->join('d.demandeur', 'u') // Jointure vers l'utilisateur
                        ->where('u.service = :service')
                        ->andWhere('d.statut = :statut')
                        ->setParameter('service', $service)
                        ->setParameter('statut', 'ATTENTE_CHEF') // Le bon statut selon ton entité
                        ->getQuery()
                        ->getSingleScalarResult();

                    $alerts['chef'] = [
                        'team_validations' => (int) $count,
                    ];
                }
            } catch (\Exception $e) {
                $debugErrors['chef'] = $e->getMessage();
            }
        }

        // --- 3. CAISSIER ---
        if (in_array('ROLE_CAISSIER', $roles) || in_array('ROLE_ADMIN', $roles)) {
            try {
                $caisse = $caisseRepo->findOneBy(['employeAssigne' => $user]); 
                
                if ($caisse) {
                    $incoming = $transfertRepo->count([
                        'caisseArrivee' => $caisse,
                        'statut' => 'EN_ATTENTE' 
                    ]);

                    $yesterday = new \DateTimeImmutable('-24 hours');
                    // On vérifie que getDateValidation existe bien dans Transfert, sinon utiliser updatedAt
                    $recentUpdates = $transfertRepo->createQueryBuilder('t')
                        ->where('t.caisseDepart = :maCaisse')
                        ->andWhere('t.statut IN (:finishedStatuses)')
                        ->andWhere('t.dateCreation >= :dateLimit') // Fallback sur dateCreation si dateValidation est null
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
            } catch (\Exception $e) {
                $debugErrors['caisse'] = $e->getMessage();
            }
        }

        // --- 4. EMPLOYE (MES DEMANDES) ---
        try {
            $myActiveRequests = $demandeRepo->findBy(
                ['demandeur' => $user], 
                ['id' => 'DESC'],
                5
            );

            $filteredRequests = [];
            foreach($myActiveRequests as $d) {
                if (!in_array($d->getStatut(), ['PAYEE', 'REFUSEE', 'REJETEE'])) {
                    $filteredRequests[] = [
                        'id' => $d->getId(),
                        'motif' => substr($d->getTitre(), 0, 20) . '...', // Titre au lieu de Motif (n'existe pas dans ton entité)
                        'statut' => $d->getStatut(),
                        'montant' => $d->getMontantEstime(), // MontantEstime au lieu de Montant
                        'numero_reference' => $d->getNumeroReference() // Ajout du Numero_Reference
                    ];
                }
            }
            $alerts['my_requests'] = $filteredRequests;

        } catch (\Exception $e) {
            $debugErrors['my_requests'] = $e->getMessage();
        }

        if (!empty($debugErrors)) {
            $alerts['DEBUG_ERRORS'] = $debugErrors;
        }

        return $this->json($alerts);
    }
}