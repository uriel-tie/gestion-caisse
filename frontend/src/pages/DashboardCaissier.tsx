import React, { useState, useEffect } from 'react';
import { Search, DollarSign, LogOut, Lock, Unlock, Monitor, Power, AlertCircle, Activity } from 'lucide-react';
import type { UserData } from '../types';
import SoldeCard from '../components/SoldeCard';
import EncaissementModal from '../components/EncaissementModal';
import DecaissementModal from '../components/DecaissementModal';
import { MyRequestsWidget } from '../components/MyRequestsWidget';
import PaymentTerminal from '../components/PaymentTerminal';
import JournalTable from '../components/JournalTable';

interface DashboardCaissierProps {
  user: UserData;
  onLogout: () => void;
}

export default function DashboardCaissier({ user, onLogout }: DashboardCaissierProps) {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [showEncaissement, setShowEncaissement] = useState(false);
  const [showDecaissement, setShowDecaissement] = useState(false);
  
  // État Clôture
  const [showClotureInput, setShowClotureInput] = useState(false);
  const [montantFermeture, setMontantFermeture] = useState('');

  const token = localStorage.getItem('token');

  const refreshStatus = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
        setLoading(false);
        return;
    }

    try {
        const res = await fetch('https://127.0.0.1:8000/api/caisses/me', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (res.ok) {
            const data = await res.json();
            console.log("Données Caisse reçues:", data); // DEBUG
            setStatusData(data); 
        } else {
            console.error("Erreur récupération statut caisse:", res.status);
        }
    } catch (e) {
        console.error("Erreur réseau:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { refreshStatus(); }, []);

  // Action : Ouvrir
  const handleOpen = async () => {
    // On demande le montant d'ouverture (Fond de caisse)
    const fond = prompt("Montant du fond de caisse à l'ouverture ?", "0");
    if (fond === null) return; // Annulé

    setLoading(true);
    try {
        const res = await fetch('https://127.0.0.1:8000/api/sessions/open', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            // CORRECTION IMPORTANTE : On envoie l'ID de la caisse récupéré via statusData
            body: JSON.stringify({ 
                caisse_id: statusData.caisse_id, 
                montant_ouverture: parseFloat(fond) 
            })
        });

        if (!res.ok) {
            const err = await res.json();
            alert("Erreur ouverture: " + err.message);
        } else {
            await refreshStatus();
        }
    } catch (e) {
        alert("Erreur réseau lors de l'ouverture");
    }
  };

  // Action : Fermer
  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusData?.session_id) return;

    if(!confirm("Confirmer la fermeture de caisse ? Cette action est irréversible.")) return;

    try {
        // CORRECTION URL : On utilise l'ID de session dynamique
        const res = await fetch(`https://127.0.0.1:8000/api/sessions/${statusData.session_id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ montant_physique: parseFloat(montantFermeture) })
        });

        const result = await res.json();

        if (res.ok) {
            // Affichage du bilan
            alert(`Caisse fermée.\nÉcart constaté : ${result.ecart} FCFA`);
            window.location.reload();
        } else {
            alert("Erreur fermeture: " + result.message);
        }
    } catch (e) {
        console.error(e);
    }
  };

  // --- RENDU DU WIDGET "STATION DE TRAVAIL" ---
  const renderCaisseWidget = () => {
    if (loading) return <div className="h-40 bg-gray-100 rounded-xl animate-pulse mb-8"></div>;

    // CAS A : PAS DE CAISSE ASSIGNÉE
    // Correction : on vérifie 'has_caisse' (booléen) renvoyé par le backend
    if (!statusData?.has_caisse) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 flex items-center justify-between">
                <div className="flex items-center text-red-800">
                    <AlertCircle className="h-8 w-8 mr-4" />
                    <div>
                        <h3 className="font-bold text-lg">Aucune caisse assignée</h3>
                        <p className="text-sm">Contactez votre manager pour qu'il vous attribue un poste.</p>
                    </div>
                </div>
            </div>
        );
    }

    // CAS B : CAISSE FERMÉE (Mais assignée) -> BOUTON OUVRIR
    // Correction : on vérifie le string 'session_status'
    if (statusData.session_status !== 'OUVERTE') {
        return (
            <div className="bg-white border-l-4 border-blue-500 rounded-xl p-6 mb-8 shadow-sm flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Monitor className="mr-2 h-5 w-5 text-blue-600"/> 
                        {statusData.caisse_nom} {/* Correction nom */}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        État : <span className="font-bold text-gray-700">FERMÉE</span>. Prête à l'ouverture.
                    </p>
                </div>
                <button 
                    onClick={handleOpen}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow transition-transform active:scale-95 flex items-center"
                >
                    <Power className="mr-2 h-5 w-5" /> OUVRIR MA SESSION
                </button>
            </div>
        );
    }

    // CAS C : SESSION OUVERTE -> TPV COMPLET
    return (
        <div className="animate-in fade-in slide-in-from-top-4">
            {/* Barre d'info session */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center border border-green-200">
                        <Unlock className="h-3 w-3 mr-1" /> SESSION ACTIVE
                    </span>
                    <span className="ml-3 text-gray-500 text-sm font-medium">Poste : {statusData.caisse_nom}</span>
                </div>
                {!showClotureInput ? (
                    <button onClick={() => setShowClotureInput(true)} className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center underline">
                        <Lock className="h-4 w-4 mr-1"/> Fermer la caisse
                    </button>
                ) : (
                    <form onSubmit={handleClose} className="flex items-center gap-2 bg-white p-1 rounded border border-red-300 shadow-sm animate-pulse">
                        <input 
                            autoFocus
                            type="number" 
                            step="0.01" 
                            placeholder="Solde compté ?" 
                            className="w-32 p-1 text-sm outline-none font-bold text-red-600"
                            value={montantFermeture}
                            onChange={e => setMontantFermeture(e.target.value)}
                            required
                        />
                        <button className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700">VALIDER</button>
                        <button type="button" onClick={() => setShowClotureInput(false)} className="text-gray-400 hover:text-gray-600 px-1">&times;</button>
                    </form>
                )}
            </div>

            {/* Zone Opérationnelle */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <SoldeCard />
                </div>
                <div className="grid grid-rows-2 gap-4">
                    <button onClick={() => setShowEncaissement(true)} className="bg-white border-2 border-green-50 rounded-xl hover:border-green-500 hover:shadow-md transition flex items-center justify-center p-4 group">
                        <DollarSign className="h-8 w-8 text-green-600 mr-2 group-hover:scale-110 transition-transform"/>
                        <span className="font-bold text-gray-700">ENCAISSER</span>
                    </button>
                    <button onClick={() => setShowDecaissement(true)} className="bg-white border-2 border-red-50 rounded-xl hover:border-red-500 hover:shadow-md transition flex items-center justify-center p-4 group">
                        <LogOut className="h-8 w-8 text-red-600 mr-2 group-hover:scale-110 transition-transform"/>
                        <span className="font-bold text-gray-700">DÉCAISSER</span>
                    </button>
                </div>
            </div>

            <PaymentTerminal onSuccess={refreshStatus} />

            <h3 className="text-lg font-bold text-gray-800 mb-4 mt-8">Journal de Session</h3>
            <JournalTable />
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
        {/* Navbar */}
        <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg"><Activity className="h-6 w-6 text-green-600" /></div>
                <span className="text-xl font-bold text-gray-800">Espace Caisse</span>
            </div>
            <div className="flex items-center space-x-4">
                <p className="text-sm font-medium text-gray-800 hidden sm:block">{user.nom}</p>
                <button onClick={onLogout} className="p-2 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 transition-colors"><LogOut className="h-5 w-5" /></button>
            </div>
        </nav>

        <main className="max-w-5xl mx-auto mt-8 px-4">
            <EncaissementModal isOpen={showEncaissement} onClose={() => setShowEncaissement(false)} onSuccess={refreshStatus} />
            <DecaissementModal isOpen={showDecaissement} onClose={() => setShowDecaissement(false)} onSuccess={refreshStatus} />

            {renderCaisseWidget()}

            <hr className="border-gray-200 mb-8" />
            <MyRequestsWidget />
        </main>
    </div>
  );
}