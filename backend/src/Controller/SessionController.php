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

        // A. Vérifier que c'est bien le propriétaire qui ferme (ou un Admin)
        if ($session->getCaissier() !== $this->getUser() && !$this->isGranted('ROLE_ADMIN')) {
            return new JsonResponse(['message' => 'Accès interdit à cette session'], 403);
        }

        if ($session->getStatut() !== SessionCaisse::STATUT_OUVERTE) {
            return new JsonResponse(['message' => 'Cette session est déjà fermée'], 400);
        }

        // --- RÈGLE BLOQUANTE : JUSTIFICATIFS ---
        
         $operationsNonJustifiees = $opRepo->count([
            'sessionCaisse' => $session,
            'statut' => 'PENDING_PROOF' 
        ]);

        if ($operationsNonJustifiees > 0) {
            return new JsonResponse([
                'message' => 'Fermeture impossible : Il manque des justificatifs.',
                'code_erreur' => 'MISSING_PROOFS',
                'count' => $operationsNonJustifiees
            ], 422); // Unprocessable Entity
        }
        

        // B. Récupération des données de fermeture
        $data = json_decode($request->getContent(), true);
        $montantPhysique = $data['montant_physique'] ?? null; // Le montant compté par le caissier

        if ($montantPhysique === null) {
            return new JsonResponse(['message' => 'Le montant physique est obligatoire'], 400);
        }

        // C. Calcul du Solde Théorique (Backend)
        // Théorique = Montant Ouverture + (Total Entrées - Total Sorties)
        $totalEntrees = $opRepo->getSumEntreesBySession($session); // Tu devras créer cette méthode dans le Repo
        $totalSorties = $opRepo->getSumSortiesBySession($session); // Idem
        
        $soldeTheorique = (float)$session->getMontantOuverture() + $totalEntrees - $totalSorties;
        $soldePhysique = (float)$montantPhysique;
        $ecart = $soldePhysique - $soldeTheorique;

        // D. Mise à jour de la Session
        $session->setDateFermeture(new \DateTimeImmutable());
        $session->setMontantTheorique((string)$soldeTheorique);
        $session->setMontantFermeture((string)$soldePhysique);
        
        // Gestion du statut selon l'écart
        // On tolère un petit écart de flottant (epsilon) si besoin, sinon strict 0
        if (abs($ecart) > 0.01) {
            $session->setStatut(SessionCaisse::STATUT_ECART);
            // TODO: Ici, tu pourrais créer automatiquement une Opération de régularisation si tu veux
        } else {
            $session->setStatut(SessionCaisse::STATUT_FERMEE);
        }

        $this->em->flush();

        return new JsonResponse([
            'message' => 'Session fermée',
            'statut' => $session->getStatut(),
            'ecart' => $ecart,
            'theorique' => $soldeTheorique,
            'physique' => $soldePhysique
        ]);
    }
}