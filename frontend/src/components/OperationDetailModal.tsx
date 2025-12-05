import React from 'react';
import { X, FileText, User, Calendar, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Operation {
    id: string;
    type: string;
    montant: number;
    date: string;
    statut: string;
    mode: string;
    utilisateur: string;
    motif: string;
}

interface OperationDetailModalProps {
    operation: Operation | null;
    onClose: () => void;
}

export default function OperationDetailModal({ operation, onClose }: OperationDetailModalProps) {
    if (!operation) return null;

    // Helper pour la couleur du statut
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'VALIDEE': return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Validée' };
            case 'EN_ATTENTE': return { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'En Attente de Validation' };
            case 'ANNULEE': return { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Annulée' };
            default: return { color: 'bg-gray-100 text-gray-800', icon: FileText, label: status };
        }
    };

    const statusConfig = getStatusConfig(operation.statut);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center border-b ${operation.type === 'ENCAISSEMENT' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center space-x-2">
                        <span className={`font-bold text-lg ${operation.type === 'ENCAISSEMENT' ? 'text-green-700' : 'text-red-700'}`}>
                            {operation.type}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    
                    {/* Montant et Date */}
                    <div className="text-center">
                        <h2 className={`text-4xl font-extrabold ${operation.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-600'}`}>
                            {operation.type === 'DECAISSEMENT' ? '-' : '+'}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(operation.montant)}
                        </h2>
                        <p className="text-gray-500 mt-1 text-sm flex items-center justify-center">
                            <Calendar className="h-4 w-4 mr-1" /> {operation.date}
                        </p>
                    </div>

                    {/* Statut Badge */}
                    <div className="flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center ${statusConfig.color}`}>
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {statusConfig.label}
                        </span>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Détails Grille */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 mb-1 flex items-center"><FileText className="h-3 w-3 mr-1"/> Motif</p>
                            <p className="font-medium text-gray-900">{operation.motif}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 mb-1 flex items-center"><User className="h-3 w-3 mr-1"/> Opérateur</p>
                            <p className="font-medium text-gray-900">{operation.utilisateur}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 mb-1 flex items-center"><CreditCard className="h-3 w-3 mr-1"/> Moyen de paiement</p>
                            <p className="font-medium text-gray-900">{operation.mode}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg opacity-50 cursor-not-allowed" title="Fonctionnalité à venir">
                            <p className="text-gray-500 mb-1 flex items-center"><FileText className="h-3 w-3 mr-1"/> Justificatif</p>
                            <p className="font-medium text-gray-400 italic">Aucun fichier</p>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}