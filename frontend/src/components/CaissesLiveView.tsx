import React, { useEffect, useState } from 'react';
import { Monitor, User, Lock, Unlock, Coins } from 'lucide-react';

// On met à jour l'interface pour coller à ce que renvoie SoldeController
interface CaisseDetail {
    id: number;
    nom: string;
    solde: number;       // Le montant réel
    estOuverte: boolean;
    caissier: string;    // Le nom du caissier assigné (ou "Aucun")
}

interface SoldeApiResponse {
    mode: string;
    caisses: CaisseDetail[];
    devise: string;
}

export default function CaissesLiveView() {
    const [caisses, setCaisses] = useState<CaisseDetail[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCaisses = async () => {
        const token = localStorage.getItem('token');
        try {
            // ON CHANGE L'URL : On appelle /api/solde car c'est lui qui a les infos complètes pour le manager
            const res = await fetch('https://127.0.0.1:8000/api/solde', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data: SoldeApiResponse = await res.json();
                // On vérifie que c'est bien le mode multi-caisse avant de set
                if (data.mode === 'MULTI_CAISSE' && data.caisses) {
                    setCaisses(data.caisses);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Polling toutes les 5s
    useEffect(() => {
        fetchCaisses();
        const interval = setInterval(fetchCaisses, 15000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="h-32 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">Chargement du parc...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {caisses.map((c) => (
                <div key={c.id} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white flex flex-col justify-between transition-all ${c.estOuverte ? 'border-green-500 shadow-md' : 'border-gray-300 opacity-90'}`}>
                    
                    {/* En-tête Carte */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                            <Monitor className={`h-5 w-5 mr-2 ${c.estOuverte ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className="font-bold text-gray-800 truncate max-w-[120px]" title={c.nom}>{c.nom}</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${c.estOuverte ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {c.estOuverte ? 'OUVERTE' : 'FERMÉE'}
                        </span>
                    </div>

                    {/* Corps Carte */}
                    <div>
                        {c.estOuverte ? (
                            <>
                                {/* Info Caissier */}
                                <div className="flex items-center text-sm text-gray-600 mb-2 bg-gray-50 p-2 rounded-lg">
                                    <User className="h-4 w-4 mr-2 text-blue-500" /> 
                                    <span className="font-medium truncate">{c.caissier}</span>
                                </div>
                                
                                {/* Info Solde */}
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500 flex items-center">
                                        <Coins className="h-3 w-3 mr-1"/> Solde actuel
                                    </div>
                                    <div className="text-xl font-extrabold text-gray-900">
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(c.solde)}
                                    </div>
                                </div>

                                {/* Indicateur Session */}
                                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center text-xs text-green-600 font-medium">
                                    <Unlock className="h-3 w-3 mr-1" /> Session active
                                </div>
                            </>
                        ) : (
                            /* État Fermé */
                            <div className="py-4 flex flex-col items-center justify-center text-gray-400">
                                <Lock className="h-8 w-8 mb-2 opacity-20" />
                                <span className="text-xs italic">
                                    {c.caissier !== 'Aucun' ? `Assignée à : ${c.caissier}` : 'Non assignée'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}