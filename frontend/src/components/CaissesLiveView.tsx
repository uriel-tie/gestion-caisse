import React, { useEffect, useState } from 'react';
import { Monitor, User, Lock, Unlock, Coins, Wallet, Activity, AlertCircle, FileText, Banknote, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CaisseDetail {
    id: number;
    nom: string;
    solde: number;
    estOuverte: boolean;
    caissier: string;
}

interface SoldeApiResponse {
    mode: string;
    caisses: CaisseDetail[];
    devise: string;
}

export default function CaissesLiveView() {
    const navigate = useNavigate();
    const [caisses, setCaisses] = useState<CaisseDetail[]>([]);
    const [alerts, setAlerts] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // 1. Récupérer les Caisses
            const resSolde = await fetch('https://127.0.0.1:8000/api/solde', { headers });
            if (resSolde.ok) {
                const data: SoldeApiResponse = await resSolde.json();
                if (data.mode === 'MULTI_CAISSE' && data.caisses) {
                    setCaisses(data.caisses);
                }
            }

            // 2. Récupérer les Alertes (Pour remplir le bas de page utilement)
            const resAlerts = await fetch('https://127.0.0.1:8000/api/alerts', { headers });
            if (resAlerts.ok) {
                setAlerts(await resAlerts.json());
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    // --- CALCULS STATS ---
    const totalSolde = caisses.reduce((acc, c) => acc + (c.estOuverte ? c.solde : 0), 0);
    const nbOuvertes = caisses.filter(c => c.estOuverte).length;
    const nbFermees = caisses.length - nbOuvertes;

    // --- GRILLE DYNAMIQUE CAISSES ---
    const getCaisseGridClass = () => {
        const count = caisses.length;
        if (count === 0) return "";
        if (count === 1) return "grid-cols-1 max-w-2xl mx-auto"; 
        if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto";
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"; 
    };

    if (loading) return (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement du cockpit...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* 1. HEADER : TRÉSORERIE GLOBALE */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                {/* Décoration d'arrière-plan */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-500 opacity-10 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 shadow-inner">
                            <Wallet size={32} className="text-purple-100" />
                        </div>
                        <div>
                            <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-1">Trésorerie Disponible</p>
                            <p className="text-4xl font-extrabold tracking-tight">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(totalSolde)}
                            </p>
                        </div>
                    </div>

                    <div className="h-12 w-px bg-white/10 hidden md:block"></div>

                    <div className="flex gap-8">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{nbOuvertes}</p>
                            <p className="text-xs text-purple-200 uppercase font-medium">En Ligne</p>
                        </div>
                        <div className="text-center opacity-60">
                            <p className="text-2xl font-bold text-white">{nbFermees}</p>
                            <p className="text-xs text-purple-200 uppercase font-medium">Hors Ligne</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. PARC DE CAISSES (Grille) */}
            <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                    <Monitor className="mr-2 h-5 w-5 text-gray-400"/>
                    État des Caisses
                </h3>
                
                {caisses.length === 0 ? (
                     <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                        <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Aucune caisse configurée.</p>
                    </div>
                ) : (
                    <div className={`grid gap-6 ${getCaisseGridClass()}`}>
                        {caisses.map((c) => (
                            <div 
                                key={c.id} 
                                className={`
                                    relative rounded-2xl border transition-all duration-300 group overflow-hidden
                                    ${c.estOuverte 
                                        ? 'bg-white border-green-200 shadow-sm hover:shadow-lg hover:-translate-y-1' 
                                        : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                                    }
                                `}
                            >
                                <div className={`h-1.5 w-full ${c.estOuverte ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800 mb-1">{c.nom}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${c.estOuverte ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                                <span className="text-xs font-medium text-gray-500">{c.estOuverte ? 'Ouverte' : 'Fermée'}</span>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-lg ${c.estOuverte ? 'bg-green-50 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                                            {c.estOuverte ? <Unlock size={18} /> : <Lock size={18} />}
                                        </div>
                                    </div>

                                    {c.estOuverte ? (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white text-blue-600 shadow-sm flex items-center justify-center font-bold text-xs border border-gray-100">
                                                        {c.caissier.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Caissier</p>
                                                        <p className="text-sm font-medium text-gray-800 truncate" title={c.caissier}>{c.caissier}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Solde Actuel</p>
                                                <p className="text-2xl font-bold text-gray-900 tracking-tight">
                                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(c.solde)}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-24 flex flex-col items-center justify-center text-gray-400 bg-gray-100/50 rounded-xl border border-dashed border-gray-200">
                                            <User size={20} className="mb-2 opacity-50"/>
                                            <span className="text-xs italic">Non assignée</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. SECTION BASSE : PILOTAGE & ALERTES (Pour combler le vide utilement) */}
            <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-gray-400"/>
                    Pilotage Rapide
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Carte Validations RH */}
                    <div 
                        onClick={() => navigate('/manager/validations')}
                        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                                <FileText size={24} />
                            </div>
                            {alerts?.manager?.validations > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                    {alerts.manager.validations} à traiter
                                </span>
                            )}
                        </div>
                        <h4 className="font-bold text-gray-800 mt-2">Validations RH</h4>
                        <p className="text-sm text-gray-500 mt-1">Gérer les demandes de fonds des employés.</p>
                        <div className="mt-4 flex items-center text-sm text-purple-600 font-medium group-hover:translate-x-1 transition-transform">
                            Accéder <ArrowRight size={16} className="ml-1"/>
                        </div>
                    </div>

                    {/* Carte Opérations Caisse */}
                    <div 
                        onClick={() => navigate('/manager/validations')} // Ou une autre route si tu as séparé
                        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors">
                                <Banknote size={24} />
                            </div>
                            {alerts?.manager?.operations > 0 && (
                                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                    {alerts.manager.operations} à traiter
                                </span>
                            )}
                        </div>
                        <h4 className="font-bold text-gray-800 mt-2">Opérations Caisse</h4>
                        <p className="text-sm text-gray-500 mt-1">Valider les décaissements exceptionnels.</p>
                        <div className="mt-4 flex items-center text-sm text-orange-600 font-medium group-hover:translate-x-1 transition-transform">
                            Accéder <ArrowRight size={16} className="ml-1"/>
                        </div>
                    </div>

                    {/* Carte Audit / Logs */}
                    <div 
                        onClick={() => navigate('/manager/audit')}
                        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <ShieldCheck size={24} />
                            </div>
                        </div>
                        <h4 className="font-bold text-gray-800 mt-2">Journal d'Audit</h4>
                        <p className="text-sm text-gray-500 mt-1">Tracer toutes les actions sensibles du système.</p>
                        <div className="mt-4 flex items-center text-sm text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                            Consulter <ArrowRight size={16} className="ml-1"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}