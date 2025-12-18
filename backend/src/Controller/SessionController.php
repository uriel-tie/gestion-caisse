<?php

namespace App\Controller;

use App\Entity\SessionCaisse;
use App\Entity\Caisse;
use App\Repository\SessionCaisseRepository;
use App\Repository\CaisseRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/sessions')]
class SessionController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    // --- 1. OUVRIR UNE SESSION ---
    #[Route('/open', name: 'api_sessions_open', methods: ['POST'])]
    public function open(Request $request, CaisseRepository $caisseRepo, SessionCaisseRepository $sessionRepo): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) return new JsonResponse(['message' => 'Non authentifié'], 401);

        $data = json_decode($request->getContent(), true);
        $caisseId = $data['caisse_id'] ?? null;
        $montantOuverture = $data['montant_ouverture'] ?? 0;

        if (!$caisseId) {
            return new JsonResponse(['message' => 'ID de caisse manquant'], 400);
        }

        // A. Vérifier si le caissier a déjà une session active (Interdit d'en avoir 2)
        $sessionActive = $sessionRepo->findOneBy(['caissier' => $user, 'statut' => SessionCaisse::STATUT_OUVERTE]);
        if ($sessionActive) {
            return new JsonResponse([
                'message' => 'Vous avez déjà une session ouverte',
                'session_id' => $sessionActive->getId()
            ], 409); // Conflit
        }

        // B. Récupérer la caisse
        $caisse = $caisseRepo->find($caisseId);
        if (!$caisse) return new JsonResponse(['message' => 'Caisse introuvable'], 404);

        // C. Création de la session
        $session = new SessionCaisse();
        $session->setCaissier($user);
        $session->setCaisse($caisse);
        $session->setMontantOuverture((string)$montantOuverture);
        $session->setStatut(SessionCaisse::STATUT_OUVERTE);
        
        // Optionnel : Récupérer le solde de la fermeture précédente pour vérifier la continuité
        // $lastSession = $sessionRepo->findLastClosedSession($caisse);
        // if ($lastSession && $lastSession->getMontantFermeture() !== $montantOuverture) { Alerte... }

        $this->em->persist($session);
        $this->em->flush();

        return new JsonResponse([
            'message' => 'Session ouverte avec succès',
            'session_id' => $session->getId(),
            'date_ouverture' => $session->getDateOuverture()->format('c')
        ], 201);
    }
    // --- 2. FERMER UNE SESSION ---
   #[Route('/{id}/close', name: 'api_sessions_close', methods: ['POST'])]
    public function close(
        string $id, 
        Request $request, 
        SessionCaisseRepository $sessionRepo,
        \App\Repository\OperationRepository $opRepo
    ): JsonResponse
    {
        $session = $sessionRepo->find($id);
        if (!$session) return new JsonResponse(['message' => 'Session introuvable'], 404);

        if ($session->getCaissier() !== $this->getUser() && !$this->isGranted('ROLE_ADMIN')) {
            return new JsonResponse(['message' => 'Accès interdit'], 403);
        }

        if ($session->getStatut() !== SessionCaisse::STATUT_OUVERTE) {
            return new JsonResponse(['message' => 'Session déjà fermée'], 400);
        }

        // --- VERIFICATIONS ---
        $operationsNonJustifiees = $opRepo->count(['sessionCaisse' => $session, 'statut' => 'PENDING_PROOF']);
        if ($operationsNonJustifiees > 0) {
            return new JsonResponse(['message' => 'Justificatifs manquants.', 'code_erreur' => 'MISSING_PROOFS'], 422);
        }

        // --- TRAITEMENT DU BILLETAGE ---
        $data = json_decode($request->getContent(), true);
        $billetage = $data['billetage'] ?? []; 

        if (empty($billetage)) {
            return new JsonResponse(['message' => 'Le billetage est obligatoire pour fermer.'], 400);
        }

        // Calcul du montant physique à partir des billets déclarés
        $montantPhysique = 0.0;
        foreach ($billetage as $valeur => $quantite) {
            // Sécurité : on s'assure que $valeur est un nombre valide
            $valeurFloat = (float) $valeur;
            $qteInt = (int) $quantite;
            if ($valeurFloat > 0 && $qteInt > 0) {
                $montantPhysique += $valeurFloat * $qteInt;
            }
        }

        // Calcul du Théorique
        $totalEntrees = $opRepo->getSumEntreesBySession($session) ?? 0;
        $totalSorties = $opRepo->getSumSortiesBySession($session) ?? 0;
        $soldeTheorique = (float)$session->getMontantOuverture() + $totalEntrees - $totalSorties;
        
        $ecart = $montantPhysique - $soldeTheorique;

        // Mise à jour Session
        $session->setDateFermeture(new \DateTimeImmutable());
        $session->setMontantTheorique((string)$soldeTheorique);
        $session->setMontantFermeture((string)$montantPhysique);
        $session->setBilletage($billetage); // On sauvegarde le détail JSON

        if (abs($ecart) > 5) { // Tolérance de 5 FCFA pour les arrondis
            $session->setStatut(SessionCaisse::STATUT_ECART);
        } else {
            $session->setStatut(SessionCaisse::STATUT_FERMEE);
        }

        $this->em->flush();

        return new JsonResponse([
            'message' => 'Session fermée avec succès',
            'statut' => $session->getStatut(),
            'ecart' => $ecart,
            'physique' => $montantPhysique
        ]);
    }
}