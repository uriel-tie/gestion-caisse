import React, { useState, useEffect } from 'react';
import { DollarSign, LogOut, Lock, Unlock, Monitor, Power, AlertCircle, Activity, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import type { UserData } from '../types';
import SoldeCard from '../components/SoldeCard';
import EncaissementModal from '../components/EncaissementModal';
import DecaissementModal from '../components/DecaissementModal';
import { MyRequestsWidget } from '../components/MyRequestsWidget';
import PaymentTerminal from '../components/PaymentTerminal';
import JournalTable from '../components/JournalTable';

// Initialisation de SweetAlert pour React
const MySwal = withReactContent(Swal);

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
  
  // État Clôture (On garde l'input visible pour la saisie rapide)
  const [showClotureInput, setShowClotureInput] = useState(false);
  const [montantFermeture, setMontantFermeture] = useState('');

  const token = localStorage.getItem('token');

  // Helper pour formater les montants
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const refreshStatus = async () => {
    setLoading(true);
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
            setStatusData(data); 
        }
    } catch (e) {
        console.error("Erreur réseau:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { refreshStatus(); }, []);

  // --- ACTION : OUVRIR SESSION (Avec SweetAlert) ---
  const handleOpen = async () => {
    const { value: fond } = await MySwal.fire({
        title: 'Ouverture de Caisse',
        input: 'number',
        inputLabel: 'Montant du fond de caisse initial',
        inputPlaceholder: 'Ex: 0 ou 5000',
        inputValue: 0,
        showCancelButton: true,
        confirmButtonText: 'Ouvrir la session',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#2563eb', // Bleu
        inputValidator: (value) => {
            if (!value || parseFloat(value) < 0) {
                return 'Le montant doit être positif ou nul !';
            }
        }
    });

    if (fond === undefined) return; // Annulé

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
                montant_ouverture: parseFloat(fond) 
            })
        });

        if (!res.ok) {
            const err = await res.json();
            MySwal.fire('Erreur', err.message || "Impossible d'ouvrir la caisse", 'error');
        } else {
            await refreshStatus();
            MySwal.fire({
                icon: 'success',
                title: 'Session Ouverte',
                text: 'Bonne journée de travail !',
                timer: 2000,
                showConfirmButton: false
            });
        }
    } catch (e) {
        MySwal.fire('Erreur', "Erreur réseau lors de l'ouverture", 'error');
    } finally {
        setLoading(false);
    }
  };

  // --- ACTION : FERMER SESSION (Avec Logique Écart + SweetAlert) ---
  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusData?.session_id) return;

    // 1. Calculs Préliminaires
    const physique = parseFloat(montantFermeture || '0');
    const theorique = parseFloat(statusData.solde_actuel || '0');
    const ecart = physique - theorique;
    const hasEcart = Math.abs(ecart) > 0.01;

    // 2. Configuration de la Modale selon l'écart
    let swalConfig: any = {
        showCancelButton: true,
        cancelButtonText: 'Annuler, je recompte',
        focusCancel: hasEcart, // Si écart, on focus sur Annuler par sécurité
    };

    if (hasEcart) {
        // CAS ÉCART : ALERTE ROUGE
        swalConfig = {
            ...swalConfig,
            title: '⚠️ ÉCART DE CAISSE DÉTECTÉ',
            icon: 'warning',
            html: `
                <div class="text-left bg-red-50 p-4 rounded-lg border border-red-200">
                    <p class="mb-2 text-gray-700">Attention, le montant compté ne correspond pas au solde théorique du logiciel.</p>
                    <ul class="text-sm space-y-1">
                        <li>Solde Théorique : <strong>${formatMoney(theorique)}</strong></li>
                        <li>Solde Physique : <strong>${formatMoney(physique)}</strong></li>
                        <li class="text-red-600 font-bold text-lg mt-2 pt-2 border-t border-red-200">
                            Écart : ${ecart > 0 ? '+' : ''}${formatMoney(ecart)}
                        </li>
                    </ul>
                    <p class="mt-4 text-xs text-red-500 font-semibold uppercase">Confirmer la fermeture enregistrera cet écart comptable.</p>
                </div>
            `,
            confirmButtonText: 'Oui, fermer avec écart',
            confirmButtonColor: '#dc2626', // Rouge
        };
    } else {
        // CAS OK : VALIDATION VERTE
        swalConfig = {
            ...swalConfig,
            title: 'Confirmation de clôture',
            icon: 'question',
            html: `
                <div class="text-center">
                    <p class="text-green-600 font-bold text-xl mb-2">Aucun écart constaté ! ✅</p>
                    <p class="text-gray-600">
                        Solde de clôture : <strong>${formatMoney(physique)}</strong>
                    </p>
                    <p class="text-sm text-gray-500 mt-4">Voulez-vous terminer votre session ?</p>
                </div>
            `,
            confirmButtonText: 'Oui, clôturer la caisse',
            confirmButtonColor: '#10b981', // Vert
        };
    }

    // 3. Affichage de la modale
    const result = await MySwal.fire(swalConfig);

    // 4. Traitement si confirmé
    if (result.isConfirmed) {
        try {
            const res = await fetch(`https://127.0.0.1:8000/api/sessions/${statusData.session_id}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ montant_physique: physique })
            });

            const apiData = await res.json();

            if (res.ok) {
                await MySwal.fire({
                    icon: 'success',
                    title: 'Session Clôturée',
                    text: `La caisse est fermée.${hasEcart ? ` Un écart de ${formatMoney(ecart)} a été enregistré.` : ''}`,
                });
                window.location.reload();
            } else {
                // Gestion erreur spécifique (ex: justificatifs manquants)
                if (apiData.code_erreur === 'MISSING_PROOFS') {
                     MySwal.fire({
                         icon: 'error',
                         title: 'Clôture Bloquée',
                         html: `
                            <p>Vous ne pouvez pas fermer la caisse.</p>
                            <p class="font-bold text-red-600 mt-2">${apiData.message}</p>
                            <p class="text-sm mt-2">Veuillez justifier les opérations en attente.</p>
                         `
                     });
                } else {
                     MySwal.fire('Erreur', apiData.message || "Erreur inconnue lors de la fermeture", 'error');
                }
            }
        } catch (e) {
            console.error(e);
            MySwal.fire('Erreur', "Problème de connexion au serveur", 'error');
        }
    }
  };

  // --- RENDU DU WIDGET "STATION DE TRAVAIL" ---
  const renderCaisseWidget = () => {
    if (loading) return <div className="h-40 bg-gray-100 rounded-xl animate-pulse mb-8"></div>;

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

    if (statusData.session_status !== 'OUVERTE') {
        return (
            <div className="bg-white border-l-4 border-blue-500 rounded-xl p-6 mb-8 shadow-sm flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Monitor className="mr-2 h-5 w-5 text-blue-600"/> 
                        {statusData.caisse_nom}
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
                    <button onClick={() => setShowClotureInput(true)} className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center underline transition-colors">
                        <Lock className="h-4 w-4 mr-1"/> Fermer la caisse
                    </button>
                ) : (
                    <form onSubmit={handleClose} className="flex items-center gap-2 bg-white p-1 rounded border border-red-300 shadow-sm animate-in slide-in-from-right-5">
                        <input 
                            autoFocus
                            type="number" 
                            step="0.01" 
                            placeholder="Solde compté ?" 
                            className="w-32 p-1 text-sm outline-none font-bold text-red-600 placeholder-red-200"
                            value={montantFermeture}
                            onChange={e => setMontantFermeture(e.target.value)}
                            required
                        />
                        <button className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700 transition-colors">VÉRIFIER</button>
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