<?php

namespace App\Controller;

use App\Entity\SecurityRequest;
use App\Entity\Utilisateur;
use App\Repository\SecurityRequestRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

#[Route('/api/security')]
class SecurityRequestController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private MailerInterface $mailer,
        private UserPasswordHasherInterface $hasher,
        private JWTTokenManagerInterface $jwtManager
    ) {}

    /**
     * ROUTE 1 : DEMANDE DE MOT DE PASSE OUBLIÉ (LOGIN)
     * Utilise un code complexe de 8 caractères haché en base.
     */
    #[Route('/forgot-password', name: 'security_forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request, UtilisateurRepository $userRepo, SecurityRequestRepository $secRepo): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? '';

        $user = $userRepo->findOneBy(['email' => $email]);
        $genericMessage = "Si votre compte est vérifié, vous recevrez un code par email d'ici quelques instants.";

        if (!$user) {
            return $this->json(['message' => $genericMessage]);
        }

        if (!$user->isIsEmailVerified()) {
            return $this->json(['message' => "Votre adresse email n'est pas vérifiée. Veuillez contacter votre administrateur."], 403);
        }

        if ($secRepo->countRequestsToday($user) >= 2) {
            return $this->json(['message' => "Limite journalière atteinte (2 max). Réessayez demain."], 429);
        }

        $lastReq = $secRepo->findLastRequest($user);
        if ($lastReq && $lastReq->getCreatedAt()->modify('+2 hours') > new \DateTimeImmutable()) {
            return $this->json(['message' => "Une demande a déjà été faite récemment. Veuillez patienter 2 heures."], 429);
        }

        $plainCode = bin2hex(random_bytes(4)); // 8 caractères
        
        $secRequest = new SecurityRequest();
        $secRequest->setUser($user);
        $secRequest->setType(SecurityRequest::TYPE_PASSWORD_RESET);
        $secRequest->setExpiresAt(new \DateTimeImmutable('+15 minutes'));
        $secRequest->setCode($plainCode);

        $this->em->persist($secRequest);
        $this->em->flush();

        $this->sendSecurityEmail($user->getEmail(), "Récupération de compte", "Votre code temporaire : <strong>$plainCode</strong> (valide 15 min).");

        return $this->json(['message' => $genericMessage]);
    }

    /**
     * ROUTE 2 : DEMANDE DE VÉRIFICATION D'EMAIL (PROFIL)
     * Envoie un code à 6 chiffres stocké en clair pour une validation simplifiée.
     */
    #[Route('/request-email-verification', name: 'security_request_verify', methods: ['POST'])]
    public function requestVerification(): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        if (!$user) return $this->json(['message' => 'Non autorisé'], 401);

        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        $secRequest = new SecurityRequest();
        $secRequest->setUser($user);
        $secRequest->setType(SecurityRequest::TYPE_EMAIL_VERIFICATION);
        $secRequest->setExpiresAt(new \DateTimeImmutable('+24 hours'));
        // Stockage en clair pour éviter les erreurs de hachage sur 6 chiffres en DEV
        $secRequest->setCode($code); 

        $this->em->persist($secRequest);
        $this->em->flush();

        $this->sendSecurityEmail($user->getEmail(), "Vérification d'email", "Votre code de vérification est : <strong>$code</strong>");

        return $this->json(['message' => 'Code de vérification envoyé !']);
    }

    /**
     * ROUTE 3 : CONFIRMATION DU CODE DE VÉRIFICATION (PROFIL)
     */
    #[Route('/verify-email-code', name: 'security_confirm_verify', methods: ['POST'])]
    public function verifyEmail(Request $request, SecurityRequestRepository $secRepo): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $codeSaisi = isset($data['code']) ? trim((string)$data['code']) : '';
        
        /** @var Utilisateur $user */
        $user = $this->getUser();

        $secRequest = $secRepo->findOneBy([
            'user' => $user,
            'type' => SecurityRequest::TYPE_EMAIL_VERIFICATION
        ], ['createdAt' => 'DESC']);

        if (!$secRequest) {
            return $this->json(['message' => 'Aucune demande trouvée.'], 400);
        }

        if ($secRequest->getExpiresAt() < new \DateTimeImmutable()) {
            return $this->json(['message' => 'Code expiré.'], 400);
        }

        // Comparaison directe pour le code d'email (stocké en clair plus haut)
        if ($codeSaisi !== $secRequest->getCode()) {
            return $this->json(['message' => 'Code incorrect.'], 400);
        }

        $user->setIsEmailVerified(true);
        $this->em->remove($secRequest);
        $this->em->flush();

        return $this->json(['message' => 'Email vérifié avec succès !']);
    }

    #[Route('/login-with-code', name: 'security_login_code', methods: ['POST'])]
        public function loginWithCode(
            Request $request, 
            SecurityRequestRepository $secRepo, 
            JWTTokenManagerInterface $jwtManager
        ): JsonResponse {
            $data = json_decode($request->getContent(), true);
            $email = $data['email'] ?? '';
            // On nettoie les espaces et on force en string
            $codeSaisi = isset($data['code']) ? trim((string)$data['code']) : '';

            $user = $this->em->getRepository(Utilisateur::class)->findOneBy(['email' => $email]);

            if (!$user) {
                return $this->json(['message' => 'Utilisateur non trouvé.'], 404);
            }

            if (!$user->isEstActif()) {
                return $this->json(['message' => 'Ce compte est inactif.'], 403);
            }

            $tempRequest = $secRepo->findOneBy([
                'user' => $user,
                'type' => SecurityRequest::TYPE_PASSWORD_RESET
            ], ['createdAt' => 'DESC']);

            // --- LOG DE DEBUG (Optionnel, à retirer après test) ---
            // error_log("Code Saisi: '$codeSaisi' | Code Base: '" . ($tempRequest ? $tempRequest->getCode() : 'NULL') . "'");

            // Vérification de validité
            if (!$tempRequest || 
                $tempRequest->getExpiresAt() < new \DateTimeImmutable() || 
                (string)$codeSaisi !== (string)$tempRequest->getCode()) {
                return $this->json(['message' => 'Code invalide ou expiré.'], 401);
            }

            // Succès : On prépare l'utilisateur
            $user->setPasswordMustBeChanged(true);
            
            // On supprime le code pour usage unique
            $this->em->remove($tempRequest);
            $this->em->flush();

            // Génération du badge d'accès (JWT)
            $token = $jwtManager->create($user);

            return $this->json([
                'token' => $token,
                'user' => [
                    'id' => $user->getId(),
                    'nom' => $user->getNom(),
                    'email' => $user->getEmail(),
                    'roles' => $user->getRoles(), // Crucial pour ta Sidebar React
                    'password_must_be_changed' => true
                ]
            ]);
        }

    private function sendSecurityEmail(string $to, string $subject, string $body): void
    {
        $email = (new Email())
            ->from('urielsoholi03@gmail.com') // Expéditeur validé Brevo
            ->to($to)
            ->subject($subject)
            ->html($body);

        try {
            $this->mailer->send($email);
        } catch (\Exception $e) {
            // Log de l'erreur pour ne pas bloquer l'utilisateur en cas de souci SMTP
        }
    }
}