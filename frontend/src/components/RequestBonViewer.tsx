import React from 'react';
import { X, Printer, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ViewerProps {
    demande: any; // Idéalement typer avec l'interface Demande
    onClose: () => void;
}

export const RequestBonViewer: React.FC<ViewerProps> = ({ demande, onClose }) => {
    if (!demande) return null;

    // Helper pour la couleur du statut
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'BROUILLON': return 'bg-gray-100 text-gray-600 border-gray-300';
            case 'ATTENTE_CHEF': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'ATTENTE_MANAGER': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'VALIDEE_A_PAYER': return 'bg-green-50 text-green-600 border-green-200';
            case 'PAYEE': return 'bg-green-100 text-green-800 border-green-500';
            case 'REFUSEE': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-gray-50';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative print:shadow-none print:w-full">
                
                {/* Actions Bar (Masqué à l'impression) */}
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

                {/* LE BON (Zone Imprimable) */}
                <div className="p-8 md:p-12 relative">
                    
                    {/* Watermark Statut */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none transform -rotate-12 whitespace-nowrap">
                         <span className="text-[150px] font-black uppercase text-gray-900">
                             {demande.statut?.replace(/_/g, ' ')}
                         </span>
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900 mb-2">Bon de Caisse</h1>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-gray-900 text-white font-mono text-sm font-bold rounded">
                                    N° {demande.numeroReference || '---'}
                                </span>
                                <span className={`px-3 py-1 border text-xs font-bold rounded uppercase ${getStatusColor(demande.statut)}`}>
                                    {demande.statut}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Date de création</p>
                            <p className="font-mono text-lg font-bold">{demande.date}</p>
                            <p className="text-sm text-gray-600 mt-1">{demande.service}</p>
                        </div>
                    </div>

                    {/* Info Demandeur & Objet */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100">
                        <div className="grid grid-cols-2 gap-8 mb-4">
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Demandeur</span>
                                <span className="text-lg font-bold text-gray-800">{demande.demandeur}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Type</span>
                                <span className="text-lg font-bold text-gray-800">{demande.type}</span>
                            </div>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Objet / Titre</span>
                            <span className="text-xl font-medium text-gray-900">{demande.titre}</span>
                        </div>
                        {demande.motif && (
                             <div className="mt-4 pt-4 border-t border-gray-200">
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</span>
                                <p className="text-gray-600 italic">"{demande.motif}"</p>
                             </div>
                        )}
                    </div>

                    {/* Tableau Lignes */}
                    <div className="mb-8">
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

                    {/* Total Footer */}
                    <div className="flex justify-end border-t-2 border-gray-900 pt-6">
                        <div className="text-right">
                            <span className="block text-xs font-bold text-gray-500 uppercase">Montant Total</span>
                            <span className="text-4xl font-black text-blue-600">
                                {Number(demande.montant).toLocaleString()} <span className="text-lg text-gray-400 font-normal">FCFA</span>
                            </span>
                        </div>
                    </div>

                    {/* Zone Signature (Simulation) */}
                    <div className="mt-12 grid grid-cols-3 gap-8 text-center text-xs uppercase text-gray-400">
                        <div className="border-t border-gray-200 pt-2">Signature Demandeur</div>
                        <div className="border-t border-gray-200 pt-2">Visa Chef de Service</div>
                        <div className="border-t border-gray-200 pt-2">Validation Manager</div>
                    </div>
                </div>
            </div>
        </div>
    );
};