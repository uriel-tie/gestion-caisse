import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

export default function WorkstationPage(_props: WorkstationProps) {
    const [statusData, setStatusData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [incomingTransferts, setIncomingTransferts] = useState<Transfert[]>([]);

    // Modales
    const [showEncaissement, setShowEncaissement] = useState(false);
    const [showDecaissement, setShowDecaissement] = useState(false);
    const [showTransfertModal, setShowTransfertModal] = useState(false);
    const [showBilletage, setShowBilletage] = useState(false); // État pour le billetage

    const token = localStorage.getItem('token');
    const { t } = useTranslation();

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
            title: t('pages.workstation.receive_title'),
            text: t('pages.workstation.receive_confirm_text'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('pages.workstation.accept_confirm'),
            confirmButtonColor: '#10b981'
        });

        if (!result.isConfirmed) return;

        try {
            await transfertService.accept(id);
            const Toast = MySwal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            Toast.fire({ icon: 'success', title: t('pages.workstation.funds_added') });
            checkIncoming();
            refreshStatus();
        } catch (e) {
            MySwal.fire(t('common.error'), t('pages.workstation.transfert_error'), 'error');
        }
    };

    const handleRejectTransfert = async (id: string) => {
        const { value: motif } = await MySwal.fire({
            title: t('pages.workstation.reject_transfer_title'),
            input: 'text',
            inputLabel: t('pages.workstation.reject_input_label'),
            inputPlaceholder: t('pages.workstation.reject_placeholder'),
            showCancelButton: true,
            confirmButtonText: t('pages.workstation.reject_confirm'),
            confirmButtonColor: '#dc2626',
            inputValidator: (value) => {
                if (!value) return t('pages.workstation.reject_input_required');
            }
        });

        if (motif) {
            try {
                await transfertService.reject(id, motif);
                MySwal.fire(t('pages.workstation.rejected_success_title'), t('pages.workstation.rejected_success_sub'), 'success');
                checkIncoming();
                refreshStatus();
            } catch (e) {
                MySwal.fire(t('common.error'), t('pages.workstation.transfert_error'), 'error');
            }
        }
    };

    // --- ACTIONS CAISSE ---
    const handleOpen = async () => {
        const soldeActuel = parseFloat(statusData?.solde_actuel || '0');
        let montantOuverture = 0;

        if (soldeActuel > 0) {
            const result = await MySwal.fire({
                title: t('pages.workstation.reprise_title'),
                html: t('pages.workstation.open_confirm_html', { solde: soldeActuel.toLocaleString(), currency: t('common.currency') }),
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: t('pages.workstation.open_confirm_yes'),
                confirmButtonColor: '#2563eb'
            });
            if (!result.isConfirmed) return;
            montantOuverture = soldeActuel;
        } else {
            const { value: fond } = await MySwal.fire({
                title: t('pages.workstation.opening_title'),
                input: 'number',
                inputLabel: t('pages.workstation.initial_fund'),
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
                MySwal.fire({ icon: 'success', title: t('pages.workstation.cash_opened'), toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
            } else {
                const err = await res.json();
                MySwal.fire(t('common.error'), err.message, 'error');
            }
        } catch (e) {
            MySwal.fire(t('common.error'), t('pages.workstation.network_error'), 'error');
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
            title: Math.abs(ecart) > 5 ? t('pages.workstation.difference_alert_title') : t('pages.workstation.confirm_closure'),
            html: `
                <div class="text-left bg-gray-50 p-4 rounded text-sm">
                    <p>${t('pages.workstation.theoretical_balance')}: <b>${theorique.toLocaleString()} ${t('common.currency')}</b></p>
                    <p>${t('pages.workstation.counted_balance')}: <b>${totalCalcul.toLocaleString()} ${t('common.currency')}</b></p>
                    <hr class="my-2"/>
                    <p>${t('pages.workstation.difference')}: <b style="color:${ecart !== 0 ? (ecart < 0 ? 'red' : 'orange') : 'green'}">${ecart.toLocaleString()} ${t('common.currency')}</b></p>
                </div>
            `,
            icon: Math.abs(ecart) > 5 ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: t('pages.workstation.close_confirm'),
            confirmButtonColor: Math.abs(ecart) > 5 ? '#dc2626' : '#10b981',
            cancelButtonText: t('pages.workstation.recount')
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
                    await MySwal.fire(t('common.ok'), t('pages.workstation.cash_closed_success'), 'success');
                    window.location.reload();
                } else {
                    const err = await res.json();
                    MySwal.fire(t('common.error'), err.message, 'error');
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
    if (loading) return <div className="h-screen flex items-center justify-center text-blue-600 animate-pulse">{t('common.loading')}</div>; 

    if (!statusData?.has_caisse) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-800 shadow-sm">
                <AlertCircle size={40} />
                <div>
                    <h2 className="font-bold text-xl">{t('pages.workstation.no_cash_assigned')}</h2>
                    <p className="mt-1">{t('pages.workstation.contact_manager')}</p>
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
                    <p className="text-slate-400 mb-10 text-lg">{t('pages.workstation.session_inactive')}</p>
                    <button onClick={handleOpen} className="bg-blue-600 px-8 py-4 font-bold text-white rounded-full hover:bg-blue-500 shadow-lg flex items-center justify-center gap-3 mx-auto transition">
                        <Power size={24} /> {t('pages.workstation.open_session')}
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
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('pages.workstation.session_active')}</span>
                        </div>
                    </div>
                </div>

                {/* BOUTON FERMER SESSION (Ouvre le Billetage) */}
                <button 
                    onClick={() => setShowBilletage(true)} 
                    className="bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center transition border border-transparent hover:border-red-200"
                >
                    <Lock size={16} className="mr-2"/> {t('pages.workstation.close_cash')}
                </button>
            </div>

            {/* Notifications Transferts */}
            {incomingTransferts.length > 0 && (
                <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4 text-lg">
                        <ArrowDownLeft size={20}/> {t('pages.workstation.pending_funds')} ({incomingTransferts.length})
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {incomingTransferts.map(tr => (
                            <div key={tr.id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 flex flex-col justify-between">
                                <div className="mb-3">
                                    <div className="font-black text-2xl text-gray-800">{parseFloat(tr.montant.toString()).toLocaleString()} {t('common.currency')}</div>
                                    <p className="text-xs text-gray-500 mt-1">{t('pages.workstation.from')}: {tr.source}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRejectTransfert(tr.id)} className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center justify-center gap-2"><X size={16}/> {t('pages.workstation.reject')}</button>
                                    <button onClick={() => handleAcceptTransfert(tr.id)} className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center justify-center gap-2"><Check size={16}/> {t('pages.workstation.accept')}</button>
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
                            <span className="font-bold text-gray-700">{t('pages.workstation.encaisser')}</span>
                        </button>
                        <button onClick={() => setShowDecaissement(true)} className="h-32 bg-white border border-gray-200 rounded-2xl hover:border-red-500 hover:bg-red-50/30 transition-all flex flex-col items-center justify-center shadow-sm">
                            <div className="bg-red-100 p-3 rounded-full mb-3"><LogOut className="text-red-600" size={28} /></div>
                            <span className="font-bold text-gray-700">{t('pages.workstation.decaisser')}</span>
                        </button>
                        <button onClick={() => setShowTransfertModal(true)} className="h-32 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center shadow-sm">
                            <div className="bg-blue-100 p-3 rounded-full mb-3"><ArrowRightLeft className="text-blue-600" size={28} /></div>
                            <span className="font-bold text-gray-700">{t('pages.workstation.transfer')}</span>
                        </button>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Send size={18} className="text-gray-400"/> {t('pages.workstation.quick_operation')}</h3>
                        <PaymentTerminal onSuccess={refreshStatus} />
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <MiniJournal />
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">{t('pages.workstation.details_session')}</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">{t('pages.workstation.opening')}</span><span className="font-mono font-medium text-slate-800">{statusData.date_ouverture ? new Date(statusData.date_ouverture).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">{t('pages.workstation.initial_fund')}</span><span className="font-mono font-medium text-slate-800">{parseFloat(statusData.montant_ouverture).toLocaleString()} {t('common.currency')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">{t('pages.workstation.session_id')}</span><span className="font-mono text-xs text-slate-400 truncate max-w-[100px]">{statusData.session_id}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales */}
            <EncaissementModal isOpen={showEncaissement} onClose={() => setShowEncaissement(false)} onSuccess={refreshStatus} />
            <DecaissementModal isOpen={showDecaissement} onClose={() => setShowDecaissement(false)} onSuccess={refreshStatus} />
            <TransfertSendModal isOpen={showTransfertModal} onClose={() => setShowTransfertModal(false)} onSuccess={() => { refreshStatus(); MySwal.fire({ icon: 'success', title: t('pages.workstation.transfer_sent'), toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 }); }} />
            <BilletageModal isOpen={showBilletage} onClose={() => setShowBilletage(false)} onSubmit={handleBilletageSubmit} />
        </div>
    );
}