<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Service\TelegramService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class TelegramController extends AbstractController
{
    #[Route('/api/telegram/webhook', name: 'telegram_webhook', methods: ['POST'])]
    public function handleWebhook(Request $request, EntityManagerInterface $em, TelegramService $telegram): JsonResponse
    {
        $content = json_decode($request->getContent(), true);
        
        // Vérifier si c'est un clic sur un bouton (callback_query)
        if (isset($content['callback_query'])) {
            $callbackData = $content['callback_query']['data']; // ex: "activate_019bc..."
            $chatId = $content['callback_query']['message']['chat']['id'];
            
            // Logique d'activation
            if (str_starts_with($callbackData, 'activate_')) {
                $userId = str_replace('activate_', '', $callbackData);
                $user = $em->getRepository(Utilisateur::class)->find($userId);

                if ($user) {
                    $user->setEstActif(true);
                    
                    // Si le manager est activé, on active aussi sa société
                    if ($user->getSociete()) {
                        $user->getSociete()->setIsActive(true);
                    }
                    
                    $em->flush();

                    // Confirmation à l'admin
                    $telegram->sendMessage("✅ Le compte de " . $user->getNom() . " a été activé avec succès !");
                } else {
                    $telegram->sendMessage("⚠️ Erreur : Utilisateur introuvable.");
                }
            }
        }

        return new JsonResponse(['status' => 'ok']);
    }
}