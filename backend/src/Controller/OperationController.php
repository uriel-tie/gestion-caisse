<?php

namespace App\Controller;

use App\Entity\Operation;
use App\Entity\ModePaiement;
use App\Repository\ModePaiementRepository; 
use App\Repository\OperationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/operations', name: 'api_operations_')]
class OperationController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function index(OperationRepository $operationRepository): JsonResponse
    {
        // ICI : On veut la LISTE des 10 derniers
        $operations = $operationRepository->findLatest(10);

        $data = [];
        foreach ($operations as $op) {
            $data[] = [
                'id' => $op->getId(),
                'type' => $op->getType(),
                'montant' => (float) $op->getMontant(),
                'date' => $op->getDate()->format('d/m/Y H:i'),
                'statut' => $op->getStatut(),
                'mode' => $op->getModePaiement() ? $op->getModePaiement()->getLibelle() : 'N/A',
                'utilisateur' => $op->getUtilisateur() ? $op->getUtilisateur()->getNom() : 'Inconnu',
                'motif' => $op->getMotif() ?? 'Non précisé',
            ];
        }

        return $this->json($data);
    }

    #[Route('/encaissement', name: 'encaissement', methods: ['POST'])]
    public function createEncaissement(
        Request $request, 
        EntityManagerInterface $em, 
        ModePaiementRepository $modeRepo
    ): JsonResponse
    {
        $user = $this->getUser(); // Le caissier connecté
        $data = json_decode($request->getContent(), true);

        // 1. Validation basique
        if (!isset($data['montant']) || $data['montant'] <= 0) {
            return $this->json(['error' => 'Montant invalide'], 400);
        }

        // 2. Récupération du mode de paiement (ex: "Espèces")
        // On suppose que le frontend envoie l'ID ou le libellé. 
        // Pour faire simple ici, on cherche par libellé envoyé par le front
        $mode = $modeRepo->findOneBy(['libelle' => $data['mode'] ?? 'Espèces']);
        
        if (!$mode) {
            return $this->json(['error' => 'Mode de paiement inconnu'], 400);
        }

        // 3. Création de l'opération
        $op = new Operation();
        $op->setType('ENCAISSEMENT');
        $op->setMontant($data['montant']);
        $op->setDate(new \DateTimeImmutable());
        $op->setStatut(Operation::STATUT_VALIDEE); // Un encaissement est toujours valide (l'argent est là)
        $op->setCompteComptable('530'); // Compte Caisse par défaut
        $op->setMotif($data['motif'] ?? 'Encaissement divers');
        $op->setUtilisateur($user);
        $op->setModePaiement($mode);

        $em->persist($op);
        $em->flush();

        return $this->json([
            'message' => 'Encaissement enregistré !',
            'nouveau_solde' => 'Calculé au prochain appel...' 
        ], 201);
    }

    #[Route('/decaissement', name: 'create_decaissement', methods: ['POST'])]
    public function createDecaissement(
        Request $request, 
        EntityManagerInterface $em, 
        ModePaiementRepository $modeRepo,
        OperationRepository $opRepo // Pour vérifier le solde
    ): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);
        $montant = (float) ($data['montant'] ?? 0);

        // 1. Validations
        if ($montant <= 0) return $this->json(['error' => 'Montant invalide'], 400);

        // Vérifier qu'on a assez d'argent (règle de gestion saine)
        // Note: getSoldeActuel() est la méthode qu'on a faite dans le Repo ce matin
        if ($opRepo->getSoldeActuel() < $montant) {
            return $this->json(['error' => 'Fonds insuffisants en caisse'], 400);
        }

        // 2. Mode de paiement
        $libelleMode = $data['mode'] ?? 'Espèces';
        $mode = $modeRepo->findOneBy(['libelle' => $libelleMode]);
        if (!$mode) $mode = $modeRepo->findAll()[0] ?? null;

        // 3. Création
        $op = new Operation();
        $op->setType('DECAISSEMENT');
        $op->setMontant((string)$montant);
        $op->setDate(new \DateTimeImmutable());
        $op->setCompteComptable('606'); // Compte générique "Achats"
        $op->setUtilisateur($user);
        $op->setModePaiement($mode);
        $op->setMotif($data['motif'] ?? 'Décaissement divers');

        // --- LOGIQUE DE VALIDATION CONDITIONNELLE ---
        
        // Seuil : 50€ pour un caissier standard
        $seuilAuto = 50.0; 
        $isManager = in_array('ROLE_MANAGER', $user->getRoles());

        // Si c'est le Manager OU si c'est une petite somme -> On valide tout de suite
        if ($isManager || $montant <= $seuilAuto) {
            $op->setStatut(Operation::STATUT_VALIDEE);
            $msg = "Décaissement validé.";
        } else {
            // Sinon -> On bloque
            $op->setStatut(Operation::STATUT_EN_ATTENTE);
            $msg = "Montant élevé : En attente de validation Manager.";
        }

        $em->persist($op);
        $em->flush();

        return $this->json([
            'message' => $msg,
            'statut' => $op->getStatut(),
            'id' => $op->getId()
        ], 201);
    }
}
