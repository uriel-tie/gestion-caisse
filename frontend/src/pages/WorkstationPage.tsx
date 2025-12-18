import React, { useState, useEffect } from 'react';
import { 
    DollarSign, LogOut, Lock, Power, AlertCircle, Monitor, 
    ArrowDownLeft, Check, Send, ArrowRightLeft, X 
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import { transfertService } from '../services/transfert.service';
import { type Transfert, type UserData } from '../types';

import SoldeCard from '../components/SoldeCard';
import EncaissementModal from '../components/EncaissementModal';
import DecaissementModal from '../components/DecaissementModal';
import PaymentTerminal from '../components/PaymentTerminal';
import MiniJournal from '../components/MiniJournal';
import TransfertSendModal from '../components/TransfertSendModal';
import BilletageModal from '../components/BilletageModal'; // Import du nouveau composant

const MySwal = withReactContent(Swal);

interface WorkstationProps {
    user: UserData;
}

export default function WorkstationPage({ user }: WorkstationProps) {
    const [statusData, setStatusData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [incomingTransferts, setIncomingTransferts] = useState<Transfert[]>([]);

    // Modales
    const [showEncaissement, setShowEncaissement] = useState(false);
    const [showDecaissement, setShowDecaissement] = useState(false);
    const [showTransfertModal, setShowTransfertModal] = useState(false);
    const [showBilletage, setShowBilletage] = useState(false); // État pour le billetage

    const token = localStorage.getItem('token');

    // --- CHARGEMENT DES DONNÉES ---
    const refreshStatus = async () => {
        try {
            const res = await fetch('https://127.0.0.1:8000/api/caisses/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setStatusData(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const checkIncoming = async () => {
        try {
            const list = await transfertService.getIncoming();
            setIncomingTransferts(list);
        } catch (e) {
            console.error("Erreur chargement transferts", e);
        }
    };

    useEffect(() => {
        refreshStatus();
        checkIncoming();
        const interval = setInterval(checkIncoming, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- ACTIONS TRANSFERTS ---
    const handleAcceptTransfert = async (id: string) => {
        const result = await MySwal.fire({
            title: 'Réception de Fonds',
            text: "Confirmez-vous avoir physiquement reçu cet argent ?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Oui, accepter',
            confirmButtonColor: '#10b981'
        });

        if (!result.isConfirmed) return;

        try {
            await transfertService.accept(id);
            const Toast = MySwal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            Toast.fire({ icon: 'success', title: 'Fonds ajoutés à la caisse !' });
            checkIncoming();
            refreshStatus();
        } catch (e) {
            MySwal.fire('Erreur', "Impossible de valider le transfert.", 'error');
        }
    };

    const handleRejectTransfert = async (id: string) => {
        const { value: motif } = await MySwal.fire({
            title: 'Refuser le transfert',
            input: 'text',
            inputLabel: 'Motif du refus',
            inputPlaceholder: 'Ex: Erreur de montant, Destinataire incorrect...',
            showCancelButton: true,
            confirmButtonText: 'Refuser et Renvoyer',
            confirmButtonColor: '#dc2626',
            inputValidator: (value) => {
                if (!value) return 'Le motif est obligatoire pour un refus !';
            }
        });

        if (motif) {
            try {
                await transfertService.reject(id, motif);
                MySwal.fire('Refusé', "Les fonds ont été renvoyés à l'expéditeur.", 'success');
                checkIncoming();
                refreshStatus();
            } catch (e) {
                MySwal.fire('Erreur', "Impossible de rejeter le transfert.", 'error');
            }
        }
    };

    // --- ACTIONS CAISSE ---
    const handleOpen = async () => {
        const soldeActuel = parseFloat(statusData?.solde_actuel || '0');
        let montantOuverture = 0;

        if (soldeActuel > 0) {
            const result = await MySwal.fire({
                title: 'Reprise de Caisse',
                html: `<p>Il reste <b>${soldeActuel.toLocaleString()} FCFA</b> en caisse.</p>`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Oui, ouvrir',
                confirmButtonColor: '#2563eb'
            });
            if (!result.isConfirmed) return;
            montantOuverture = soldeActuel;
        } else {
            const { value: fond } = await MySwal.fire({
                title: 'Ouverture de Caisse',
                input: 'number',
                inputLabel: 'Montant du fond de caisse initial',
                inputValue: 0,
                showCancelButton: true
            });
            if (fond === undefined) return;
            montantOuverture = parseFloat(fond);
        }

        setLoading(true);
        try {
            const res = await fetch('https://127.0.0.1:8000/api/sessions/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ caisse_id: statusData.caisse_id, montant_ouverture: montantOuverture })
            });

            if (res.ok) {
                await refreshStatus();
                MySwal.fire({ icon: 'success', title: 'Caisse Ouverte', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
            } else {
                const err = await res.json();
                MySwal.fire('Erreur', err.message, 'error');
            }
        } catch (e) {
            MySwal.fire('Erreur', "Erreur réseau", 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fonction appelée quand le modal billetage valide
    const handleBilletageSubmit = async (billetage: Record<string, number>, totalCalcul: number) => {
        setShowBilletage(false);

        const theorique = parseFloat(statusData?.solde_actuel || '0');
        const ecart = totalCalcul - theorique;

        const result = await MySwal.fire({
            title: Math.abs(ecart) > 5 ? '⚠️ ÉCART DÉTECTÉ' : 'Confirmer la clôture',
            html: `
                <div class="text-left bg-gray-50 p-4 rounded text-sm">
                    <p>Solde Théorique: <b>${theorique.toLocaleString()} F</b></p>
                    <p>Solde Compté: <b>${totalCalcul.toLocaleString()} F</b></p>
                    <hr class="my-2"/>
                    <p>Écart: <b style="color:${ecart !== 0 ? (ecart < 0 ? 'red' : 'orange') : 'green'}">${ecart.toLocaleString()} F</b></p>
                </div>
            `,
            icon: Math.abs(ecart) > 5 ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: 'Clôturer définitivement',
            confirmButtonColor: Math.abs(ecart) > 5 ? '#dc2626' : '#10b981',
            cancelButtonText: 'Recompter'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const res = await fetch(`https://127.0.0.1:8000/api/sessions/${statusData.session_id}/close`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ 
                        montant_physique: totalCalcul, // Le backend recalculera pour vérifier
                        billetage: billetage 
                    })
                });

                if (res.ok) {
                    await MySwal.fire('Succès', 'Caisse fermée avec succès.', 'success');
                    window.location.reload();
                } else {
                    const err = await res.json();
                    MySwal.fire('Erreur', err.message, 'error');
                }
            } catch (e) {
                MySwal.fire('Erreur', "Erreur réseau", 'error');
            } finally {
                setLoading(false);
            }
        } else {
            setShowBilletage(true); // Réouvrir si on veut recompter
        }
    };

    // --- RENDU ---
    if (loading) return <div className="h-screen flex items-center justify-center text-blue-600 animate-pulse">Chargement...</div>;

    if (!statusData?.has_caisse) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-800 shadow-sm">
                <AlertCircle size={40} />
                <div>
                    <h2 className="font-bold text-xl">Aucune caisse assignée</h2>
                    <p className="mt-1">Contactez votre manager.</p>
                </div>
            </div>
        );
    }

    if (statusData.session_status !== 'OUVERTE') {
        return (
            <div className="max-w-4xl mx-auto mt-20">
                <div className="bg-slate-900 text-white rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
                    <Monitor className="mx-auto mb-6 text-slate-700" size={80} />
                    <h1 className="text-4xl font-bold mb-3">{statusData.caisse_nom}</h1>
                    <p className="text-slate-400 mb-10 text-lg">Session inactive</p>
                    <button onClick={handleOpen} className="bg-blue-600 px-8 py-4 font-bold text-white rounded-full hover:bg-blue-500 shadow-lg flex items-center justify-center gap-3 mx-auto transition">
                        <Power size={24} /> OUVRIR MA SESSION
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-2">
            
            {/* Header Station */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Monitor size={24}/>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{statusData.caisse_nom}</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Session Active</span>
                        </div>
                    </div>
                </div>

                {/* BOUTON FERMER SESSION (Ouvre le Billetage) */}
                <button 
                    onClick={() => setShowBilletage(true)} 
                    className="bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center transition border border-transparent hover:border-red-200"
                >
                    <Lock size={16} className="mr-2"/> Fermer la Caisse
                </button>
            </div>

            {/* Notifications Transferts */}
            {incomingTransferts.length > 0 && (
                <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4 text-lg">
                        <ArrowDownLeft size={20}/> Fonds en attente ({incomingTransferts.length})
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {incomingTransferts.map(t => (
                            <div key={t.id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 flex flex-col justify-between">
                                <div className="mb-3">
                                    <div className="font-black text-2xl text-gray-800">{parseFloat(t.montant.toString()).toLocaleString()} F</div>
                                    <p className="text-xs text-gray-500 mt-1">De: {t.source}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRejectTransfert(t.id)} className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center justify-center gap-2"><X size={16}/> REFUSER</button>
                                    <button onClick={() => handleAcceptTransfert(t.id)} className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center justify-center gap-2"><Check size={16}/> ACCEPTER</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions & Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <SoldeCard />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={() => setShowEncaissement(true)} className="h-32 bg-white border border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50/30 transition-all flex flex-col items-center justify-center shadow-sm">
                            <div className="bg-green-100 p-3 rounded-full mb-3"><DollarSign className="text-green-600" size={28} /></div>
                            <span className="font-bold text-gray-700">ENCAISSER</span>
                        </button>
                        <button onClick={() => setShowDecaissement(true)} className="h-32 bg-white border border-gray-200 rounded-2xl hover:border-red-500 hover:bg-red-50/30 transition-all flex flex-col items-center justify-center shadow-sm">
                            <div className="bg-red-100 p-3 rounded-full mb-3"><LogOut className="text-red-600" size={28} /></div>
                            <span className="font-bold text-gray-700">DÉCAISSER</span>
                        </button>
                        <button onClick={() => setShowTransfertModal(true)} className="h-32 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center shadow-sm">
                            <div className="bg-blue-100 p-3 rounded-full mb-3"><ArrowRightLeft className="text-blue-600" size={28} /></div>
                            <span className="font-bold text-gray-700">TRANSFÉRER</span>
                        </button>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Send size={18} className="text-gray-400"/> Opération Rapide</h3>
                        <PaymentTerminal onSuccess={refreshStatus} />
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <MiniJournal />
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Détails Session</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Ouverture</span><span className="font-mono font-medium text-slate-800">{statusData.date_ouverture ? new Date(statusData.date_ouverture).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Fond Initial</span><span className="font-mono font-medium text-slate-800">{parseFloat(statusData.montant_ouverture).toLocaleString()} F</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">ID Session</span><span className="font-mono text-xs text-slate-400 truncate max-w-[100px]">{statusData.session_id}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales */}
            <EncaissementModal isOpen={showEncaissement} onClose={() => setShowEncaissement(false)} onSuccess={refreshStatus} />
            <DecaissementModal isOpen={showDecaissement} onClose={() => setShowDecaissement(false)} onSuccess={refreshStatus} />
            <TransfertSendModal isOpen={showTransfertModal} onClose={() => setShowTransfertModal(false)} onSuccess={() => { refreshStatus(); MySwal.fire({ icon: 'success', title: 'Transfert envoyé !', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 }); }} />
            <BilletageModal isOpen={showBilletage} onClose={() => setShowBilletage(false)} onSubmit={handleBilletageSubmit} />
        </div>
    );
}