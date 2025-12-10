import React, { useEffect, useState } from 'react';
import { Check, X, LogOut, TrendingUp, ArrowLeft, Banknote, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserData } from '../types';

interface ManagerValidationPageProps {
    user: UserData;
    onLogout: () => void;
}

// Type pour les Demandes RH
interface DemandeToValidate {
    id: string;
    titre: string;
    montant: string;
    demandeur: string;
    type: string;
    date: string;
    motif: string;
}

// Type pour les Opérations de Caisse
interface OperationToValidate {
    id: string;
    type: string; // 'ENCAISSEMENT' | 'DECAISSEMENT'
    montant: number;
    motif: string;
    date: string;
    caissier: string;
    service: string;
    has_justificatif: boolean;
}

const ManagerValidationPage: React.FC<ManagerValidationPageProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    
    // États pour les données
    const [demandes, setDemandes] = useState<DemandeToValidate[]>([]);
    const [operations, setOperations] = useState<OperationToValidate[]>([]);
    
    // État pour l'onglet actif ('rh' ou 'caisse')
    const [activeTab, setActiveTab] = useState<'rh' | 'caisse'>('rh');
    const [loading, setLoading] = useState(false);

    // Fonction générique de fetch
    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // 1. Charger les Demandes RH
            const resDemandes = await fetch('https://127.0.0.1:8000/api/demandes/to-validate', { headers });
            if (resDemandes.ok) setDemandes(await resDemandes.json());

            // 2. Charger les Opérations de Caisse
            const resOperations = await fetch('https://127.0.0.1:8000/api/operations/to-validate', { headers });
            if (resOperations.ok) setOperations(await resOperations.json());

        } catch (error) {
            console.error("Erreur chargement", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Action pour les Demandes RH
    const handleDemandeAction = async (id: string, action: 'valider' | 'refuser') => {
        if(!confirm(`Confirmer l'action "${action}" sur cette demande ?`)) return;
        const token = localStorage.getItem('token');
        await fetch(`https://127.0.0.1:8000/api/demandes/${id}/workflow`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        fetchData();
    };

    // Action pour les Opérations Caisse (NOUVEAU)
    const handleOperationAction = async (id: string, action: 'valider' | 'refuser') => {
        const message = action === 'valider' 
            ? "Attention : Valider ce décaissement déduira immédiatement le montant du solde de la caisse."
            : "Refuser cette opération l'annulera définitivement.";
        
        if(!confirm(message)) return;

        const token = localStorage.getItem('token');
        const response = await fetch(`https://127.0.0.1:8000/api/operations/${id}/workflow`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        if (!response.ok) {
            const err = await response.json();
            alert("Erreur: " + (err.error || "Impossible de traiter l'opération"));
        } else {
            fetchData();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* NAVBAR */}
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
                <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-500 hover:text-purple-700 mb-6 font-medium">
                    <ArrowLeft className="mr-2 h-5 w-5" /> Retour au tableau de bord
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-6">Centre de Validation</h2>

                {/* --- TABS --- */}
                <div className="flex space-x-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('rh')}
                        className={`pb-4 px-4 flex items-center font-medium transition-colors border-b-2 ${
                            activeTab === 'rh' 
                            ? 'border-purple-600 text-purple-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FileText className="mr-2 h-5 w-5" />
                        Demandes RH
                        {demandes.length > 0 && (
                            <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs">
                                {demandes.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('caisse')}
                        className={`pb-4 px-4 flex items-center font-medium transition-colors border-b-2 ${
                            activeTab === 'caisse' 
                            ? 'border-purple-600 text-purple-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Banknote className="mr-2 h-5 w-5" />
                        Opérations Caisse
                        {operations.length > 0 && (
                            <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                                {operations.length}
                            </span>
                        )}
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Chargement des dossiers...</p>
                    </div>
                ) : (
                    <>
                        {/* --- CONTENU ONGLET RH --- */}
                        {activeTab === 'rh' && (
                            demandes.length === 0 ? (
                                <EmptyState message="Aucune demande RH en attente." />
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {demandes.map((d) => (
                                        <CardRH key={d.id} data={d} onAction={handleDemandeAction} />
                                    ))}
                                </div>
                            )
                        )}

                        {/* --- CONTENU ONGLET CAISSE --- */}
                        {activeTab === 'caisse' && (
                            operations.length === 0 ? (
                                <EmptyState message="Aucune opération de caisse en attente." />
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {operations.map((op) => (
                                        <CardOperation key={op.id} data={op} onAction={handleOperationAction} />
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// --- SOUS-COMPOSANTS POUR ALLEGER LE CODE ---

const EmptyState = ({ message }: { message: string }) => (
    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
        <Check className="mx-auto h-12 w-12 text-gray-300 mb-4 bg-gray-50 rounded-full p-2" />
        <p className="text-gray-500">{message}</p>
    </div>
);

const CardRH = ({ data, onAction }: { data: DemandeToValidate, onAction: (id: string, action: 'valider' | 'refuser') => void }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-900">{data.titre}</h3>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">{data.type}</span>
        </div>
        <p className="text-sm text-purple-600 font-medium mb-4">{data.demandeur}</p>
        <p className="bg-gray-50 p-3 rounded text-sm text-gray-600 mb-4 min-h-[60px]">{data.motif || "Pas de description"}</p>
        <div className="flex justify-between items-center pt-4 border-t">
            <span className="font-bold text-lg">{data.montant} FCFA</span>
            <div className="flex gap-2">
                <button onClick={() => onAction(data.id, 'refuser')} className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100"><X size={18}/></button>
                <button onClick={() => onAction(data.id, 'valider')} className="py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center text-sm font-medium"><Check size={16} className="mr-1"/> Valider</button>
            </div>
        </div>
    </div>
);

const CardOperation = ({ data, onAction }: { data: OperationToValidate, onAction: (id: string, action: 'valider' | 'refuser') => void }) => (
    <div className="bg-white rounded-xl shadow-md border-l-4 border-l-orange-500 p-6 hover:shadow-lg transition-all">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-900 flex items-center">
                <AlertCircle className="w-4 h-4 text-orange-500 mr-2"/>
                {data.type}
            </h3>
            <span className="text-xs text-gray-400">{data.date}</span>
        </div>
        
        <div className="mb-4">
            <p className="text-sm text-gray-600">Caissier: <span className="font-medium text-gray-800">{data.caissier}</span></p>
            {data.has_justificatif && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">Pièce jointe</span>}
        </div>

        <p className="bg-orange-50 p-3 rounded text-sm text-gray-700 mb-4 min-h-[60px] italic">"{data.motif}"</p>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="font-bold text-xl text-orange-600">{data.montant.toLocaleString()} FCFA</span>
            <div className="flex gap-2">
                <button onClick={() => onAction(data.id, 'refuser')} className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100" title="Refuser"><X size={18}/></button>
                <button onClick={() => onAction(data.id, 'valider')} className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 flex items-center text-sm font-medium"><Check size={16} className="mr-1"/> Payer</button>
            </div>
        </div>
    </div>
);

export default ManagerValidationPage;