import React from 'react';
import { X, Printer, FileText } from 'lucide-react';

interface ViewerProps {
    demande: any;
    onClose: () => void;
}

export const RequestBonViewer: React.FC<ViewerProps> = ({ demande, onClose }) => {
    if (!demande) return null;

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'BROUILLON': return 'BROUILLON';
            case 'ATTENTE_CHEF': return 'ATTENTE CHEF';
            case 'ATTENTE_MANAGER': return 'ATTENTE MANAGER';
            case 'VALIDEE_A_PAYER': return 'BON À PAYER';
            case 'PAYEE': return 'PAYÉE';
            case 'REFUSEE': return 'REFUSÉE';
            default: return status?.replace(/_/g, ' ');
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'VALIDEE_A_PAYER': return 'bg-green-100 text-green-700 border-green-300';
            case 'PAYEE': return 'bg-teal-100 text-teal-800 border-teal-500';
            case 'REFUSEE': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-300';
        }
    };

    const statusLabel = getStatusLabel(demande.statut);
    
    // Taille adaptative : Si le texte est long, on réduit la police
    const watermarkSize = statusLabel.length > 10 ? 'text-[80px]' : 'text-[150px]';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative print:shadow-none print:w-full">
                
                {/* Actions Bar */}
                <div className="bg-gray-800 text-white p-4 flex justify-between items-center print:hidden">
                    <h3 className="font-medium flex items-center gap-2">
                        <FileText size={18}/> Détail de la demande
                    </h3>
                    <div className="flex gap-3">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">
                            <Printer size={16}/> Imprimer
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-red-600 rounded transition">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Document */}
                <div className="p-8 md:p-12 relative overflow-hidden">
                    
                    {/* Watermark Intelligent */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none transform -rotate-12 whitespace-nowrap z-0">
                         <span className={`${watermarkSize} font-black uppercase text-gray-900`}>
                             {statusLabel}
                         </span>
                    </div>

                    {/* Contenu */}
                    <div className="relative z-10">
                        {/* ... Le reste du code d'affichage (Header, Grid, Tableau) reste identique ... */}
                        {/* Je ne remets pas tout pour ne pas saturer la réponse, 
                            mais garde bien le reste de ton composant tel quel. */}
                        
                        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900 mb-2">Bon de Caisse</h1>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-gray-900 text-white font-mono text-sm font-bold rounded">
                                        N° {demande.numeroReference || '---'}
                                    </span>
                                    <span className={`px-3 py-1 border text-xs font-bold rounded uppercase ${getStatusColor(demande.statut)}`}>
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>
                            {/* ... */}
                        </div>
                        {/* ... */}
                        
                        {/* Info Demandeur, Tableau Lignes, Footer Totaux, Signature ... */}
                        {/* ... (Copie la fin de ton fichier précédent ici) ... */}
                        
                        {/* Rappel du bloc Lignes pour être sûr */}
                        <div className="mb-8 bg-white/50 rounded-lg">
                            <h4 className="text-xs font-bold text-gray-900 uppercase mb-4 border-b pb-2">Détails financiers</h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-500 text-left">
                                        <th className="font-normal pb-2">Désignation</th>
                                        <th className="font-normal pb-2 text-center">Qté</th>
                                        <th className="font-normal pb-2 text-right">P.U.</th>
                                        <th className="font-normal pb-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {demande.lignes && demande.lignes.map((ligne: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="py-3 font-medium text-gray-800">{ligne.designation}</td>
                                            <td className="py-3 text-center text-gray-500">{ligne.quantite}</td>
                                            <td className="py-3 text-right text-gray-500">{Number(ligne.prixUnitaire).toLocaleString()}</td>
                                            <td className="py-3 text-right font-bold text-gray-900">{Number(ligne.total).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end border-t-2 border-gray-900 pt-6">
                            <div className="text-right">
                                <span className="block text-xs font-bold text-gray-500 uppercase">Montant Total</span>
                                <span className="text-4xl font-black text-blue-600">
                                    {Number(demande.montant).toLocaleString()} <span className="text-lg text-gray-400 font-normal">FCFA</span>
                                </span>
                            </div>
                        </div>

                        <div className="mt-12 grid grid-cols-3 gap-8 text-center text-xs uppercase text-gray-400">
                            <div className="border-t border-gray-200 pt-2">Signature Demandeur</div>
                            <div className="border-t border-gray-200 pt-2">Visa Chef de Service</div>
                            <div className="border-t border-gray-200 pt-2">Validation Manager</div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};