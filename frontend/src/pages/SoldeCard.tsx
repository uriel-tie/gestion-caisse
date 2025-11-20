import React, { useEffect, useState } from 'react';
import { Wallet, RefreshCw, AlertTriangle } from 'lucide-react';

interface SoldeResponse {
    solde: number;
    devise: string;
    date: string;
}

export default function SoldeCard() {
    const [solde, setSolde] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false); // Pour l'animation

    useEffect(() => {
        // 1. Fonction de récupération
        const fetchSolde = async (silent = false) => {
            if (!silent) setIsRefreshing(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Non connecté");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:8000/api/solde?t=${Date.now()}`, {
                     headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                }
               });

                if (!response.ok) throw new Error('Erreur réseau');

                const data: SoldeResponse = await response.json();
                setSolde(data.solde);
                setError(null); // Reset error si ça remarche
            } catch (err: any) {
                console.error(err);
                // On n'affiche l'erreur que si c'est le premier chargement
                // Sinon on garde le dernier solde connu pour éviter le clignotement
                if (loading) setError("Impossible de charger le solde");
            } finally {
                setLoading(false);
                setIsRefreshing(false);
            }
        };

        // 2. Premier appel immédiat
        fetchSolde();

        // 3. POLLING : On rafraîchit toutes les 5 secondes
        const interval = setInterval(() => {
            fetchSolde(true); // true = mode silencieux
        }, 5000);

        // 4. Nettoyage
        return () => clearInterval(interval);
    }, []); // Le tableau vide [] assure que l'intervalle n'est créé qu'une fois

    // Formatage
    const formattedSolde = solde !== null 
        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(solde)
        : '--- €';

    return (
        <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-100 transition-all hover:shadow-lg">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-pink-50 p-3 rounded-lg">
                            <Wallet className="h-8 w-8 text-pink-600" aria-hidden="true" />
                        </div>
                        <div className="ml-5">
                            <p className="text-sm font-medium text-gray-500 truncate uppercase tracking-wider flex items-center gap-2">
                                Solde Actuel Caisse
                                {isRefreshing && <RefreshCw className="h-3 w-3 text-gray-400 animate-spin" />}
                            </p>
                            <div className="text-4xl font-bold text-gray-900 mt-1">
                                {error ? (
                                    <span className="text-red-500 text-sm flex items-center">
                                        <AlertTriangle className="h-4 w-4 mr-1"/> {error}
                                    </span>
                                ) : loading ? (
                                    <span className="text-gray-300 text-2xl animate-pulse">Chargement...</span>
                                ) : (
                                    formattedSolde
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Petite barre de statut en bas */}
            <div className="bg-gray-50 px-6 py-2 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-2 ${error ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                    <span className="text-gray-500 font-medium">
                        {error ? 'Déconnecté' : 'Synchronisé en temps réel'}
                    </span>
                </div>
                <span className="text-xs text-gray-400">
                    Mise à jour auto (5s)
                </span>
            </div>
        </div>
    );
}