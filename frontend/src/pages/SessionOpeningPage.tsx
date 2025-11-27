import React, { useEffect, useState } from 'react';
import { LogOut, Monitor, Lock } from 'lucide-react';
import type { UserData } from '../types';

interface PageProps {
    user: UserData;
    onLogout: () => void;
    onSessionRequestSuccess: () => void; // Pour dire au parent "C'est bon, rafraîchis-toi"
}

export default function SessionOpeningPage({ user, onLogout, onSessionRequestSuccess }: PageProps) {
    const [caisses, setCaisses] = useState<any[]>([]);
    const [selectedCaisse, setSelectedCaisse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Charger les caisses disponibles
    useEffect(() => {
        const fetchCaisses = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('https://127.0.0.1:8000/api/caisses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // On ne garde que les caisses fermées (disponibles)
                    setCaisses(data.filter((c: any) => !c.estOuverte));
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCaisses();
    }, []);

    const handleRequestOpen = async () => {
        if (!selectedCaisse) return;
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        try {
            const res = await fetch('https://127.0.0.1:8000/api/sessions/request', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ caisse_id: selectedCaisse })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMsg("Demande envoyée ! En attente de validation du manager...");
                // Ici, on pourrait recharger la page pour passer en mode "Attente"
                setTimeout(() => onSessionRequestSuccess(), 1500);
            } else {
                setError(data.error || "Erreur lors de la demande");
            }
        } catch (err) {
            setError("Erreur technique");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Ouverture de Caisse</h1>
                    <p className="text-gray-500 mt-2">Bonjour {user.nom}.<br/>Veuillez choisir votre poste de travail.</p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
                {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm animate-pulse">{successMsg}</div>}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Caisses Disponibles</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
                            value={selectedCaisse}
                            onChange={(e) => setSelectedCaisse(e.target.value)}
                        >
                            <option value="">-- Sélectionner une caisse --</option>
                            {caisses.map((c) => (
                                <option key={c.id} value={c.id}>{c.nom}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleRequestOpen}
                        disabled={!selectedCaisse || loading}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Envoi...' : 'Demander l\'ouverture'}
                    </button>

                    <button onClick={onLogout} className="w-full flex items-center justify-center text-gray-500 hover:text-gray-700 mt-4 text-sm">
                        <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                    </button>
                </div>
            </div>
        </div>
    );
}