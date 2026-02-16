import React, { useState } from 'react';
import { X, Printer, FileText, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import { apiUrl } from '../utils/env';

interface ViewerProps {
    demande: any;
    onClose: () => void;
}

export const RequestBonViewer: React.FC<ViewerProps> = ({ demande, onClose }) => {
    if (!demande) return null;


    const [sendingRequest, setSendingRequest] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [sendSuccess, setSendSuccess] = useState<string | null>(null);
    const [cancellingRequest, setCancellingRequest] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

    const bon = demande.bonDeCaisse;

    const getStatusLabel = (status?: string) => {
        if (!status) {
            return '';
        }

        switch (status) {
            case 'BROUILLON': return 'BROUILLON';
            case 'ATTENTE_CHEF': return 'ATTENTE CHEF';
            case 'ATTENTE_MANAGER': return 'ATTENTE MANAGER';
            case 'VALIDEE_A_PAYER': return 'BON À PAYER';
            case 'PAYEE': return 'PAYÉE';
            case 'REFUSEE': return 'REFUSÉE';
            default: return status.replace(/_/g, ' ');
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
    const watermarkSize = statusLabel && statusLabel.length > 10 ? 'text-[80px]' : 'text-[150px]';

    const canSendRequest = demande.statut === 'BROUILLON';
    const canCancelRequest = demande.statut !== 'ANNULEE' && demande.statut !== 'PAYEE' && demande.statut !== 'REFUSEE';

    const handleSendRequest = async () => {
        setSendingRequest(true);
        setSendError(null);
        
        try {
            const response = await fetch(apiUrl(`/api/demandes/${demande.id}/envoyer`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setSendSuccess("La demande a été envoyée au circuit de validation !");
                Swal.fire({
                    icon: 'success',
                    title: 'Demande envoyée',
                    text: 'La demande a été envoyée au circuit de validation !',
                    timer: 1500,
                    showConfirmButton: false
                });
                setTimeout(() => {
                    onClose();
                    window.location.reload(); // Ou une fonction de refresh plus élégante
                }, 1500);
            } else {
                setSendError(data.error || "Une erreur est survenue");
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: data.error || "Une erreur est survenue"
                });
            }
        } catch (error) {
            setSendError("Impossible de contacter le serveur");
            Swal.fire({
                icon: 'error',
                title: 'Erreur de connexion',
                text: 'Impossible de contacter le serveur'
            });
        } finally {
            setSendingRequest(false);
        }
    };

       const handleCancelRequest = async () => {
        const result = await Swal.fire({
            title: 'Confirmation d\'annulation',
            text: "Êtes-vous sûr de vouloir annuler cette demande ? Cette action est irréversible.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Oui, annuler',
            cancelButtonText: 'Non'
        });

        if (!result.isConfirmed) {
            return;
        }

        setCancellingRequest(true);
        setCancelError(null);
        
        try {
            const response = await fetch(apiUrl(`/api/demandes/${demande.id}/annuler`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setCancelSuccess("La demande a été annulée avec succès !");
                Swal.fire({
                    icon: 'success',
                    title: 'Demande annulée',
                    text: 'La demande a été annulée avec succès !',
                    timer: 1500,
                    showConfirmButton: false
                });
                setTimeout(() => {
                    onClose();
                    window.location.reload();
                }, 1500);
            } else {
                setCancelError(data.error || "Une erreur est survenue");
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: data.error || "Une erreur est survenue"
                });
            }
        } catch (error) {
            setCancelError("Impossible de contacter le serveur");
            Swal.fire({
                icon: 'error',
                title: 'Erreur de connexion',
                text: 'Impossible de contacter le serveur'
            });
        } finally {
            setCancellingRequest(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative print:shadow-none print:w-full print:max-w-full">
                
                {/* Actions Bar */}
                <div className="bg-gray-800 text-white p-4 flex justify-between items-center print:hidden">
                    <h3 className="font-medium flex items-center gap-2">
                        <FileText size={18}/> Détail de la demande
                    </h3>
                    <div className="flex gap-3">
                        {canSendRequest && (
                            <button 
                                onClick={handleSendRequest}
                                disabled={sendingRequest}
                                className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 rounded text-sm transition"
                            >
                                <Send size={16}/> 
                                {sendingRequest ? 'Envoi...' : 'Envoyer'}
                            </button>
                        )}
                        {canCancelRequest && (
                            <button 
                                onClick={handleCancelRequest}
                                disabled={cancellingRequest}
                                className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 rounded text-sm transition"
                            >
                                <X size={16}/> 
                                {cancellingRequest ? 'Annulation...' : 'Annuler'}
                            </button>
                        )}
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">
                            <Printer size={16}/> Imprimer
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-red-600 rounded transition">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Document */}
                <div className="p-4 md:p-6 relative overflow-hidden max-h-[80vh] overflow-y-auto">
                    
                    {/* Watermark Intelligent */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none transform -rotate-12 whitespace-nowrap z-0">
                         <span className={`${watermarkSize} font-black uppercase text-gray-900`}>
                             {statusLabel}
                         </span>
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-gray-300 pb-3 mb-4">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-1">Demande</h1>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-1 bg-gray-900 text-white font-mono text-xs font-bold rounded">
                                    N° {demande.numeroReference || '---'}
                                </span>
                                <span className={`px-2 py-1 border text-xs font-bold rounded uppercase ${getStatusColor(demande.statut)}`}>
                                    {statusLabel}
                                </span>
                                {bon && (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono rounded">
                                        Bon: {bon.reference}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contenu compact */}
                    <div className="relative z-10 space-y-4">
                        {/* Informations générales compactes */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 text-xs">Demandeur:</span>
                                <p className="font-medium">{demande.demandeur?.nom || 'Non spécifié'}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs">Date:</span>
                                <p className="font-medium">
                                    {demande.createdAt ? new Date(demande.createdAt).toLocaleDateString('fr-FR') : '---'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500 text-xs">Objet:</span>
                            <p className="font-medium text-sm">{demande.titre || '---'}</p>
                        </div>

                        <div>
                            <span className="text-gray-500 text-xs">Motif:</span>
                            <p className="font-medium text-sm">{demande.motif || '---'}</p>
                        </div>

                        {/* Détails financiers compactés */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Détails financiers</h4>
                            <div className="max-h-32 overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-gray-500 text-left">
                                            <th className="font-normal pb-1">Désignation</th>
                                            <th className="font-normal pb-1 text-center">Qté</th>
                                            <th className="font-normal pb-1 text-right">P.U.</th>
                                            <th className="font-normal pb-1 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {demande.lignes && demande.lignes.map((ligne: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="py-1 font-medium text-gray-800">{ligne.designation}</td>
                                                <td className="py-1 text-center text-gray-500">{ligne.quantite}</td>
                                                <td className="py-1 text-right text-gray-500">{Number(ligne.prixUnitaire).toLocaleString()}</td>
                                                <td className="py-1 text-right font-bold text-gray-900">{Number(ligne.total).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Total et messages */}
                        <div className="flex justify-between items-start border-t border-gray-300 pt-3 gap-4">
                            <div className="flex-1 print:hidden space-y-2">
                                {sendSuccess && (
                                    <div className="bg-green-50 border border-green-200 rounded p-2">
                                        <p className="text-xs text-green-700">{sendSuccess}</p>
                                    </div>
                                )}
                                {sendError && (
                                    <div className="bg-red-50 border border-red-200 rounded p-2">
                                        <p className="text-xs text-red-700">{sendError}</p>
                                    </div>
                                )}
                                {cancelSuccess && (
                                    <div className="bg-green-50 border border-green-200 rounded p-2">
                                        <p className="text-xs text-green-700">{cancelSuccess}</p>
                                    </div>
                                )}
                                {cancelError && (
                                    <div className="bg-red-50 border border-red-200 rounded p-2">
                                        <p className="text-xs text-red-700">{cancelError}</p>
                                    </div>
                                )}
                                {bon && (
                                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                        <h4 className="text-xs font-bold text-blue-800 uppercase mb-1">
                                            Bon de caisse lié
                                        </h4>
                                        <p className="text-xs text-blue-900 font-mono">
                                            Référence : {bon.reference}
                                        </p>
                                        {bon.retourFond && (
                                            <p className="mt-1 text-xs text-blue-700">
                                                Retour de fond : {Number(bon.retourFond.montant).toLocaleString()} FCFA
                                                {bon.retourFond.date && <> le {bon.retourFond.date}</>}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="block text-xs font-bold text-gray-500 uppercase">Total</span>
                                <span className="text-2xl font-black text-blue-600">
                                    {Number(demande.montant).toLocaleString()} <span className="text-xs text-gray-400 font-normal">FCFA</span>
                                </span>
                            </div>
                        </div>

                        {/* Signatures compactes */}
                        <div className="grid grid-cols-3 gap-4 text-center text-xs uppercase text-gray-400 pt-2 border-t border-gray-200">
                            <div className="border-t border-gray-200 pt-1">Demandeur</div>
                            <div className="border-t border-gray-200 pt-1">Chef Service</div>
                            <div className="border-t border-gray-200 pt-1">Manager</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};