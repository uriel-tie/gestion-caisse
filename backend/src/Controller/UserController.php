<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Repository\ServiceRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/users', name: 'api_users_')]
class UserController extends AbstractController
{
   #[Route('/{id}', name: 'api_users_show', methods: ['GET'])]
    public function show(string $id, UtilisateurRepository $utilisateurRepository): JsonResponse
    {
        // 1. On cherche l'utilisateur demandé par l'URL
        $user = $utilisateurRepository->find($id);

        if (!$user) {
            return new JsonResponse(['message' => 'Utilisateur introuvable'], 404);
        }

        // 2. On récupère l'utilisateur connecté (via le Token)
        $currentUser = $this->getUser();
        if (!$currentUser) {
             return new JsonResponse(['message' => 'Non authentifié'], 401);
        }

        // 3. SÉCURITÉ : Comparaison des IDs (plus fiable que l'identifier)
        // On force la conversion en string pour éviter les problèmes UUID Object vs String
        $currentUserId = (string) $currentUser->getId();
        $requestedUserId = (string) $user->getId();
        
        $isAdmin = in_array('ROLE_ADMIN', $currentUser->getRoles());

        // Si ce n'est pas moi ET que je ne suis pas admin => DEHORS
        if ($currentUserId !== $requestedUserId && !$isAdmin) {
            
            // --- MODE DEBUG (Pour t'aider à comprendre) ---
            // Affiche qui est connecté vs qui est demandé
            return new JsonResponse([
                'message' => 'Accès interdit',
                'debug_info' => [
                    'token_user_id' => $currentUserId,
                    'token_email' => $currentUser->getUserIdentifier(),
                    'requested_url_id' => $requestedUserId,
                    'requested_email' => $user->getUserIdentifier()
                ]
            ], 403);
        }

        // 4. RÉPONSE
        return new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'nom' => method_exists($user, 'getNom') ? $user->getNom() : '',
            'roles' => $user->getRoles(),
            'password_must_be_changed' => $user->isPasswordMustBeChanged(),
        ]);
    }

   #[Route('', name: 'list', methods: ['GET'])]
    public function list(UtilisateurRepository $repo): JsonResponse
    {
        /** @var Utilisateur $currentUser */
        $currentUser = $this->getUser();

        // On autorise Manager OU Chef de Service
        if (!$this->isGranted('ROLE_MANAGER') && !$this->isGranted('ROLE_CHEF_SERVICE')) {
             throw $this->createAccessDeniedException('Accès refusé.');
        }

        $criteria = ['isDeleted' => false];

        // SI C'EST UN CHEF DE SERVICE (et pas un manager) : On ne montre que SON service
        if ($this->isGranted('ROLE_CHEF_SERVICE') && !$this->isGranted('ROLE_MANAGER')) {
            $service = $currentUser->getService();
            if (!$service) {
                return $this->json([]); // Si le chef n'a pas de service, il ne voit personne
            }
            $criteria['service'] = $service;
        }

        $users = $repo->findBy($criteria);
        
        $data = [];
        foreach ($users as $u) {
            $data[] = [
                'id' => $u->getId(),
                'nom' => $u->getNom(),
                'email' => $u->getEmail(),
                'role' => $u->getRoles()[0], 
                'service' => $u->getService() ? $u->getService()->getNom() : 'Aucun',
                'actif' => $u->isEstActif()
            ];
        }
        return $this->json($data);
    }

   #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request, 
        EntityManagerInterface $em, 
        UserPasswordHasherInterface $hasher,
        ServiceRepository $serviceRepo
    ): JsonResponse
    {
        /** @var Utilisateur $currentUser */
        $currentUser = $this->getUser();
        $roles = $currentUser->getRoles();
        $isManager = in_array('ROLE_MANAGER', $roles);
        $isChef = in_array('ROLE_CHEF_SERVICE', $roles);

        // Sécurité d'accès
        if (!$isManager && !$isChef) {
            throw $this->createAccessDeniedException('Accès réservé aux Managers et Chefs de Service.');
        }

        $data = json_decode($request->getContent(), true);
        if (empty($data['email']) || empty($data['nom'])) {
            return $this->json(['error' => 'Données incomplètes'], 400);
        }

        $user = new Utilisateur();
        $user->setEmail($data['email']);
        $user->setNom($data['nom']);

        // LOGIQUE SPÉCIFIQUE PAR RÔLE
        if ($isChef) {
            // Le Chef ne peut créer QUE des employés de SON service
            $user->setRoles(['ROLE_EMPLOYE']);
            $user->setService($currentUser->getService());
        } else {
            // Le Manager peut tout faire
            $role = $data['role'] ?? 'ROLE_EMPLOYE';
            $user->setRoles([$role]);
            
            if (!empty($data['service_id'])) {
                $service = $serviceRepo->find($data['service_id']);
                if ($service) $user->setService($service);
            }
        }

        // Génération Password et Reste du code (identique à avant)
        $emailParts = explode('@', $data['email']);
        $prefix = ucfirst($emailParts[0]);
        $tempPassword = $prefix . '@2025!';
        
        $hashedPassword = $hasher->hashPassword($user, $tempPassword);
        $user->setPassword($hashedPassword);
        $user->setPasswordMustBeChanged(true);
        $user->setEstActif(true);

        $em->persist($user);
        $em->flush();

        return $this->json([
            'message' => 'Utilisateur créé avec succès.',
            'temp_password' => $tempPassword,
            'id' => $user->getId()
        ], 201);
    }
    #[Route('/profile', name: 'update_profile', methods: ['PATCH'])]
    public function updateProfile(
        Request $request, 
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher, // Pour le mot de passe éventuel
        #[CurrentUser] ?Utilisateur $user
    ): JsonResponse
    {
        if (!$user) return $this->json(['error' => 'Non connecté'], 401);

        $data = json_decode($request->getContent(), true);

        // --- GESTION DU CHANGEMENT DE NOM (Avec contrainte 30 jours) ---
        if (isset($data['nom']) && $data['nom'] !== $user->getNom()) {
            
            $lastUpdate = $user->getDerniereModificationNom();
            $now = new \DateTimeImmutable();

            // Si modifié il y a moins de 30 jours (exemple)
            if ($lastUpdate && $lastUpdate->diff($now)->days < 30) {
                return $this->json([
                    'error' => 'Vous ne pouvez modifier votre nom qu\'une fois tous les 30 jours par mesure de sécurité.'
                ], 403);
            }

            $user->setNom($data['nom']);
            $user->setDerniereModificationNom($now);
        }

        // --- GESTION DE L'EMAIL ---
        if (isset($data['email'])) {
            $user->setEmail($data['email']);
        }

        // --- GESTION DU MOT DE PASSE (Optionnel ici, mais pratique) ---
        if (!empty($data['password'])) {
             $user->setPassword($hasher->hashPassword($user, $data['password']));
        }

        $em->flush();

        return $this->json(['message' => 'Profil mis à jour avec succès.']);
    }

    // 2. CHANGER LE MOT DE PASSE (Et valider le compte)
    #[Route('/change-password', name: 'change_password', methods: ['PATCH'])]
    public function changePassword(
        Request $request, 
        UserPasswordHasherInterface $hasher, 
        EntityManagerInterface $em,
        #[CurrentUser] ?Utilisateur $user
    ): JsonResponse
    {
        if (!$user) return $this->json(['error' => 'Utilisateur non trouvé'], 404);

        $data = json_decode($request->getContent(), true);
        $newPassword = $data['new_password'] ?? null;

        if (!$newPassword || strlen($newPassword) < 6) {
            return $this->json(['error' => 'Le mot de passe doit faire au moins 6 caractères.'], 400);
        }

        // Hashage du nouveau mot de passe
        $user->setPassword($hasher->hashPassword($user, $newPassword));
        
        // CRUCIAL : On désactive le flag "Doit changer son mot de passe"
        $user->setPasswordMustBeChanged(false);

        $em->flush();

        return $this->json(['message' => 'Mot de passe modifié. Compte sécurisé.']);
    }

   #[Route('/{id}/toggle-status', name: 'toggle_status', methods: ['PATCH'])]
    public function toggleStatus(Utilisateur $user, EntityManagerInterface $em): JsonResponse
    {
        $this->checkDroitModification($user); // Vérif sécu (voir fonction privée en bas)

        $nouvelEtat = !$user->isEstActif();
        $user->setEstActif($nouvelEtat);
        $em->flush();

        return $this->json([
            'message' => $nouvelEtat ? 'Utilisateur réactivé.' : 'Utilisateur suspendu.',
            'actif' => $nouvelEtat
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Utilisateur $user, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        // On ne supprime pas physiquement, on archive
        $user->setIsDeleted(true);
        $user->setEstActif(false); // On coupe aussi l'accès immédiatement
        
        // Optionnel : On peut ajouter un suffixe à l'email pour libérer l'adresse
        // $user->setEmail($user->getEmail() . '_deleted_' . uniqid());

        $em->flush();

        return $this->json(['message' => 'Utilisateur supprimé avec succès.']);
    }
    // DANS src/Controller/UserController.php

   #[Route('/{id}/reset-password', name: 'reset_password', methods: ['PATCH'])]
    public function resetPassword(Utilisateur $user, EntityManagerInterface $em, UserPasswordHasherInterface $hasher): JsonResponse
    {
        $this->checkDroitModification($user); // Vérif sécu

        $tempPassword = 'ChangeMoi123!';
        $user->setPassword($hasher->hashPassword($user, $tempPassword));
        $user->setPasswordMustBeChanged(true);
        $user->setEstActif(true); // On réactive si besoin

        $em->flush();

        return $this->json([
            'message' => 'Mot de passe réinitialisé.',
            'temp_password' => $tempPassword
        ]);
    }

    private function checkDroitModification(Utilisateur $cible): void
    {
        /** @var Utilisateur $me */
        $me = $this->getUser();

        if ($this->isGranted('ROLE_MANAGER')) {
            return; // Le manager a tous les droits
        }

        if ($this->isGranted('ROLE_CHEF_SERVICE')) {
            // 1. Vérif Service
            if ($cible->getService() !== $me->getService()) {
                throw $this->createAccessDeniedException("Cet employé n'est pas dans votre service.");
            }
            // 2. Vérif Hiérarchie (Un chef ne touche pas à un autre chef ou manager)
            $rolesCible = $cible->getRoles();
            if (in_array('ROLE_MANAGER', $rolesCible) || in_array('ROLE_CHEF_SERVICE', $rolesCible)) {
                throw $this->createAccessDeniedException("Action non autorisée sur ce supérieur.");
            }
            return;
        }

        throw $this->createAccessDeniedException();
    }
}