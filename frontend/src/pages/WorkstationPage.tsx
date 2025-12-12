import React, { useState, useEffect } from 'react';
import { DollarSign, LogOut, Lock, Unlock, Power, AlertCircle, Monitor } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import type { UserData } from '../types';
import SoldeCard from '../components/SoldeCard';
import EncaissementModal from '../components/EncaissementModal';
import DecaissementModal from '../components/DecaissementModal';
import PaymentTerminal from '../components/PaymentTerminal';
import MiniJournal from '../components/MiniJournal';

const MySwal = withReactContent(Swal);

interface WorkstationProps {
    user: UserData;
}

export default function WorkstationPage({ user }: WorkstationProps) {
    const [statusData, setStatusData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modales
    const [showEncaissement, setShowEncaissement] = useState(false);
    const [showDecaissement, setShowDecaissement] = useState(false);
    const [showClotureInput, setShowClotureInput] = useState(false);
    const [montantFermeture, setMontantFermeture] = useState('');

    const token = localStorage.getItem('token');

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

    useEffect(() => { refreshStatus(); }, []);

    // --- ACTIONS (Copie nettoyée de l'ancien Dashboard) ---
    const handleOpen = async () => {
        // On récupère le solde actuel connu par le système
        const soldeActuel = parseFloat(statusData?.solde_actuel || '0');
        let montantOuverture = 0;

        if (soldeActuel > 0) {
            // CAS 1 : Il y a déjà de l'argent (Reliquat)
            // On demande juste confirmation, pas de saisie
            const result = await MySwal.fire({
                title: 'Reprise de Caisse',
                html: `
                    <p>Il reste <b>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(soldeActuel)}</b> en caisse.</p>
                    <p class="text-sm text-gray-500 mt-2">Le fond de caisse sera initialisé avec ce montant.</p>
                `,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Oui, ouvrir la session',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#2563eb'
            });

            if (!result.isConfirmed) return;
            montantOuverture = soldeActuel;

        } else {
            // CAS 2 : La caisse est vide (0)
            // On demande le montant du fond de caisse initial
            const { value: fond } = await MySwal.fire({
                title: 'Ouverture de Caisse',
                input: 'number',
                inputLabel: 'Montant du fond de caisse initial',
                inputPlaceholder: 'Ex: 5000',
                inputValue: 0,
                showCancelButton: true,
                confirmButtonText: 'Ouvrir la session',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#2563eb',
                inputValidator: (value) => {
                    if (!value || parseFloat(value) < 0) {
                        return 'Le montant doit être positif ou nul !';
                    }
                }
            });

            if (fond === undefined) return; // Annulé
            montantOuverture = parseFloat(fond);
        }

        // Appel API commun
        setLoading(true);
        try {
            const res = await fetch('https://127.0.0.1:8000/api/sessions/open', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    caisse_id: statusData.caisse_id, 
                    montant_ouverture: montantOuverture 
                })
            });

            if (!res.ok) {
                const err = await res.json();
                MySwal.fire('Erreur', err.message || "Impossible d'ouvrir la caisse", 'error');
            } else {
                await refreshStatus();
                const Toast = MySwal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                Toast.fire({
                    icon: 'success',
                    title: 'Session ouverte avec succès'
                });
            }
        } catch (e) {
            MySwal.fire('Erreur', "Erreur réseau lors de l'ouverture", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async (e: React.FormEvent) => {
        e.preventDefault();
        const physique = parseFloat(montantFermeture || '0');
        const theorique = parseFloat(statusData?.solde_actuel || '0');
        const ecart = physique - theorique;

        const confirmed = await MySwal.fire({
            title: Math.abs(ecart) > 0.01 ? '⚠️ ÉCART DÉTECTÉ' : 'Confirmation',
            html: `Solde théorique: <b>${theorique}</b><br/>Solde compté: <b>${physique}</b><br/>Écart: <b style="color:${ecart!==0?'red':'green'}">${ecart}</b>`,
            icon: Math.abs(ecart) > 0.01 ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: 'Clôturer la session',
            confirmButtonColor: Math.abs(ecart) > 0.01 ? '#dc2626' : '#10b981'
        });

        if (confirmed.isConfirmed) {
            await fetch(`https://127.0.0.1:8000/api/sessions/${statusData.session_id}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ montant_physique: physique })
            });
            window.location.reload();
        }
    };

    // --- RENDU ---
    if (loading) return <div className="p-10 text-center">Chargement de la caisse...</div>;

    if (!statusData?.has_caisse) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-800">
                <AlertCircle size={32} />
                <div>
                    <h2 className="font-bold text-lg">Aucune caisse assignée</h2>
                    <p>Demandez à votre manager de vous attribuer un poste de travail.</p>
                </div>
            </div>
        );
    }

    // SESSION FERMÉE
    if (statusData.session_status !== 'OUVERTE') {
        return (
            <div className="max-w-4xl mx-auto mt-10">
                <div className="bg-slate-900 text-white rounded-2xl p-10 text-center shadow-2xl">
                    <Monitor className="mx-auto mb-6 opacity-50" size={64} />
                    <h1 className="text-3xl font-bold mb-2">{statusData.caisse_nom}</h1>
                    <p className="text-slate-400 mb-8">La caisse est actuellement fermée.</p>
                    <button 
                        onClick={handleOpen}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-blue-500/50 transition transform hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto"
                    >
                        <Power size={24} /> OUVRIR MA SESSION
                    </button>
                </div>
            </div>
        );
    }

    // SESSION OUVERTE (WORKSTATION)
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Station */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Monitor className="mr-3 text-blue-600" /> Station de Travail
                    </h1>
                    <div className="flex items-center mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        <span className="text-sm text-gray-500 font-medium">{statusData.caisse_nom} — Session active</span>
                    </div>
                </div>

                {!showClotureInput ? (
                    <button 
                        onClick={() => setShowClotureInput(true)} 
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-bold text-sm flex items-center transition"
                    >
                        <Lock size={16} className="mr-2"/> Fermer la Caisse
                    </button>
                ) : (
                    <form onSubmit={handleClose} className="flex items-center gap-2 bg-white p-1 rounded-lg border border-red-200 shadow-lg animate-in fade-in slide-in-from-right-4">
                        <input 
                            autoFocus type="number" step="0.01" 
                            placeholder="Solde compté ?" 
                            className="w-32 p-2 text-sm outline-none font-bold text-red-600 bg-transparent"
                            value={montantFermeture} onChange={e => setMontantFermeture(e.target.value)}
                            required
                        />
                        <button className="bg-red-600 text-white px-3 py-2 rounded-md text-xs font-bold hover:bg-red-700">VALIDER</button>
                        <button type="button" onClick={() => setShowClotureInput(false)} className="px-2 text-gray-400 hover:text-gray-600">&times;</button>
                    </form>
                )}
            </div>

            {/* Grille Principale */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Colonne Gauche : Solde & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <SoldeCard />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setShowEncaissement(true)}
                            className="h-32 bg-white border-2 border-green-50 rounded-2xl hover:border-green-500 hover:shadow-lg hover:shadow-green-100 transition group flex flex-col items-center justify-center"
                        >
                            <div className="bg-green-100 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                <DollarSign className="text-green-600" size={32} />
                            </div>
                            <span className="font-bold text-gray-700">ENCAISSER</span>
                        </button>

                        <button 
                            onClick={() => setShowDecaissement(true)}
                            className="h-32 bg-white border-2 border-red-50 rounded-2xl hover:border-red-500 hover:shadow-lg hover:shadow-red-100 transition group flex flex-col items-center justify-center"
                        >
                            <div className="bg-red-100 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                <LogOut className="text-red-600" size={32} />
                            </div>
                            <span className="font-bold text-gray-700">DÉCAISSER</span>
                        </button>
                    </div>

                    {/* Terminal de paiement rapide */}
                    <PaymentTerminal onSuccess={refreshStatus} />
                </div>

                {/* Colonne Droite : Mini Journal */}
                <div className="lg:col-span-1">
                    <MiniJournal />
                    
                    {/* Carte Info Session */}
                    <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-100">
                        <h4 className="font-bold text-blue-900 text-sm mb-3">Info Session</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-blue-700">Ouverture</span>
                                <span className="font-mono font-medium">{new Date(statusData.date_ouverture).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-700">Fond Initial</span>
                                <span className="font-mono font-medium">{statusData.montant_ouverture} F</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales invisibles */}
            <EncaissementModal isOpen={showEncaissement} onClose={() => setShowEncaissement(false)} onSuccess={refreshStatus} />
            <DecaissementModal isOpen={showDecaissement} onClose={() => setShowDecaissement(false)} onSuccess={refreshStatus} />
        </div>
    );
}