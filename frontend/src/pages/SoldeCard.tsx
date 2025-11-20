import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react'; // Assure-toi d'avoir installé lucide-react

// On définit ce que l'API nous renvoie
interface SoldeResponse {
    solde: number;
    devise: string;
    date: string;
}

export default function SoldeCard() {
    const [solde, setSolde] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchSolde = async () => {
            try {
                // On récupère le token JWT stocké lors du login
                const token = localStorage.getItem('token'); 
                
                const response = await fetch('http://127.0.0.1:8000/api/solde', {
                    headers: {
                        // Important : On s'authentifie pour avoir le droit de voir l'argent
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Erreur réseau');

                const data: SoldeResponse = await response.json();
                setSolde(data.solde);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchSolde();
    }, []);

    // Formatage propre (ex: 200,00 €)
    const formattedSolde = solde !== null 
        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(solde)
        : '--- €';

    return (
        <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-100">
            <div className="p-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0 bg-pink-50 p-3 rounded-lg">
                        {/* Icône Portefeuille en Rose */}
                        <Wallet className="h-8 w-8 text-pink-600" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate uppercase tracking-wider">
                                Solde Actuel Caisse
                            </dt>
                            <dd>
                                <div className="text-4xl font-bold text-gray-900 mt-1">
                                    {loading ? (
                                        <span className="text-gray-300 text-2xl animate-pulse">Chargement...</span>
                                    ) : error ? (
                                        <span className="text-red-500 text-sm">Erreur de chargement</span>
                                    ) : (
                                        formattedSolde
                                    )}
                                </div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            {/* Petite barre de statut en bas */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <div className="text-sm flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-2 ${error ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    <span className="text-gray-500 font-medium">
                        {loading ? 'Mise à jour...' : error ? 'Déconnecté' : 'Données en temps réel'}
                    </span>
                </div>
            </div>
        </div>
    );
}