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

#[Route('/api/users', name: 'api_users_')]
class UserController extends AbstractController
{
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
}