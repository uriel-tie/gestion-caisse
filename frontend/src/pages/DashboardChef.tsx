import React, { useEffect, useState } from 'react';
import { Check, X, Clock, LogOut } from 'lucide-react';
import type { UserData } from '../types';

interface DashboardChefProps {
    user: UserData;
    onLogout: () => void;
}

interface DemandeToValidate {
    id: string;
    titre: string;
    montant: string;
    demandeur: string;
    type: string;
    date: string;
    motif: string;
}

const DashboardChef: React.FC<DashboardChefProps> = ({ user, onLogout }) => {
    const [demandes, setDemandes] = useState<DemandeToValidate[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDemandes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://127.0.0.1:8000/api/demandes/to-validate', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDemandes(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDemandes();
    }, []);

    const handleAction = async (id: string, action: 'valider' | 'refuser') => {
        const token = localStorage.getItem('token');
        await fetch(`https://127.0.0.1:8000/api/demandes/${id}/workflow`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });
        // Rafraichir la liste
        fetchDemandes();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-blue-800 text-white p-4 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">Espace Chef de Service</h1>
                    <div className="flex items-center gap-4">
                        <span> {user.nom}</span>
                        <button onClick={onLogout} className="p-2 hover:bg-blue-700 rounded-full">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                    <Clock className="mr-2" /> Demandes en attente de validation
                </h2>

                {loading ? (
                    <p>Chargement...</p>
                ) : demandes.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                        Aucune demande en attente pour votre service.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {demandes.map((demande) => (
                            <div key={demande.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">{demande.titre}</h3>
                                        <p className="text-sm text-gray-500">{demande.demandeur}</p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                        {demande.type}
                                    </span>
                                </div>
                                
                                <p className="text-gray-600 mb-4 text-sm bg-gray-50 p-2 rounded">
                                    {demande.motif || "Pas de description"}
                                </p>

                                <div className="flex justify-between items-center mt-4 border-t pt-4">
                                    <span className="text-xl font-bold text-gray-800">{demande.montant} FCFA</span>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleAction(demande.id, 'refuser')}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                            title="Refuser"
                                        >
                                            <X size={24} />
                                        </button>
                                        <button 
                                            onClick={() => handleAction(demande.id, 'valider')}
                                            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-md transition"
                                            title="Valider et envoyer au Manager"
                                        >
                                            <Check size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardChef;