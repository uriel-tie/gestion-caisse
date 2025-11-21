<?php

namespace App\Controller;

use App\Entity\SessionCaisse;
use App\Repository\CaisseRepository;
use App\Repository\OperationRepository;
use App\Repository\SessionCaisseRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/sessions', name: 'api_sessions_')]
class SessionController extends AbstractController
{
    // 1. LE CAISSIER DEMANDE L'OUVERTURE
    #[Route('/request', name: 'request', methods: ['POST'])]
    public function requestOpening(
        Request $request, 
        CaisseRepository $caisseRepo, 
        SessionCaisseRepository $sessionRepo,
        EntityManagerInterface $em
    ): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        // A. Vérifier si le caissier a déjà une session en cours ou en attente
        $existingSession = $sessionRepo->createQueryBuilder('s')
            ->where('s.caissier = :user')
            ->andWhere('s.statut IN (:statuts)')
            ->setParameter('user', $user)
            ->setParameter('statuts', [SessionCaisse::STATUT_OUVERTE, SessionCaisse::STATUT_EN_ATTENTE])
            ->getQuery()
            ->getOneOrNullResult();

        if ($existingSession) {
            return $this->json(['error' => 'Vous avez déjà une session en cours ou en demande.'], 400);
        }

        // B. Vérifier la caisse demandée
        $caisse = $caisseRepo->find($data['caisse_id']);
        if (!$caisse || $caisse->isEstOuverte()) {
            return $this->json(['error' => 'Caisse introuvable ou déjà utilisée par quelqu\'un d\'autre.'], 400);
        }

        // C. Créer la demande
        $session = new SessionCaisse();
        $session->setCaissier($user);
        $session->setCaisse($caisse);
        $session->setStatut(SessionCaisse::STATUT_EN_ATTENTE); // En attente du Manager
        $session->setMontantOuverture('0.00'); // Sera défini par le Manager

        $em->persist($session);
        $em->flush();

        return $this->json(['message' => 'Demande d\'ouverture envoyée au responsable.'], 201);
    }

    // 2. LE MANAGER VALIDE L'OUVERTURE (Et donne le fond de caisse)
    #[Route('/{id}/validate', name: 'validate', methods: ['PATCH'])]
    public function validateOpening(
        SessionCaisse $session, 
        Request $request, 
        EntityManagerInterface $em
    ): JsonResponse
    {
        // Seul un manager/chef peut valider
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        if ($session->getStatut() !== SessionCaisse::STATUT_EN_ATTENTE) {
            return $this->json(['error' => 'Cette session n\'est pas en attente.'], 400);
        }

        $data = json_decode($request->getContent(), true);
        $fondCaisse = $data['montant_ouverture'] ?? 0;

        // On active tout
        $session->setStatut(SessionCaisse::STATUT_OUVERTE);
        $session->setMontantOuverture((string)$fondCaisse);
        $session->setDateOuverture(new \DateTimeImmutable()); // L'heure réelle du début
        
        // On marque la caisse comme "Occupée"
        $session->getCaisse()->setEstOuverte(true);

        $em->flush();

        return $this->json(['message' => 'Session ouverte avec succès.']);
    }

    // 3. LE CAISSIER FERME SA SESSION (Clôture)
    #[Route('/close', name: 'close', methods: ['POST'])]
    public function closeSession(
        Request $request,
        SessionCaisseRepository $sessionRepo,
        OperationRepository $opRepo,
        EntityManagerInterface $em
    ): JsonResponse
    {
        $user = $this->getUser();
        
        // Trouver la session active
        $session = $sessionRepo->findSessionActive($user);
        if (!$session) {
            return $this->json(['error' => 'Aucune session active à clôturer.'], 400);
        }

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

        $em->flush();

        return $this->json([
            'message' => 'Session clôturée.',
            'solde_theorique' => $montantTheorique,
            'solde_physique' => $montantPhysique,
            'ecart' => $ecart
        ]);
    }
    
    // 4. RECUPERER MA SESSION ACTUELLE (Pour le Frontend)
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function getMySession(SessionCaisseRepository $sessionRepo): JsonResponse 
    {
        $user = $this->getUser();
        $session = $sessionRepo->findOneBy(
            ['caissier' => $user], 
            ['dateOuverture' => 'DESC'] // La dernière
        );

        if (!$session) return $this->json(null); // Pas de session

        // Si la dernière est fermée, on renvoie null ou l'info qu'elle est fermée
        if ($session->getStatut() === SessionCaisse::STATUT_FERMEE) {
             return $this->json(['statut' => 'AUCUNE']); 
        }

        return $this->json([
            'id' => $session->getId(),
            'statut' => $session->getStatut(),
            'caisse' => $session->getCaisse()->getNom(),
            'montant_ouverture' => $session->getMontantOuverture(),
            'date_ouverture' => $session->getDateOuverture()->format('c')
        ]);
    }
}