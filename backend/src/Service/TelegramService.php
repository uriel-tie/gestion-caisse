<?php

namespace App\Service;

use App\Entity\Utilisateur;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Psr\Log\LoggerInterface;

class TelegramService
{
    public function __construct(
        private HttpClientInterface $client,
        private LoggerInterface $logger,
        #[Autowire(env: 'TELEGRAM_BOT_TOKEN')] private string $botToken,
        #[Autowire(env: 'TELEGRAM_ADMIN_ID')] private string $adminChatId
    ) {}

   public function sendNewUserAlert(Utilisateur $user): void
    {
        // MOUCHARD 1 : On vérifie si on rentre bien dans la fonction
        $this->logger->info("🚀 TELEGRAM : Début de la tentative d'envoi...");
        
        // On vérifie si les clés sont là (on cache une partie pour la sécu)
        $this->logger->info("🔑 Token: " . substr($this->botToken, 0, 5) . "...");
        $this->logger->info("🆔 ChatID: " . $this->adminChatId);

        $message = sprintf(
            "🔔 *Nouvelle Inscription !*\n\n👤 *Nom:* %s\n📧 *Email:* %s\n📅 *Date:* %s",
            $user->getNom(),
            $user->getEmail(),
            $user->getCreatedAt()->format('d/m/Y H:i')
        );

        $keyboard = [
            'inline_keyboard' => [
                [
                    ['text' => '✅ Activer', 'callback_data' => 'activate_' . $user->getId()],
                    ['text' => '❌ Rejeter', 'callback_data' => 'delete_' . $user->getId()]
                ]
            ]
        ];

        try {
            $response = $this->client->request('POST', "https://api.telegram.org/bot{$this->botToken}/sendMessage", [
                'json' => [
                    'chat_id' => $this->adminChatId,
                    'text' => $message,
                    'parse_mode' => 'Markdown',
                    'reply_markup' => $keyboard
                ],
                'verify_peer' => false, 
                'verify_host' => false,
            ]);

            // On force la lecture de la réponse pour voir si Telegram a dit "OK" ou "Non"
            $content = $response->getContent(false);
            $statusCode = $response->getStatusCode();

            // MOUCHARD 2 : Le résultat
            $this->logger->info("✅ TELEGRAM RÉPONSE (Code $statusCode): " . $content);

        } catch (\Exception $e) {
            // MOUCHARD 3 : L'erreur
            $this->logger->error("❌ TELEGRAM CRASH : " . $e->getMessage());
        }
    }

    public function sendMessage(string $text): void
    {
        $this->client->request('POST', "https://api.telegram.org/bot{$this->botToken}/sendMessage", [
            'json' => [
                'chat_id' => $this->adminChatId,
                'text' => $text,
            ]
        ]);
    }
}