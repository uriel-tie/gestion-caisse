<?php

namespace App\Controller;

use App\Entity\Societe;
use App\Repository\SocieteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/societe', name: 'api_societe_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class SocieteController extends AbstractController
{
    /**
     * Récupère la configuration unique de l'entreprise.
     * Accessible à tous les employés connectés (pour l'affichage sur les PDF, etc.)
     */
    #[Route('', name: 'get', methods: ['GET'])]
    public function show(SocieteRepository $repository): JsonResponse
    {
        // On récupère la première ligne de la table
        $societe = $repository->findOneBy([]);

        if (!$societe) {
            // Cas théoriquement impossible grâce aux fixtures, mais on gère le cas vide
            return $this->json(['error' => 'Aucune configuration société trouvée.'], 404);
        }

        return $this->json([
            'id' => $societe->getId(),
            'nom' => $societe->getNom(),
            'forme' => $societe->getForme(),
            'adresse' => $societe->getAdresse(),
            'telephone' => $societe->getTelephone(),
            'registreCommerce' => $societe->getRegistreCommerce(),
            'siegeSocial' => $societe->getSiegeSocial(),
            'capitalSocial' => $societe->getCapitalSocial(),
            'modeValidation' => $societe->getModeValidation(), // LE CHAMP CRITIQUE
        ]);
    }

    /**
     * Met à jour les informations et le MODE DE VALIDATION.
     * Réservé uniquement aux Managers.
     */
    #[Route('', name: 'update', methods: ['POST', 'PATCH'])]
    #[IsGranted('ROLE_MANAGER', message: 'Seul le Manager peut modifier les paramètres de la société.')]
    public function update(
        Request $request, 
        SocieteRepository $repository, 
        EntityManagerInterface $em
    ): JsonResponse
    {
        $societe = $repository->findOneBy([]);

        if (!$societe) {
            // Si jamais la table est vide, on en crée une (Sécurité)
            $societe = new Societe();
            $em->persist($societe);
        }

        $data = json_decode($request->getContent(), true);

        // 1. Mise à jour des infos légales (si fournies)
        if (isset($data['nom'])) $societe->setNom($data['nom']);
        if (isset($data['forme'])) $societe->setForme($data['forme']);
        if (isset($data['adresse'])) $societe->setAdresse($data['adresse']);
        if (isset($data['telephone'])) $societe->setTelephone($data['telephone']);
        if (isset($data['registreCommerce'])) $societe->setRegistreCommerce($data['registreCommerce']);
        if (isset($data['siegeSocial'])) $societe->setSiegeSocial($data['siegeSocial']);
        if (isset($data['capitalSocial'])) $societe->setCapitalSocial($data['capitalSocial']);

        // 2. Mise à jour du MODE DE VALIDATION (Le cœur du sujet)
        if (isset($data['modeValidation'])) {
            $nouveauMode = strtoupper($data['modeValidation']);
            
            // Validation des valeurs autorisées
            $modesValides = [
                Societe::MODE_STANDARD, 
                Societe::MODE_DELEGATION, 
                Societe::MODE_AUTONOMIE
            ];

            if (in_array($nouveauMode, $modesValides)) {
                $societe->setModeValidation($nouveauMode);
            } else {
                return $this->json(['error' => 'Mode de validation invalide.'], 400);
            }
        }

        $em->flush();

        return $this->json([
            'message' => 'Configuration mise à jour avec succès.',
            'modeValidation' => $societe->getModeValidation()
        ]);
    }
}