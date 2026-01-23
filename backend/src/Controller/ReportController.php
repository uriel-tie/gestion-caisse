<?php

namespace App\Controller;

use App\Repository\OperationRepository;
use App\Repository\CaisseRepository; 
use Dompdf\Dompdf;
use Dompdf\Options;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request; 
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/reports', name: 'api_reports_')]
class ReportController extends AbstractController
{
    #[Route('/journal', name: 'journal_pdf', methods: ['GET'])]
    public function generateJournal(
        OperationRepository $opRepo,
        CaisseRepository $caisseRepo, // Injection du repo Caisse
        Request $request              // Injection de la Request pour lire les params URL
    ): Response
    {
        $user = $this->getUser();

        // 1. Récupération des filtres depuis l'URL (envoyés par le frontend)
        $filters = [
            'type' => $request->query->get('type'),
            'date_debut' => $request->query->get('date_debut'),
            'date_fin' => $request->query->get('date_fin'),
            'mode' => $request->query->get('mode'),
            'compte' => $request->query->get('compte'),
            'caisse' => $request->query->get('caisse'),
        ];

        // 2. Sécurité : Restriction par caisse (comme dans OperationController)
        $caisseRestrict = null;
        if (!$this->isGranted('ROLE_MANAGER')) {
            $caisseRestrict = $caisseRepo->findOneBy(['employeAssigne' => $user]);
            // Si l'utilisateur n'est pas manager et n'a pas de caisse, on peut bloquer ou afficher vide
            if (!$caisseRestrict && !$this->isGranted('ROLE_ADMIN')) {
                 // Optionnel : return new Response("Accès refusé", 403);
            }
        }

        // Si un filtre caisse est fourni (pour les managers), récupérer l'entité Caisse
        $caisseFilter = null;
        if (!empty($filters['caisse']) && $this->isGranted('ROLE_MANAGER')) {
            $caisseFilter = $caisseRepo->find($filters['caisse']);
        }

        // 3. Récupération des données avec filtres
        // On demande la page 1 avec une limite très haute (ex: 2000) pour avoir "tout" le résultat filtré dans le PDF
        $paginator = $opRepo->findWithFilters($filters, 1, 2000, $caisseRestrict, $caisseFilter);
        
        // On extrait les résultats du Paginator pour les passer à la vue
        $operations = $paginator->getIterator();

        // 4. Calcul des totaux sur le jeu de données filtré
        $totalEncaissements = 0;
        $totalDecaissements = 0;

        foreach ($operations as $op) {
            // On ne compte que les opérations validées
            if ($op->getStatut() === 'VALIDEE') {
                if ($op->getType() === 'ENCAISSEMENT') {
                    $totalEncaissements += (float) $op->getMontant();
                } elseif ($op->getType() === 'DECAISSEMENT') {
                    $totalDecaissements += (float) $op->getMontant();
                }
            }
        }

        $soldePeriode = $totalEncaissements - $totalDecaissements;

        // 5. Configuration de Dompdf
        $pdfOptions = new Options();
        $pdfOptions->set('defaultFont', 'Arial');
        $pdfOptions->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($pdfOptions);

        // 6. Génération du HTML
        $html = $this->renderView('reports/journal.html.twig', [
            'operations' => $operations,
            'date_generation' => new \DateTime(),
            'total_enc' => $totalEncaissements,
            'total_dec' => $totalDecaissements,
            'solde' => $soldePeriode,
            'user' => $this->getUser(),
            'filters' => $filters // Utile si tu veux afficher les critères de filtre dans l'en-tête du PDF
        ]);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return new Response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="journal_caisse.pdf"',
        ]);
    }

    #[Route('/journal/excel', name: 'journal_excel', methods: ['GET'])]
    public function exportJournalExcel(
        OperationRepository $opRepo,
        CaisseRepository $caisseRepo,
        Request $request
    ): StreamedResponse
    {
        $user = $this->getUser();

        // 1. Récupération des filtres
        $filters = [
            'type' => $request->query->get('type'),
            'date_debut' => $request->query->get('date_debut'),
            'date_fin' => $request->query->get('date_fin'),
            'mode' => $request->query->get('mode'),
            'compte' => $request->query->get('compte'),
            'caisse' => $request->query->get('caisse'),
        ];

        // 2. Sécurité
        $caisseRestrict = null;
        if (!$this->isGranted('ROLE_MANAGER')) {
            $caisseRestrict = $caisseRepo->findOneBy(['employeAssigne' => $user]);
            if (!$caisseRestrict && !$this->isGranted('ROLE_ADMIN')) {
                 // return ...
            }
        }

        // Si un filtre caisse est fourni (pour les managers), récupérer l'entité Caisse
        $caisseFilter = null;
        if (!empty($filters['caisse']) && $this->isGranted('ROLE_MANAGER')) {
            $caisseFilter = $caisseRepo->find($filters['caisse']);
        }

        // 3. Récupération des données
        $paginator = $opRepo->findWithFilters($filters, 1, 5000, $caisseRestrict, $caisseFilter);
        $operations = $paginator->getIterator();

        // 4. Création du fichier Excel
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Journal de Caisse');

        // --- CORRECTION ICI : Ajout de la colonne "Compte" dans les en-têtes ---
        $headers = [
            'Date', 
            'N° Pièce', 
            'Compte', 
            'Type', 
            'Libellé / Motif', 
            'Tiers / Caissier', 
            'Mode', 
            'Débit (Entrée)', 
            'Crédit (Sortie)'
        ];
        $sheet->fromArray($headers, null, 'A1');
        
        // --- CORRECTION ICI : Extension du style jusqu'à I1 ---
        $headerStyle = [
            'font' => ['bold' => true],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFE0E0E0']],
        ];
        $sheet->getStyle('A1:I1')->applyFromArray($headerStyle); // De A à I (9 colonnes)

        // Remplissage des données
        $row = 2;
        foreach ($operations as $op) {
            $date = $op->getDate()->format('d/m/Y H:i');
            $type = $op->getType();
            $montant = (float)$op->getMontant();
            
            $debit = ($type === 'ENCAISSEMENT') ? $montant : '';
            $credit = ($type === 'DECAISSEMENT') ? $montant : '';

            $sheet->setCellValue('A' . $row, $date);
            $sheet->setCellValue('B' . $row, substr($op->getId(), 0, 8));
            $sheet->setCellValue('C' . $row, $op->getCompteComptable() ?? ''); // Colonne Compte
            $sheet->setCellValue('D' . $row, $type);
            $sheet->setCellValue('E' . $row, $op->getMotif());
            $sheet->setCellValue('F' . $row, $op->getUtilisateur() ? $op->getUtilisateur()->getNom() : 'Inconnu');
            $sheet->setCellValue('G' . $row, $op->getModePaiement() ? $op->getModePaiement()->getLibelle() : '');
            $sheet->setCellValue('H' . $row, $debit);
            $sheet->setCellValue('I' . $row, $credit);

            // Coloration rouge pour les annulations
            if ($op->getStatut() === 'ANNULEE') {
                $sheet->getStyle('A'.$row.':I'.$row)->getFont()->getColor()->setARGB('FFFF0000'); // De A à I
                $sheet->setCellValue('E' . $row, $op->getMotif() . ' (ANNULÉE)'); // Colonne E = Motif
            }

            $row++;
        }

        // Ajustement automatique des colonnes
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // 5. Envoi du fichier
        $writer = new Xlsx($spreadsheet);
        
        $response = new StreamedResponse(function() use ($writer) {
            $writer->save('php://output');
        });

        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment;filename="journal_export.xlsx"');
        $response->headers->set('Cache-Control', 'max-age=0');

        return $response;
    }
}