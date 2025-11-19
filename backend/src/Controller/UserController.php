<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[Route('/api/utilisateurs')]
class UserController extends AbstractController
{
    #[Route('', name: 'app_user_index', methods: ['GET'])]
    public function index(UtilisateurRepository $utilisateurRepository): Response
    {
        $utilisateurs = $utilisateurRepository->findAll();

        // On transforme les objets en tableau simple pour éviter les références circulaires
        // et ne pas renvoyer le mot de passe hashé.
        $data = array_map(function (Utilisateur $user) {
            return [
                'id' => $user->getId(),
                'nom' => $user->getNom(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'estActif' => $user->isEstActif(),
                'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }, $utilisateurs);

        return $this->json($data);
    }

    #[Route('', name: 'app_user_create', methods: ['POST'])]
    public function create(
        Request $request, 
        EntityManagerInterface $entityManager, 
        UserPasswordHasherInterface $passwordHasher
    ): Response
    {
        $data = json_decode($request->getContent(), true);

        // Validation basique (Idéalement, utiliser le composant Validator de Symfony plus tard)
        if (empty($data['email']) || empty($data['password']) || empty($data['nom'])) {
            return $this->json(['error' => 'Champs obligatoires manquants (email, password, nom)'], Response::HTTP_BAD_REQUEST);
        }

        $user = new Utilisateur();
        $user->setEmail($data['email']);
        $user->setNom($data['nom']);
        
        // Gestion des rôles (par défaut ROLE_USER est ajouté dans l'entité)
        if (!empty($data['roles'])) {
            $user->setRoles($data['roles']);
        }

        // Hachage du mot de passe
        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        // Sauvegarde
        try {
            $entityManager->persist($user);
            $entityManager->flush();
        } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException $e) {
            return $this->json(['error' => 'Cet email est déjà utilisé.'], Response::HTTP_CONFLICT);
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'message' => 'Utilisateur créé avec succès'
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'app_user_show', methods: ['GET'])]
    public function show(Utilisateur $utilisateur): Response
    {
        return $this->json([
            'id' => $utilisateur->getId(),
            'nom' => $utilisateur->getNom(),
            'email' => $utilisateur->getEmail(),
            'roles' => $utilisateur->getRoles(),
            'estActif' => $utilisateur->isEstActif(),
        ]);
    }

    #[Route('/{id}', name: 'app_user_update', methods: ['PATCH'])]
    public function update(
        Utilisateur $utilisateur, 
        Request $request, 
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): Response
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['nom'])) {
            $utilisateur->setNom($data['nom']);
        }

        if (isset($data['email'])) {
            $utilisateur->setEmail($data['email']);
        }

        if (isset($data['password'])) {
            $hashedPassword = $passwordHasher->hashPassword($utilisateur, $data['password']);
            $utilisateur->setPassword($hashedPassword);
        }

        if (isset($data['roles'])) {
            $utilisateur->setRoles($data['roles']);
        }
        
        if (isset($data['estActif'])) {
            $utilisateur->setEstActif($data['estActif']);
        }

        $entityManager->flush();

        return $this->json([
            'id' => $utilisateur->getId(),
            'message' => 'Utilisateur mis à jour avec succès'
        ]);
    }
    
    #[Route('/{id}', name: 'app_user_delete', methods: ['DELETE'])]
    public function delete(Utilisateur $utilisateur, EntityManagerInterface $entityManager): Response
    {
        $entityManager->remove($utilisateur);
        $entityManager->flush();

        return $this->json(['message' => 'Utilisateur supprimé'], Response::HTTP_NO_CONTENT);
    }
}