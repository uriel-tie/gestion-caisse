import React, { useState, useRef } from 'react';
import { X, FileText, User, Calendar, CreditCard, CheckCircle, Clock, AlertCircle, UploadCloud, ArrowRight, Loader } from 'lucide-react';

interface Operation {
    id: string;
    type: string;
    montant: number;
    date: string;
    statut: string;
    mode: string;
    utilisateur: string;
    motif: string;
    caisse: string;
    justificatif?: {
        type: string;
        url?: string;
        contenu?: any;
        signature?: string;
    } | null;
}

interface OperationDetailModalProps {
    operation: Operation | null;
    onClose: () => void;
    onUpdate?: () => void; // Callback pour rafraîchir la liste après upload
}

export default function OperationDetailModal({ operation, onClose, onUpdate }: OperationDetailModalProps) {
    // --- États pour l'upload ---
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!operation) return null;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'VALIDEE': return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Validée' };
            case 'EN_ATTENTE': return { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'En Attente' };
            case 'ANNULEE': return { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Annulée' };
            default: return { color: 'bg-gray-100 text-gray-800', icon: FileText, label: status };
        }
    };

    const statusConfig = getStatusConfig(operation.statut);
    const StatusIcon = statusConfig.icon;

    // Helper conversion Base64
    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);

        try {
            const base64 = await convertFileToBase64(selectedFile);
            const token = localStorage.getItem('token');

            const res = await fetch(`https://127.0.0.1:8000/api/operations/${operation.id}/attach-justificatif`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fichier_data: base64,
                    fichier_nom: selectedFile.name
                })
            });

            if (!res.ok) throw new Error("Erreur upload");

            alert("Justificatif ajouté !");
            if (onUpdate) onUpdate(); // Rafraîchir le journal
            onClose(); // Fermer la modale

        } catch (e) {
            alert("Impossible d'envoyer le fichier.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center border-b shrink-0 ${operation.type === 'ENCAISSEMENT' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center space-x-2">
                        <span className={`font-bold text-lg ${operation.type === 'ENCAISSEMENT' ? 'text-green-700' : 'text-red-700'}`}>
                            {operation.type}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    
                    {/* Info Principale */}
                    <div className="text-center">
                        <h2 className={`text-4xl font-extrabold ${operation.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-600'}`}>
                            {operation.type === 'DECAISSEMENT' ? '-' : '+'}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(operation.montant)}
                        </h2>
                        <div className="flex justify-center items-center gap-2 mt-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                            </span>
                            <span className="text-gray-400 text-sm flex items-center">
                                <Calendar className="h-3 w-3 mr-1" /> {operation.date}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
                        <div>
                            <p className="text-gray-500 text-xs uppercase font-bold mb-1">Motif</p>
                            <p className="font-medium text-gray-900">{operation.motif}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase font-bold mb-1">Opérateur</p>
                            <p className="font-medium text-gray-900 flex items-center"><User className="h-3 w-3 mr-1"/> {operation.utilisateur}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase font-bold mb-1">Moyen de paiement</p>
                            <p className="font-medium text-gray-900 flex items-center"><CreditCard className="h-3 w-3 mr-1"/> {operation.mode}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase font-bold mb-1">Caisse</p>
                            <p className="font-medium text-gray-900">{operation.caisse}</p>
                        </div>
                    </div>

                    {/* ZONE JUSTIFICATIF */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                            <FileText className="h-4 w-4 mr-2"/> Justificatif
                        </h4>

                        {operation.justificatif ? (
                            /* CAS : Justificatif EXISTANT */
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                {operation.justificatif.type === 'BON_INTERNE' ? (
                                    <div className="text-sm">
                                        <p className="font-bold text-blue-800 mb-2">Bon de Dépense Numérique</p>
                                        {/* Liste Articles */}
                                        {Array.isArray(operation.justificatif.contenu) && (
                                            <ul className="list-disc pl-4 mb-2 space-y-1">
                                                {operation.justificatif.contenu.map((item:any, i:number) => (
                                                    <li key={i}>{item.designation} (x{item.quantite}) - {item.total} F</li>
                                                ))}
                                            </ul>
                                        )}
                                        {/* Signature */}
                                        {operation.justificatif.signature && (
                                            <div className="mt-2 p-2 bg-white rounded border inline-block">
                                                <img src={operation.justificatif.signature} className="h-10" alt="Signature" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-blue-700 text-sm">Fichier joint disponible</span>
                                        <a 
                                            href={operation.justificatif.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition"
                                        >
                                            Voir le document
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* CAS : AUCUN JUSTIFICATIF -> ZONE D'UPLOAD */
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 transition hover:bg-gray-100">
                                {selectedFile ? (
                                    <div className="text-center w-full">
                                        <p className="text-sm font-medium text-gray-700 mb-3 truncate px-4">{selectedFile.name}</p>
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={handleFileUpload} 
                                                disabled={isUploading}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex items-center"
                                            >
                                                {isUploading ? <Loader className="animate-spin h-4 w-4 mr-2"/> : <UploadCloud className="h-4 w-4 mr-2"/>}
                                                Envoyer
                                            </button>
                                            <button 
                                                onClick={() => setSelectedFile(null)}
                                                className="text-gray-500 hover:text-red-600 p-2"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500 mb-1">Aucun justificatif lié.</p>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-blue-600 font-semibold text-sm hover:underline"
                                        >
                                            Cliquez pour ajouter un fichier (Photo/PDF)
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end shrink-0 border-t">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}