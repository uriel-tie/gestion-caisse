<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Entity\Societe;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Scheb\TwoFactorBundle\Security\TwoFactor\Provider\Google\GoogleAuthenticatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Repository\SecurityRequestRepository;
use App\Entity\SecurityRequest;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use App\Service\TelegramService;

#[Route('/api', name: 'api_auth_')]
class AuthController extends AbstractController
{
    public function __construct(
        private UtilisateurRepository $userRepo,
        private UserPasswordHasherInterface $hasher,
        private JWTTokenManagerInterface $jwtManager,
        private GoogleAuthenticatorInterface $googleAuth,
        private TelegramService $telegramService
    ) {}

   #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? ''; 
        $password = $data['password'] ?? '';
        $code2FA = $data['code2FA'] ?? '';

        $user = $this->userRepo->findOneBy(['email' => $email]);

        // 1. Vérification existence et activité
        if (!$user) {
            return $this->json(['message' => 'Identifiants invalides'], 401);
        }

        if (!$user->isEstActif()) {
            return $this->json(['message' => 'Votre compte est inactif, veuillez contacter l\'administrateur ou votre manager.'], 403);
        }

        // 2. Vérification du mot de passe permanent uniquement
        if (!$this->hasher->isPasswordValid($user, $password)) {
            return $this->json(['message' => 'Identifiants invalides'], 401);
        }

        // 3. Gestion 2FA (si activée)
        if ($user->is2faEnabled()) {
            if (empty($code2FA)) {
                return $this->json(['requires2fa' => true], 200);
            }
            if (!$this->googleAuth->checkCode($user, $code2FA)) {
                return $this->json(['message' => 'Code de sécurité invalide'], 401);
            }
        }

        // 4. Succès : Génération du Token
        $token = $this->jwtManager->create($user);

        return $this->json([
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'nom' => $user->getNom(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'passwordMustBeChanged' => $user->isPasswordMustBeChanged(),
                'isEmailVerified' => $user->isIsEmailVerified(),
            ]
        ]);
    }

  #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request, EntityManagerInterface $entityManager, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Vérification email...
        $existingUser = $this->userRepo->findOneBy(['email' => $data['email']]);
        if ($existingUser) {
            return $this->json(['error' => 'Cet email est déjà utilisé.'], 400);
        }

        $entityManager->beginTransaction();
        try {
            // 1. Création Société
            $societe = new Societe();
            $societe->setNom($data['nomSociete']);
            // ... (tes setters societe) ...
            $societe->setIsActive(true);
            $societe->setIsDeleted(false);
            $societe->setModeValidation(Societe::MODE_STANDARD);
            $entityManager->persist($societe);

            // 2. Création Manager
            $user = new Utilisateur();
            $user->setEmail($data['email']);
            $user->setNom($data['nom'] ?? '');
            $user->setRoles(['ROLE_MANAGER']);
            $user->setEstActif(false);
            $user->setSociete($societe);

            $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashedPassword);

            $entityManager->persist($user);
            $entityManager->flush();
            $entityManager->commit(); // La transaction BDD est finie et validée.

            // -----------------------------------------------------------
            // CORRECTION 2 : Appel Telegram AVANT le return
            // -----------------------------------------------------------
            try {
                $this->telegramService->sendNewUserAlert($user);
            } catch (\Exception $e) {
                // On log l'erreur mais on ne bloque pas la réponse user
                error_log("Telegram Error: " . $e->getMessage());
            }

            // CORRECTION 3 : Le return se fait APRES tout le travail
            return new JsonResponse([
                'message' => 'Compte créé avec succès. En attente de validation.',
                'userId' => $user->getId()
            ], 201);

        } catch (\Exception $e) {
            $entityManager->rollback();
            return $this->json(['error' => 'Erreur lors de l\'inscription: ' . $e->getMessage()], 500);
        }
    }
}