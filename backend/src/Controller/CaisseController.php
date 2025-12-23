<?php

namespace App\Controller;

use App\Entity\Caisse;
use App\Entity\Utilisateur;
use App\Entity\SessionCaisse;
use App\Repository\CaisseRepository;
use App\Repository\SessionCaisseRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Repository\CompteComptableRepository;

#[Route('/api/caisses', name: 'api_caisses_')]
class CaisseController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(CaisseRepository $repo): JsonResponse
    {
        $caisses = $repo->findBy(['isDeleted' => false]);
        $data = [];
        foreach ($caisses as $c) {
            $employe = $c->getEmployeAssigne();
            $compte = $c->getCompteComptable();
            $data[] = [
                'id' => $c->getId(),
                'nom' => $c->getNom(),
                'estOuverte' => $c->isEstOuverte(),
                'seuilDecaissement' => $c->getSeuilDecaissement(),
                'employeAssigne' => $employe ? [
                    'id' => $employe->getId(),
                    'nom' => $employe->getNom(),
                    'email' => $employe->getEmail(),
                ] : null,
                'compte' => $compte ? [
                    'id' => $compte->getId(),
                    'numero' => $compte->getNumero(),
                    'libelle' => $compte->getLibelle()
                ] : null
            ];
        }
        return $this->json($data);
    }
    #[Route('/me', name: 'api_caisse_me', methods: ['GET'])]
    public function myCaisseStatus(
        CaisseRepository $caisseRepo, 
        SessionCaisseRepository $sessionRepo
    ): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['message' => 'Non authentifié'], 401);

        // 1. Chercher si l'utilisateur est assigné à une caisse
        // (Supposons que ton entité Caisse a un champ 'employeAssigne')
        $maCaisse = $caisseRepo->findOneBy(['employeAssigne' => $user]);

        if (!$maCaisse) {
            return $this->json([
                'has_caisse' => false,
                'message' => 'Aucune caisse ne vous est assignée.'
            ]);
        }

        // 2. Si oui, vérifier s'il a une session OUVERTE sur cette caisse
        $sessionActive = $sessionRepo->findOneBy([
            'caissier' => $user,
            'caisse' => $maCaisse,
            'statut' => SessionCaisse::STATUT_OUVERTE
        ]);

        return $this->json([
            'has_caisse' => true,
            'caisse_id' => $maCaisse->getId(),
            'caisse_nom' => $maCaisse->getNom(),
            'solde_actuel' => $maCaisse->getSolde(), // Utile pour l'affichage
            
            // Infos sur la session
            'session_status' => $sessionActive ? 'OUVERTE' : 'FERMEE',
            'session_id' => $sessionActive ? $sessionActive->getId() : null,
            'date_ouverture' => $sessionActive ? $sessionActive->getDateOuverture()->format('c') : null
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        UtilisateurRepository $userRepo,
        CompteComptableRepository $compteRepo
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $data = json_decode($request->getContent(), true);

        if (empty($data['nom'])) {
            return $this->json(['error' => 'Nom de caisse obligatoire'], 400);
        }

        $caisse = new Caisse();
        $caisse->setNom($data['nom']);
        $seuil = !empty($data['seuil']) ? (string)$data['seuil'] : '50000';
        $caisse->setSeuilDecaissement($seuil);
        $caisse->setEstOuverte(false); // Fermée par défaut à la création

        if (!empty($data['employe_id'])) {
            $employe = $userRepo->find($data['employe_id']);
            if (!$employe) {
                return $this->json(['error' => 'Employé introuvable'], 404);
            }
            $this->detachExistingAssignment($employe, $em);
            $caisse->setEmployeAssigne($employe);
        }

        if (!empty($data['compte_id'])) {
            $compte = $compteRepo->find($data['compte_id']);
            if ($compte) $caisse->setCompteComptable($compte);
        }

        $em->persist($caisse);
        $em->flush();

        return $this->json(['message' => 'Caisse créée', 'id' => $caisse->getId()], 201);
    }
    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(
        Caisse $caisse,
        Request $request,
        EntityManagerInterface $em,
        \App\Repository\CompteComptableRepository $compteRepo
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');
        $data = json_decode($request->getContent(), true);

        // Modification du Nom
        if (isset($data['nom'])) {
            $caisse->setNom($data['nom']);
        }

        // Modification du Seuil de Décaissement
        if (isset($data['seuil'])) {
            $caisse->setSeuilDecaissement((string)$data['seuil']);
        }

        // Modification du Compte Comptable
        if (array_key_exists('compte_id', $data)) {
            $compteId = $data['compte_id'];
            if ($compteId) {
                $compte = $compteRepo->find($compteId);
                $caisse->setCompteComptable($compte);
            } else {
                $caisse->setCompteComptable(null);
            }
        }

        $em->flush();

        return $this->json(['message' => 'Caisse mise à jour avec succès']);
    }

    #[Route('/{id}/assign', name: 'assign', methods: ['PATCH'])]
    public function assign(
        Caisse $caisse,
        Request $request,
        UtilisateurRepository $userRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $data = json_decode($request->getContent(), true);
        $employeId = $data['employe_id'] ?? null;

        if ($employeId) {
            $employe = $userRepo->find($employeId);
            if (!$employe) {
                return $this->json(['error' => 'Employé introuvable'], 404);
            }

            $this->detachExistingAssignment($employe, $em, $caisse);
            $caisse->setEmployeAssigne($employe);
        } else {
            $caisse->setEmployeAssigne(null);
        }

        $em->flush();

        return $this->json([
            'message' => 'Affectation mise à jour',
            'caisse' => [
                'id' => $caisse->getId(),
                'employe' => $caisse->getEmployeAssigne() ? $caisse->getEmployeAssigne()->getNom() : null,
            ]
        ]);
    }

    #[Route('/me', name: 'my_caisse', methods: ['GET'])]
    public function myCaisse(CaisseRepository $repo): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(null);
        }

        $caisse = $repo->findOneByEmploye($user);
        if (!$caisse) {
            return $this->json(null);
        }

        return $this->json([
            'id' => $caisse->getId(),
            'nom' => $caisse->getNom(),
            'estOuverte' => $caisse->isEstOuverte(),
        ]);
    }

    private function detachExistingAssignment(Utilisateur $employe, EntityManagerInterface $em, ?Caisse $current = null): void
    {
        $existing = $em->getRepository(Caisse::class)->findOneBy(['employeAssigne' => $employe]);
        $existingId = $existing?->getId()?->toRfc4122();
        $currentId = $current?->getId()?->toRfc4122();

        if ($existing && (!$current || $existingId !== $currentId)) {
            $existing->setEmployeAssigne(null);
            $em->persist($existing);
        }
    }
#[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Caisse $caisse, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        // 1. VÉRIFICATION DU SOLDE
        // On s'assure que le solde est strictement égal à 0
        if ((float)$caisse->getSolde() != 0) {
            return $this->json([
                'error' => 'Impossible de supprimer une caisse qui contient encore de l\'argent. Veuillez faire un transfert ou un décaissement pour vider la caisse d\'abord.'
            ], 400); // 400 Bad Request
        }

        // 2. VÉRIFICATION SESSION OUVERTE (Optionnel mais conseillé)
        if ($caisse->isEstOuverte()) {
            return $this->json([
                'error' => 'Impossible de supprimer une caisse en cours d\'utilisation (ouverte).'
            ], 400);
        }

        // 3. SOFT DELETE
        $caisse->setIsDeleted(true);
        // On désassigne l'employé pour éviter les conflits futurs
        $caisse->setEmployeAssigne(null); 
        
        $em->flush();

        return $this->json(['message' => 'Caisse supprimée avec succès.']);
    } 
}