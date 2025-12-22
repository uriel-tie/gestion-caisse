<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Scheb\TwoFactorBundle\Security\TwoFactor\Provider\Google\GoogleAuthenticatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\RoundBlockSizeMode;

#[Route('/api/2fa', name: 'api_2fa_')]
class TwoFactorController extends AbstractController
{
    public function __construct(
        private GoogleAuthenticatorInterface $googleAuthenticator,
        private EntityManagerInterface $em
    ) {}

    // 1. DÉMARRER L'ACTIVATION (Génère le QR Code)
    #[Route('/setup', name: 'setup', methods: ['GET'])]
    public function setup(): JsonResponse
    {
        $userFromToken = $this->getUser();
        $user = $this->em->getRepository(Utilisateur::class)->find($userFromToken->getId());

        try {
            if (!$user->getGoogleAuthenticatorSecret()) {
                $secret = $this->googleAuthenticator->generateSecret();
                $user->setGoogleAuthenticatorSecret($secret);
                $this->em->flush();
            }

            $qrContent = $this->googleAuthenticator->getQRContent($user);

            // CORRECTION VERSION 5 : On utilise 'new Builder' au lieu de 'Builder::create'
            $result = (new Builder(
                writer: new PngWriter(),
                writerOptions: [],
                validateResult: false,
                data: $qrContent,
                encoding: new Encoding('UTF-8'),
                errorCorrectionLevel: ErrorCorrectionLevel::High,
                size: 300,
                margin: 10,
                roundBlockSizeMode: RoundBlockSizeMode::Margin
            ))->build();

            return $this->json([
                'secret' => $user->getGoogleAuthenticatorSecret(),
                'qr_code' => $result->getDataUri()
            ]);

        } catch (\Throwable $e) {
            return $this->json([
                'error' => 'Erreur QR Code',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // 2. CONFIRMER L'ACTIVATION (L'utilisateur scanne et entre le code)
    #[Route('/enable', name: 'enable', methods: ['POST'])]
    public function enable(Request $request): JsonResponse
    {
        /** @var Utilisateur $userFromToken */
        $userFromToken = $this->getUser();
        
        // CORRECTION : On recharge l'utilisateur depuis l'EntityManager pour être sûr qu'il est "attaché"
        $user = $this->em->getRepository(Utilisateur::class)->find($userFromToken->getId());

        if (!$user) {
            return $this->json(['error' => 'Utilisateur introuvable'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $code = $data['code'] ?? '';

        if ($this->googleAuthenticator->checkCode($user, $code)) {
            $user->setIs2faEnabled(true);
            $this->em->flush(); // Maintenant, Doctrine sait qu'il doit sauvegarder !
            
            return $this->json(['message' => 'Authentification double facteur activée avec succès !']);
        }

        return $this->json(['error' => 'Code invalide'], 400);
    }

    // 3. DÉSACTIVER
    #[Route('/disable', name: 'disable', methods: ['POST'])]
    public function disable(): JsonResponse
    {
        /** @var Utilisateur $userFromToken */
        $userFromToken = $this->getUser();
        
        // CORRECTION ICI AUSSI
        $user = $this->em->getRepository(Utilisateur::class)->find($userFromToken->getId());

        if ($user) {
            $user->setIs2faEnabled(false);
            $user->setGoogleAuthenticatorSecret(null);
            $this->em->flush();
        }

        return $this->json(['message' => 'Double facteur désactivé.']);
    }
}