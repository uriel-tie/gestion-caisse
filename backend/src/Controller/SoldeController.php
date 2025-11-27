<?php

namespace App\Controller;

use App\Repository\CaisseRepository;
use App\Repository\SessionCaisseRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/solde', name: 'api_solde_')]
class SoldeController extends AbstractController
{
    #[Route('', name: 'get', methods: ['GET'])]
    public function getSolde(
        SessionCaisseRepository $sessionRepo, 
        CaisseRepository $caisseRepo
    ): JsonResponse
    {
        $user = $this->getUser();

        // CAS 1 : MANAGER -> Il reçoit le détail par caisse
        if ($this->isGranted('ROLE_MANAGER')) {
            $caisses = $caisseRepo->findAll();
            $details = [];
            
            // On construit la liste détaillée
            foreach ($caisses as $caisse) {
                $details[] = [
                    'id' => $caisse->getId(),
                    'nom' => $caisse->getNom(),
                    'solde' => (float) $caisse->getSolde(), // Le solde spécifique de cette caisse
                    'estOuverte' => $caisse->isEstOuverte(),
                    'caissier' => $caisse->getEmployeAssigne() ? $caisse->getEmployeAssigne()->getNom() : 'Aucun'
                ];
            }

            return $this->json([
                'mode' => 'MULTI_CAISSE',
                'caisses' => $details, // Le tableau complet
                'devise' => 'EUR',
                'date' => date('c')
            ]);
        }

        // CAS 2 : CAISSIER -> Il ne voit que SON solde (Mono-Caisse)
        else {
            $session = $sessionRepo->findSessionActive($user);
            $solde = 0.0;
            
            if ($session && $session->getCaisse()) {
                $solde = (float) $session->getCaisse()->getSolde();
            }

            return $this->json([
                'mode' => 'MONO_CAISSE',
                'solde' => $solde, // Juste un chiffre
                'devise' => 'EUR',
                'date' => date('c')
            ]);
        }
    }
}