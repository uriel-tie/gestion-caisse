<?php

namespace App\Controller;

use App\Entity\SessionCaisse;
use App\Repository\CaisseRepository;
use App\Repository\SessionCaisseRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/sessions', name: 'api_sessions_')]
class SessionController extends AbstractController
{
    // 1. OUVERTURE AUTOMATIQUE (Simplifiée)
    #[Route('/open', name: 'open', methods: ['POST'])]
    public function openSession(
        SessionCaisseRepository $sessionRepo,
        CaisseRepository $caisseRepo, // Ajout du repo Caisse
        EntityManagerInterface $em
    ): JsonResponse
    {
        $user = $this->getUser();

        // A. Vérifier si session déjà ouverte
        $existingSession = $sessionRepo->findSessionActive($user);
        if ($existingSession) {
            return $this->json(['error' => 'Session déjà active.'], 400);
        }

        // B. Trouver LA caisse assignée au caissier
        // On suppose que la relation est Caisse -> employeAssigne
        $caisse = $caisseRepo->findOneBy(['employeAssigne' => $user]);

        if (!$caisse) {
            return $this->json(['error' => 'Aucune caisse ne vous est assignée.'], 403);
        }

        if ($caisse->isEstOuverte()) {
             // Cas rare : Caisse marquée ouverte mais pas par ce user (bug ou autre)
             // On peut forcer ou bloquer. Ici on bloque par sécurité.
             return $this->json(['error' => 'Cette caisse est déjà marquée comme ouverte.'], 400);
        }

        // C. Création Session Directe
        $session = new SessionCaisse();
        $session->setCaissier($user);
        $session->setCaisse($caisse);
        $session->setStatut(SessionCaisse::STATUT_OUVERTE); // Directement ouverte
        
        // D. Reprise du solde existant de la caisse (Continuité)
        $soldeActuel = $caisse->getSolde() ?? '0.00';
        $session->setMontantOuverture($soldeActuel);

        // E. Mise à jour état Caisse
        $caisse->setEstOuverte(true);

        $em->persist($session);
        $em->flush();

        return $this->json(['message' => 'Session ouverte avec succès.', 'solde' => $soldeActuel], 201);
    }

    // 2. FERMETURE (Reste identique, le caissier compte pour vérifier)
    #[Route('/close', name: 'close', methods: ['POST'])]
    public function closeSession(
        Request $request,
        SessionCaisseRepository $sessionRepo,
        // ... (le reste des arguments comme OperationRepo, EM)
        \App\Repository\OperationRepository $opRepo, // Injection manquante dans l'exemple précédent
        EntityManagerInterface $em
    ): JsonResponse
    {
        $user = $this->getUser();
        $session = $sessionRepo->findSessionActive($user);
        
        if (!$session) return $this->json(['error' => 'Pas de session active.'], 400);

        $data = json_decode($request->getContent(), true);
        $montantPhysique = (float) ($data['montant_final'] ?? 0);

        // Calculs
        $fondDepart = (float) $session->getMontantOuverture();
        $mouvements = $opRepo->getSoldeMouvementsSession($session);
        $montantTheorique = $fondDepart + $mouvements;
        $ecart = $montantPhysique - $montantTheorique;

        // Enregistrement
        $session->setMontantFermeture((string)$montantPhysique);
        $session->setMontantTheorique((string)$montantTheorique);
        $session->setDateFermeture(new \DateTimeImmutable());
        $session->setStatut(SessionCaisse::STATUT_FERMEE);
        
        // Libérer la caisse
        $session->getCaisse()->setEstOuverte(false);
        // Optionnel : Mettre à jour le solde réel de la caisse avec le physique compté (pour corriger les erreurs)
        // $session->getCaisse()->setSolde((string)$montantPhysique); 

        $em->flush();

        return $this->json(['message' => 'Session close.', 'ecart' => $ecart]);
    }

    // 3. GET ME (Pour le front)
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function getMySession(SessionCaisseRepository $sessionRepo, CaisseRepository $caisseRepo): JsonResponse 
    {
        $user = $this->getUser();
        
        // 1. Session Active ?
        $session = $sessionRepo->findSessionActive($user);
        if ($session) {
            return $this->json([
                'hasSession' => true,
                'session' => [
                    'id' => $session->getId(),
                    'statut' => $session->getStatut(),
                    'montant' => $session->getMontantOuverture()
                ],
                'caisse' => [
                    'id' => $session->getCaisse()->getId(),
                    'nom' => $session->getCaisse()->getNom()
                ]
            ]);
        }

        // 2. Sinon, Caisse Assignée ?
        $caisse = $caisseRepo->findOneBy(['employeAssigne' => $user]);
        if ($caisse) {
            return $this->json([
                'hasSession' => false,
                'caisse' => [
                    'id' => $caisse->getId(),
                    'nom' => $caisse->getNom(),
                    'estOuverte' => $caisse->isEstOuverte() // Savoir si elle est prise par un autre (bug/admin)
                ]
            ]);
        }

        // 3. Rien du tout
        return $this->json(['hasSession' => false, 'caisse' => null]);
    }
}