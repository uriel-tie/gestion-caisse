<?php

namespace App\Controller;

use App\Entity\Societe;
use App\Entity\Utilisateur;
use App\Repository\SocieteRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin')]
#[IsGranted('ROLE_SUPER_ADMIN', message: 'Accès réservé au Super Administrateur')]
class AdminController extends AbstractController
{
    // 1. Lister toutes les entreprises avec leur manager principal
   #[Route('/dashboard', name: 'admin_dashboard', methods: ['GET'])]
    public function dashboard(SocieteRepository $societeRepository, UtilisateurRepository $userRepo): JsonResponse
    {
        $societes = $societeRepository->findAll();
        $data = [];

        foreach ($societes as $societe) {
            $manager = null;
            // On récupère TOUS les utilisateurs de la société
            $users = $userRepo->findBy(['societe' => $societe]);
            
            // On cherche manuellement celui qui a le rôle MANAGER
            foreach ($users as $u) {
                if (in_array('ROLE_MANAGER', $u->getRoles())) {
                    $manager = $u;
                    break;
                }
            }

            $data[] = [
                'id' => $societe->getId(),
                'nom' => $societe->getNom(),
                'ncc' => $societe->getNumeroCompteContribuable(),
                'isActive' => $societe->isActive(),
                'manager' => $manager ? [
                    'id' => $manager->getId(),
                    'nomComplet' => $manager->getNom(),
                    'email' => $manager->getEmail(),
                    'estActif' => $manager->isEstActif(),
                ] : null,
            ];
        }

        return $this->json($data);
    }

    // 2. Activer / Désactiver une Entreprise
    #[Route('/societe/{id}/toggle', name: 'admin_toggle_societe', methods: ['POST'])]
    public function toggleSociete(Societe $societe, EntityManagerInterface $em): JsonResponse
    {
        $newState = !$societe->isActive();
        $societe->setIsActive($newState);
        
        // Optionnel : Si on désactive l'entreprise, on peut vouloir désactiver le manager aussi
        // Pour l'instant on garde ça simple.

        $em->flush();

        return $this->json([
            'message' => 'Statut de l\'entreprise mis à jour',
            'isActive' => $newState
        ]);
    }

    // 3. Activer / Désactiver un Manager (Utilisateur)
    #[Route('/user/{id}/toggle', name: 'admin_toggle_user', methods: ['POST'])]
    public function toggleUser(Utilisateur $user, EntityManagerInterface $em): JsonResponse
    {
        // Vérification de sécurité : on ne touche pas aux autres Super Admins
        if (in_array('ROLE_SUPER_ADMIN', $user->getRoles())) {
            return $this->json(['message' => 'Impossible de modifier un Super Admin'], 403);
        }

        $newState = !$user->isEstActif();
        $user->setEstActif($newState);
        $em->flush();

        return $this->json([
            'message' => 'Statut de l\'utilisateur mis à jour',
            'estActif' => $newState
        ]);
    }
}