<?php

namespace App\Controller;

use App\Entity\CompteComptable;
use App\Repository\CompteComptableRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/comptes', name: 'api_comptes_')]
class CompteComptableController extends AbstractController
{
    // 1. LISTER (Pour Admin et Caissier)
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(CompteComptableRepository $repo): JsonResponse
    {
        // Tout le monde peut voir la liste (pour les menus déroulants)
        $comptes = $repo->findAllSorted();
        
        $data = [];
        foreach ($comptes as $c) {
            $data[] = [
                'id' => $c->getId(),
                'numero' => $c->getNumero(),
                'libelle' => $c->getLibelle(),
                'type' => $c->getType(),
                'label_complet' => $c->__toString() // "606 - Achats"
            ];
        }
        return $this->json($data);
    }

    // 2. CRÉER (Pour Admin uniquement)
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $user = $this->getUser();
        if (!$user) {         
            return $this->json(['error' => 'Utilisateur non authentifié'], 401);
        }   
    

        $data = json_decode($request->getContent(), true);

        if (empty($data['numero']) || empty($data['libelle'])) {
            return $this->json(['error' => 'Numéro et Libellé obligatoires'], 400);
        }

        $compte = new CompteComptable();
        $compte->setNumero($data['numero']);
        $compte->setLibelle($data['libelle']);
        $compte->setSociete($user->getSociete());
        $compte->setType($data['type'] ?? 'CHARGE'); // Par défaut une charge

        $em->persist($compte);
        $em->flush();

        return $this->json(['message' => 'Compte créé', 'id' => $compte->getId()], 201);
    }
    
    // 3. SUPPRIMER (Pour Admin)
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(CompteComptable $compte, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');
        
        $em->remove($compte);
        $em->flush();
        
        return $this->json(['message' => 'Compte supprimé']);
    }
    // 4. MODIFIER (Pour Admin)
    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(Request $request, CompteComptable $compte, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');

        $data = json_decode($request->getContent(), true);

        // Mise à jour partielle : on ne change que ce qui est envoyé
        if (isset($data['numero'])) {
            $compte->setNumero($data['numero']);
        }
        
        if (isset($data['libelle'])) {
            $compte->setLibelle($data['libelle']);
        }

        if (isset($data['type'])) {
            $compte->setType($data['type']);
        }

        $em->flush();

        return $this->json([
            'message' => 'Compte modifié avec succès',
            'id' => $compte->getId()
        ]);
    }

    /**
     * Récupère les comptes "Nature" (3 chiffres seulement)
     * Ex: 601, 606, 611, etc.
     */
    #[Route('/natures', name: 'list_natures', methods: ['GET'])]
    public function listNatures(CompteComptableRepository $repo): JsonResponse
    {
        $allComptes = $repo->findAllSorted();
        $natures = [];

        foreach ($allComptes as $c) {
            // Une Nature a exactement 3 chiffres
            if (strlen($c->getNumero()) === 3) {
                $natures[] = [
                    'id' => $c->getId(),
                    'numero' => $c->getNumero(),
                    'libelle' => $c->getLibelle(),
                    'label_complet' => $c->__toString()
                ];
            }
        }

        return $this->json($natures);
    }

    /**
     * Récupère les comptes "Type" (4 chiffres ou plus)
     * Optionnellement filtrés par Nature
     * Ex: GET /api/comptes/types?nature=606
     */
    #[Route('/types', name: 'list_types', methods: ['GET'])]
    public function listTypes(Request $request, CompteComptableRepository $repo): JsonResponse
    {
        $nature = $request->query->get('nature');
        $allComptes = $repo->findAllSorted();
        $types = [];

        foreach ($allComptes as $c) {
            // Un Type a 4 chiffres ou plus
            if (strlen($c->getNumero()) >= 4) {
                // Si une Nature est spécifiée, on filtre par rapport à elle
                if ($nature && strpos($c->getNumero(), $nature) !== 0) {
                    continue;
                }

                $types[] = [
                    'id' => $c->getId(),
                    'numero' => $c->getNumero(),
                    'libelle' => $c->getLibelle(),
                    'nature' => substr($c->getNumero(), 0, 3), // Les 3 premiers chiffres
                    'label_complet' => $c->__toString()
                ];
            }
        }

        return $this->json($types);
    }
}