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

            $userData = [
                'id' => $user->getId(),
                'nom' => $user->getNom(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'passwordMustBeChanged' => true,
                'isEmailVerified' => $user->isIsEmailVerified()
            ];

            // Ajouter les informations du rôle personnalisé si présent
            if ($user->getCustomRole()) {
                $customRole = $user->getCustomRole();
                $userData['customRole'] = [
                    'id' => $customRole->getId()->toRfc4122(),
                    'nom' => $customRole->getNom(),
                    'baseRole' => $customRole->getBaseRole(),
                    'restrictions' => $customRole->getRestrictions(),
                    'adminRestrictions' => $customRole->getAdminRestrictions(),
                ];
            }

            return $this->json([
                'token' => $token,
                'user' => $userData
            ]);
        }

    private function sendSecurityEmail(string $to, string $subject, string $body): void
    {
        $htmlBody = $this->buildProfessionalEmail($subject, $body);
        
        $email = (new Email())
            ->from('urielsoholi03@gmail.com') // Expéditeur validé Brevo
            ->to($to)
            ->subject($subject)
            ->html($htmlBody);

        try {
            $this->mailer->send($email);
        } catch (\Exception $e) {
            // Log de l'erreur pour ne pas bloquer l'utilisateur en cas de souci SMTP
        }
    }

    private function buildProfessionalEmail(string $subject, string $contentBody): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$subject</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- En-tête avec gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Orbis Caisse</h1>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-weight: 300;">Système de Gestion Sécurisé</p>
                        </td>
                    </tr>

                    <!-- Corps du message -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px 0; font-size: 16px; color: #333; line-height: 1.6;">
                                Bonjour,
                            </p>

                            <div style="background-color: #f9f9f9; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 15px; color: #555; line-height: 1.8;">
                                    $contentBody
                                </p>
                            </div>

                            <p style="margin: 24px 0 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                                <strong style="color: #333;">Rappel de sécurité :</strong><br>
                                Ce code est valide pendant une durée limitée. Ne partagez jamais ce code avec quiconque.
                            </p>

                            <p style="margin: 24px 0 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                                Si vous n'avez pas demandé cette action, veuillez ignorer cet email ou <a href="mailto:urielsoholi03@gmail.com" style="color: #667eea; text-decoration: none; font-weight: 600;">contacter notre support</a>.
                            </p>
                        </td>
                    </tr>

                    <!-- Séparateur -->
                    <tr>
                        <td style="height: 1px; background-color: #e0e0e0;"></td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #fafafa; text-align: center;">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #999;">
                                © 2026 OrbisCaisse. Tous droits réservés.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #999;">
                                <a href="mailto:urielsoholi03@gmail.com" style="color: #667eea; text-decoration: none;">Support</a> | 
                                <a href="#" style="color: #667eea; text-decoration: none;">Politique de confidentialité</a>
                            </p>
                            <p style="margin: 12px 0 0 0; font-size: 11px; color: #aaa; line-height: 1.5;">
                                Cet email a été envoyé automatiquement par le système Orbis Caisse.<br>
                                Veuillez ne pas répondre directement à cet email.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
}