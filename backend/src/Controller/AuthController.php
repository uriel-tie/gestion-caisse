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

        // Vérification si l'email existe déjà
        $existingUser = $this->userRepo->findOneBy(['email' => $data['email']]);
        if ($existingUser) {
            return $this->json(['error' => 'Cet email est déjà utilisé.'], 400);
        }

        $entityManager->beginTransaction();
        try {
            // 1. Création de la Société (Avec les infos complètes)
            $societe = new Societe();
            $societe->setNom($data['nomSociete']);
            
            if (!empty($data['forme'])) $societe->setForme($data['forme']);
            if (!empty($data['adresse'])) $societe->setAdresse($data['adresse']);
            if (!empty($data['telephone'])) $societe->setTelephone($data['telephone']);
            if (!empty($data['capital'])) $societe->setCapitalSocial($data['capital']);
            if (!empty($data['numeroCompteContribuable'])) {
                $societe->setNumeroCompteContribuable($data['numeroCompteContribuable']);
            }
            if (!empty($data['registreCommerce'])) {
                $societe->setRegistreCommerce($data['registreCommerce']);
            }
            
            $societe->setIsActive(true); 
            $societe->setIsDeleted(false);
            $societe->setModeValidation(Societe::MODE_STANDARD); // Valeur par défaut

            $entityManager->persist($societe);

            // 2. Création du Manager (inchangé)
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
            
            $entityManager->commit();

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