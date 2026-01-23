<?php

namespace App\Controller;

use App\Entity\CompteComptable;
use App\Entity\CompteLie;
use App\Repository\CompteComptableRepository;
use App\Repository\CompteLieRepository;
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
                'type' => $c->getType(), // Compatibilité
                'typeCompte' => $c->getTypeCompte(),
                'label_complet' => $c->__toString() // "606 - Achats"
            ];
        }
        return $this->json($data);
    }

    // 2. CRÉER (Pour Admin uniquement)
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, CompteComptableRepository $compteRepo): JsonResponse
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

        if (empty($data['typeCompte']) || !in_array($data['typeCompte'], [CompteComptable::TYPECOMPTE_NATURE, CompteComptable::TYPECOMPTE_TYPE], true)) {
            return $this->json(['error' => 'typeCompte doit être "nature" ou "type"'], 400);
        }

        $compte = new CompteComptable();
        $compte->setNumero($data['numero']);
        $compte->setLibelle($data['libelle']);
        $compte->setSociete($user->getSociete());
        $compte->setTypeCompte($data['typeCompte']);

        $em->persist($compte);
        $em->flush();

        // Si c'est un compte "type", créer la liaison avec la nature parente
        if ($data['typeCompte'] === CompteComptable::TYPECOMPTE_TYPE && !empty($data['nature_id'])) {
            $nature = $compteRepo->find($data['nature_id']);
            if (!$nature) {
                return $this->json(['error' => 'Nature parente introuvable'], 400);
            }
            if ($nature->getTypeCompte() !== CompteComptable::TYPECOMPTE_NATURE) {
                return $this->json(['error' => 'Le compte parent doit être de type "nature"'], 400);
            }

            $compteLie = new CompteLie();
            $compteLie->setCompteNature($nature);
            $compteLie->setCompteType($compte);
            $em->persist($compteLie);
            $em->flush();
        }

        return $this->json(['message' => 'Compte créé', 'id' => $compte->getId()], 201);
    }
    
    // 3. SUPPRIMER (Pour Admin)
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(CompteComptable $compte, EntityManagerInterface $em, CompteLieRepository $compteLieRepo): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_MANAGER');
        
        // Supprimer les liaisons associées (cascade)
        if ($compte->getTypeCompte() === CompteComptable::TYPECOMPTE_TYPE) {
            $liaison = $compteLieRepo->findNatureByType($compte);
            if ($liaison) {
                $em->remove($liaison);
            }
        } else {
            // Si c'est une nature, supprimer toutes les liaisons avec ses types
            $liaisons = $compteLieRepo->findTypesByNature($compte);
            foreach ($liaisons as $liaison) {
                $em->remove($liaison);
            }
        }
        
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
            $compte->setType($data['type']); // Compatibilité
        }

        if (isset($data['typeCompte'])) {
            $compte->setTypeCompte($data['typeCompte']);
        }

        $em->flush();

        return $this->json([
            'message' => 'Compte modifié avec succès',
            'id' => $compte->getId()
        ]);
    }

    /**
     * Récupère les comptes "Nature" (typeCompte = 'nature')
     */
    #[Route('/natures', name: 'list_natures', methods: ['GET'])]
    public function listNatures(CompteComptableRepository $repo): JsonResponse
    {
        $natures = $repo->findBy(['typeCompte' => CompteComptable::TYPECOMPTE_NATURE], ['numero' => 'ASC']);
        
        $data = [];
        foreach ($natures as $c) {
            $data[] = [
                'id' => $c->getId()->toRfc4122(),
                'numero' => $c->getNumero(),
                'libelle' => $c->getLibelle(),
                'label_complet' => $c->__toString()
            ];
        }

        return $this->json($data);
    }

    /**
     * Récupère les comptes "Type" filtrés par Nature via CompteLie
     * Ex: GET /api/comptes/types?nature_id=<uuid>
     */
    #[Route('/types', name: 'list_types', methods: ['GET'])]
    public function listTypes(Request $request, CompteComptableRepository $compteRepo, CompteLieRepository $compteLieRepo): JsonResponse
    {
        $natureId = $request->query->get('nature_id');
        
        if (!$natureId) {
            // Si aucune nature spécifiée, retourner tous les types
            $types = $compteRepo->findBy(['typeCompte' => CompteComptable::TYPECOMPTE_TYPE], ['numero' => 'ASC']);
            $data = [];
            foreach ($types as $c) {
                $liaison = $compteLieRepo->findNatureByType($c);
                $data[] = [
                    'id' => $c->getId()->toRfc4122(),
                    'numero' => $c->getNumero(),
                    'libelle' => $c->getLibelle(),
                    'nature_id' => $liaison ? $liaison->getCompteNature()->getId()->toRfc4122() : null,
                    'label_complet' => $c->__toString()
                ];
            }
            return $this->json($data);
        }

        // Filtrer par nature via CompteLie
        $nature = $compteRepo->find($natureId);
        if (!$nature) {
            \error_log("Nature introuvable pour ID: " . $natureId);
            return $this->json(['error' => 'Nature introuvable'], 400);
        }
        
        if ($nature->getTypeCompte() !== CompteComptable::TYPECOMPTE_NATURE) {
            \error_log("Le compte trouvé n'est pas une nature. ID: " . $natureId . ", typeCompte: " . $nature->getTypeCompte());
            return $this->json(['error' => 'Le compte trouvé n\'est pas une nature'], 400);
        }

        \error_log("Recherche des types pour nature ID: " . $nature->getId()->toRfc4122() . ", numero: " . $nature->getNumero());
        $liaisons = $compteLieRepo->findTypesByNature($nature);
        \error_log("Nombre de liaisons trouvées: " . count($liaisons));
        
        $data = [];
        foreach ($liaisons as $liaison) {
            $type = $liaison->getCompteType();
            if ($type) {
                $data[] = [
                    'id' => $type->getId()->toRfc4122(),
                    'numero' => $type->getNumero(),
                    'libelle' => $type->getLibelle(),
                    'nature_id' => $nature->getId()->toRfc4122(),
                    'label_complet' => $type->__toString()
                ];
            }
        }

        \error_log("Types retournés: " . count($data));
        return $this->json($data);
    }

    /**
     * Récupère la nature parente d'un compte type
     * Ex: GET /api/comptes/{id}/nature
     */
    #[Route('/{id}/nature', name: 'get_nature', methods: ['GET'])]
    public function getNature(CompteComptable $compte, CompteLieRepository $compteLieRepo): JsonResponse
    {
        if ($compte->getTypeCompte() !== CompteComptable::TYPECOMPTE_TYPE) {
            return $this->json(['error' => 'Ce compte n\'est pas de type "type"'], 400);
        }

        $liaison = $compteLieRepo->findNatureByType($compte);
        if (!$liaison) {
            return $this->json(['error' => 'Aucune nature parente trouvée'], 404);
        }

        $nature = $liaison->getCompteNature();
        return $this->json([
            'id' => $nature->getId()->toRfc4122(),
            'numero' => $nature->getNumero(),
            'libelle' => $nature->getLibelle(),
            'label_complet' => $nature->__toString()
        ]);
    }
}