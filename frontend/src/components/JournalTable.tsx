import React, { useEffect, useState } from 'react';
import { Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import OperationDetailModal from './OperationDetailModal'; // <--- Import du nouveau composant

interface Operation {
    id: string;
    type: string;
    montant: number;
    date: string;
    statut: string;
    mode: string;
    utilisateur: string;
    motif: string; // <--- Ajout du motif
}

export default function JournalTable() {
    const [operations, setOperations] = useState<Operation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOp, setSelectedOp] = useState<Operation | null>(null); // Pour la modale

    const fetchOperations = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/operations?t=${Date.now()}', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Petite astuce : on compare avec JSON.stringify pour ne pas re-render si rien n'a changé
                setOperations(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
            }
        } catch (error) {
            console.error("Erreur chargement journal", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOperations(); // Premier chargement immédiat

        // POLLING : Actualisation automatique toutes les 5 secondes
        const interval = setInterval(() => {
            fetchOperations();
        }, 5000);

        return () => clearInterval(interval); // Nettoyage quand on quitte la page
    }, []);

    // Helper pour les icônes de statut
    const getStatutIcon = (statut: string) => {
        switch (statut) {
            case 'VALIDEE': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'EN_ATTENTE': return <Clock className="h-4 w-4 text-orange-500" />;
            case 'ANNULEE': return <AlertCircle className="h-4 w-4 text-red-500" />;
            default: return null;
        }
    };

    if (loading) return <div className="text-center py-4 text-gray-500">Chargement du journal...</div>;

    return (
        <>
            {/* MODALE DE DÉTAIL */}
            <OperationDetailModal 
                operation={selectedOp} 
                onClose={() => setSelectedOp(null)} 
            />

            <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg mt-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Journal des Opérations
                    </h3>
                    <span className="text-xs text-gray-400 animate-pulse">
                        Live (Mise à jour auto)
                    </span>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {operations.map((op) => (
                            <tr 
                                key={op.id} 
                                onClick={() => setSelectedOp(op)} // Clic sur la ligne
                                className="hover:bg-gray-50 cursor-pointer transition-colors group"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {op.date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${op.type === 'ENCAISSEMENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {op.type.substring(0, 3).toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium max-w-xs truncate">
                                    {op.motif}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center space-x-1">
                                        {getStatutIcon(op.statut)}
                                        <span className={`text-xs font-semibold 
                                            ${op.statut === 'EN_ATTENTE' ? 'text-orange-600' : 
                                              op.statut === 'VALIDEE' ? 'text-green-600' : 'text-gray-500'}`}>
                                            {op.statut.replace('_', ' ')}
                                        </span>
                                    </div>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold 
                                    ${op.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-600'}`}>
                                    {op.type === 'DECAISSEMENT' ? '-' : '+'}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(op.montant)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Eye className="h-5 w-5 text-gray-300 group-hover:text-pink-600" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}