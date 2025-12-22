<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Scheb\TwoFactorBundle\Security\TwoFactor\Provider\Google\GoogleAuthenticatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api', name: 'api_auth_')]
class AuthController extends AbstractController
{
    public function __construct(
        private UtilisateurRepository $userRepo,
        private UserPasswordHasherInterface $hasher,
        private JWTTokenManagerInterface $jwtManager,
        private GoogleAuthenticatorInterface $googleAuth
    ) {}

    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $email = $data['email'] ?? ''; 
        $password = $data['password'] ?? '';
        $code2fa = $data['code_2fa'] ?? null;

        // 1. Trouver l'utilisateur
        $user = $this->userRepo->findOneBy(['email' => $email]);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur introuvable'], 401);
        }

        // 2. Vérifier le mot de passe
        if (!$this->hasher->isPasswordValid($user, $password)) {
            return $this->json(['message' => 'Mot de passe incorrect'], 401);
        }

        // 3. GESTION 2FA
        if ($user->isGoogleAuthenticatorEnabled()) { // On utilise la méthode de l'interface
            if (!$code2fa) {
                return $this->json([
                    '2fa_required' => true, 
                    'message' => 'Code A2F requis'
                ]);
            }

            if (!$this->googleAuth->checkCode($user, $code2fa)) {
                return $this->json(['message' => 'Code A2F invalide'], 401);
            }
        }

        // 4. Génération du Token
        $token = $this->jwtManager->create($user);

        return $this->json([
            'token' => $token,
            'user' => [
                'email' => $user->getEmail(),
                'nom' => $user->getNom(),
                'roles' => $user->getRoles(),
                'is2faEnabled' => $user->isGoogleAuthenticatorEnabled(),
                'password_must_be_changed' => method_exists($user, 'isPasswordMustBeChanged') ? $user->isPasswordMustBeChanged() : false
            ]
        ]);
    }
}