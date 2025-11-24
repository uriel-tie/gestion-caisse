import React, { useEffect, useState } from 'react';
import { Monitor, User, Lock, Unlock, AlertCircle } from 'lucide-react';

interface CaisseState {
    id: number;
    nom: string;
    estOuverte: boolean;
    solde_theorique?: number; // À récupérer via API plus tard
    caissier_nom?: string;
}

export default function CaissesLiveView() {
    const [caisses, setCaisses] = useState<CaisseState[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCaisses = async () => {
        const token = localStorage.getItem('token');
        try {
            // Idéalement, il faudrait une API /api/caisses/monitoring qui donne + d'infos (solde, user)
            // Pour l'instant on utilise la liste standard
            const res = await fetch('http://127.0.0.1:8000/api/caisses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setCaisses(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Polling pour voir les ouvertures/fermetures en direct
    useEffect(() => {
        fetchCaisses();
        const interval = setInterval(fetchCaisses, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {caisses.map((c) => (
                <div key={c.id} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white flex flex-col justify-between transition-all ${c.estOuverte ? 'border-green-500' : 'border-gray-300'}`}>
                    
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                            <Monitor className={`h-5 w-5 mr-2 ${c.estOuverte ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className="font-bold text-gray-800">{c.nom}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.estOuverte ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {c.estOuverte ? 'OUVERTE' : 'FERMÉE'}
                        </span>
                    </div>

                    <div className="mt-2">
                        {c.estOuverte ? (
                            <>
                                <div className="flex items-center text-sm text-gray-600 mb-1">
                                    <User className="h-3 w-3 mr-2" /> 
                                    <span>Occupée</span> {/* On ajoutera le nom du caissier plus tard via l'API */}
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mt-2">
                                    --,-- € {/* Nécessite l'API monitoring pour voir le solde spécifique */}
                                </div>
                                <div className="text-xs text-green-600 flex items-center mt-1">
                                    <Unlock className="h-3 w-3 mr-1" /> Session active
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-gray-400 italic mt-2 flex items-center">
                                <Lock className="h-3 w-3 mr-1" /> En attente d'attribution
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}