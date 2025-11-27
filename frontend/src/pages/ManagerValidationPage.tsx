import React, { useEffect, useState } from 'react';
import { Check, X, LogOut, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserData } from '../types';

interface ManagerValidationPageProps {
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

const ManagerValidationPage: React.FC<ManagerValidationPageProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [demandes, setDemandes] = useState<DemandeToValidate[]>([]);
    const [loading, setLoading] = useState(false);

    // Fonction pour charger les données
    const fetchDemandes = async () => {
        setLoading(true);
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
            console.error("Erreur chargement demandes", error);
        } finally {
            setLoading(false);
        }
    };

    // Chargement automatique au montage du composant
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
        // On rafraîchit la liste
        fetchDemandes();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* NAVBAR Identique */}
            <nav className="bg-purple-800 text-white p-4 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp /> Espace Manager
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="font-medium">{user.nom}</span>
                        <button onClick={onLogout} className="p-2 hover:bg-purple-700 rounded-full transition-colors">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6">
                <div className="animate-in slide-in-from-right duration-300">
                    {/* Bouton Retour vers le Dashboard */}
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="flex items-center text-gray-500 hover:text-purple-700 mb-6 transition-colors font-medium"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" /> Retour au menu
                    </button>

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Validations RH en attente</h2>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                            {demandes.length} dossier(s)
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">Récupération des demandes...</p>
                        </div>
                    ) : demandes.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                            <Check className="mx-auto h-12 w-12 text-green-500 mb-4 bg-green-50 rounded-full p-2" />
                            <h3 className="text-lg font-medium text-gray-900">Tout est validé !</h3>
                            <p className="text-gray-500 mt-2">Aucune demande RH en attente pour le moment.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {demandes.map((demande) => (
                                <div key={demande.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 leading-tight">{demande.titre}</h3>
                                                <p className="text-sm text-purple-600 font-medium mt-1">{demande.demandeur}</p>
                                            </div>
                                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-100">
                                                {demande.type}
                                            </span>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-3 rounded-lg mb-6 text-sm text-gray-600 min-h-[60px]">
                                            {demande.motif || "Aucune description."}
                                        </div>

                                        <div className="border-t pt-4 border-gray-100">
                                            <div className="flex justify-between items-end mb-4">
                                                <p className="text-xs text-gray-400 uppercase font-bold">Montant</p>
                                                <p className="text-xl font-bold text-gray-800">{demande.montant} <span className="text-sm font-normal text-gray-500">FCFA</span></p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => handleAction(demande.id, 'refuser')}
                                                    className="py-2 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition font-medium text-sm flex justify-center items-center"
                                                >
                                                    <X size={16} className="mr-2" /> Refuser
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(demande.id, 'valider')}
                                                    className="py-2 px-4 bg-purple-600 text-white hover:bg-purple-700 rounded-lg shadow-md transition font-medium text-sm flex justify-center items-center"
                                                >
                                                    <Check size={16} className="mr-2" /> Valider
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerValidationPage;