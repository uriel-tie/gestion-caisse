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
        // TODO: Filtrer selon le rôle (un Chef ne voit que son service)
        // Pour l'instant, le Manager voit tout
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $users = $repo->findAll();
        $data = [];
        foreach ($users as $u) {
            $data[] = [
                'id' => $u->getId(),
                'nom' => $u->getNom(),
                'email' => $u->getEmail(),
                'role' => $u->getRoles()[0], // On prend le rôle principal
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
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $data = json_decode($request->getContent(), true);

        // 1. Validations basiques
        if (empty($data['email']) || empty($data['nom']) || empty($data['role'])) {
            return $this->json(['error' => 'Données incomplètes'], 400);
        }

        // 2. Création
        $user = new Utilisateur();
        $user->setEmail($data['email']);
        $user->setNom($data['nom']);
        $user->setRoles([$data['role']]); // ex: ["ROLE_CAISSIER"]

        // 3. Assignation Service (si envoyé)
        if (!empty($data['service_id'])) {
            $service = $serviceRepo->find($data['service_id']);
            if ($service) $user->setService($service);
        }

        // 4. GÉNÉRATION INTELLIGENTE DU MOT DE PASSE
        // Pattern : Partie gauche de l'email + "@2025!"
        // Ex: thomas.guichet@cashflow.com -> Thomas.guichet@2025!
        $emailParts = explode('@', $data['email']);
        $prefix = ucfirst($emailParts[0]); // Met la 1ère lettre en majuscule
        $tempPassword = $prefix . '@2025!';

        // Hashage
        $hashedPassword = $hasher->hashPassword($user, $tempPassword);
        $user->setPassword($hashedPassword);

        // 5. Sécurité : On force le changement au premier login
        $user->setPasswordMustBeChanged(true);
        $user->setEstActif(true);

        $em->persist($user);
        $em->flush();

        return $this->json([
            'message' => 'Utilisateur créé avec succès.',
            'temp_password' => $tempPassword, // On le renvoie juste pour info au Manager (à noter)
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
}