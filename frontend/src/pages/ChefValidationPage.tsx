import React, { useEffect, useState } from 'react';
import { Check, X, Eye, Users } from 'lucide-react';
import { RequestBonViewer } from '../components/RequestBonViewer';

export default function ChefValidationPage() {
    const [demandes, setDemandes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDemande, setSelectedDemande] = useState<any>(null); // Pour le viewer

    const fetchDemandes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://127.0.0.1:8000/api/demandes/to-validate', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setDemandes(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDemandes(); }, []);

    // Charger le détail complet pour la modale
    const openDetail = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://127.0.0.1:8000/api/demandes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSelectedDemande(await res.json());
        } catch (e) { alert("Impossible de charger le détail"); }
    };

    const handleAction = async (id: string, action: 'valider' | 'refuser') => {
        if (!confirm(`Voulez-vous vraiment ${action} cette demande ?`)) return;
        
        const token = localStorage.getItem('token');
        await fetch(`https://127.0.0.1:8000/api/demandes/${id}/workflow`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        
        // Fermer la modale si ouverte et rafraichir
        setSelectedDemande(null);
        fetchDemandes();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Check className="mr-2 text-blue-600" /> Validation des demandes (Service)
            </h1>

            {loading ? (
                <div className="text-center py-10">Chargement...</div>
            ) : demandes.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Check className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Tout est à jour !</h3>
                    <p className="text-gray-500">Aucune demande en attente de validation pour votre service.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {demandes.map((d) => (
                        <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {d.numeroReference || '---'}
                                </span>
                                <span className="text-xs font-bold text-gray-400">{d.date}</span>
                            </div>
                            
                            <h3 className="font-bold text-gray-900 mb-1 truncate" title={d.titre}>{d.titre}</h3>
                            <p className="text-sm text-blue-600 font-medium mb-4">{d.demandeur}</p>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <span className="font-bold text-lg text-gray-800">{Number(d.montant).toLocaleString()} F</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openDetail(d.id)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                                        title="Voir le bon"
                                    >
                                        <Eye size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleAction(d.id, 'valider')}
                                        className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm"
                                        title="Valider"
                                    >
                                        <Check size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleAction(d.id, 'refuser')}
                                        className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                                        title="Refuser"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modale "Bon de Caisse" */}
            {selectedDemande && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                     <RequestBonViewer demande={selectedDemande} onClose={() => setSelectedDemande(null)} />
                     {/* Ajoutons une barre d'action flottante en bas pour valider depuis la modale */}
                     <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 bg-white p-2 rounded-full shadow-2xl z-[60]">
                        <button 
                            onClick={() => handleAction(selectedDemande.id, 'refuser')}
                            className="bg-red-50 text-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-100 transition"
                        >
                            Refuser
                        </button>
                        <button 
                            onClick={() => handleAction(selectedDemande.id, 'valider')}
                            className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition shadow-lg"
                        >
                            Valider la demande
                        </button>
                     </div>
                </div>
            )}
        </div>
    );
}