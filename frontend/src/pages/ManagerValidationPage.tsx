import React, { useEffect, useState } from 'react';
import { Check, X, Banknote, FileText, RefreshCw } from 'lucide-react';
import { RequestBonViewer } from '../components/RequestBonViewer';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';

interface DemandeToValidate {
    id: string;
    titre: string;
    montant: string;
    demandeur: string;
    type: string;
    date: string;
    motif: string;
}

interface OperationToValidate {
    id: string;
    type: string;
    montant: number;
    motif: string;
    date: string;
    caissier: string;
    service: string;
    has_justificatif: boolean;
}

const ManagerValidationPage: React.FC = () => {
    const { t } = useTranslation();
    const [demandes, setDemandes] = useState<DemandeToValidate[]>([]);
    const [operations, setOperations] = useState<OperationToValidate[]>([]);
    const [activeTab, setActiveTab] = useState<'rh' | 'caisse'>('rh');
    const [loading, setLoading] = useState(false);
    const [selectedDemande, setSelectedDemande] = useState<any | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Ouvre le viewer pour une demande (charge le détail complet)
    const handleViewDemande = async (id: string) => {
        setLoadingDetail(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://127.0.0.1:8000/api/demandes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSelectedDemande(await res.json());
            }
        } catch (e) {
            console.error('Erreur chargement détail demande', e);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Ferme le viewer
    const handleCloseViewer = () => {
        setSelectedDemande(null);
    };

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const resDemandes = await fetch('https://127.0.0.1:8000/api/demandes/to-validate', { headers });
            if (resDemandes.ok) setDemandes(await resDemandes.json());

            const resOperations = await fetch('https://127.0.0.1:8000/api/operations/to-validate', { headers });
            if (resOperations.ok) setOperations(await resOperations.json());

        } catch (error) {
            console.error(t("common.error"), error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDemandeAction = async (id: string, action: 'valider' | 'refuser') => {
        const actionText = action === 'valider' ? t("manager.valider") : t("manager.refuser");
        const confirmation = await Swal.fire({
            title: actionText,
            text: t("manager.confirmation_demande", { action: actionText }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: actionText,
            cancelButtonText: 'Annuler',
            confirmButtonColor: action === 'valider' ? '#16a34a' : '#d33'
        });
        if (!confirmation.isConfirmed) return;
        
        const token = localStorage.getItem('token');
        await fetch(`https://127.0.0.1:8000/api/demandes/${id}/workflow`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        fetchData();
    };

    const handleOperationAction = async (id: string, action: 'valider' | 'refuser') => {
        const message = action === 'valider' 
            ? t("manager.confirmation_validation")
            : t("manager.confirmation_refus");
        
        const confirmation = await Swal.fire({
            title: 'Confirmer',
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: action === 'valider' ? t("manager.valider") : t("manager.refuser"),
            cancelButtonText: 'Annuler',
            confirmButtonColor: action === 'valider' ? '#16a34a' : '#d33'
        });
        if (!confirmation.isConfirmed) return;

        const token = localStorage.getItem('token');
        const response = await fetch(`https://127.0.0.1:8000/api/operations/${id}/workflow`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        if (!response.ok) {
            const err = await response.json();
            Swal.fire({
                title: t("manager.erreur_operation"),
                text: err.error || t("common.error"),
                icon: 'error'
            });
        } else {
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t("manager.validation_title")}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t("manager.validation_subtitle")}</p>
                </div>
                <button 
                    onClick={fetchData} 
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" 
                    title={t("manager.refresh")}
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* TABS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('rh')}
                        className={`flex-1 py-3 px-4 flex items-center justify-center font-medium rounded-lg transition-all ${
                            activeTab === 'rh' 
                            ? 'bg-purple-50 text-purple-700 shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <FileText className="mr-2 h-5 w-5" />
                        {t("manager.demandes_rh")}
                        {demandes.length > 0 && (
                            <span className="ml-2 bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                {demandes.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('caisse')}
                        className={`flex-1 py-3 px-4 flex items-center justify-center font-medium rounded-lg transition-all ${
                            activeTab === 'caisse' 
                            ? 'bg-orange-50 text-orange-700 shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <Banknote className="mr-2 h-5 w-5" />
                        {t("manager.operations_caisse")}
                        {operations.length > 0 && (
                            <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {operations.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100 border-dashed">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">{t("common.loading")}</p>
                </div>
            ) : (
                <>
                    {/* RH TAB CONTENT */}
                    {activeTab === 'rh' && (
                        demandes.length === 0 ? (
                            <EmptyState message={t("manager.aucune_demande")} />
                        ) : (
                            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.titre")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.demandeur")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.type")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.motif")}</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t("manager.montant")}</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">{t("common.action")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {demandes.map((d) => (
                                            <tr key={d.id} className="hover:bg-purple-50/40 transition">
                                                <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate" title={d.titre}>{d.titre}</td>
                                                <td className="px-4 py-3 text-gray-700">{d.demandeur}</td>
                                                <td className="px-4 py-3 text-gray-500">{d.type}</td>
                                                <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate" title={d.motif}>{d.motif}</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">{d.montant} <span className="text-xs font-normal text-gray-500">FCFA</span></td>
                                                <td className="px-4 py-3 text-center flex gap-2 justify-center items-center">
                                                    <button onClick={() => handleDemandeAction(d.id, 'refuser')} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title={t("manager.refuser")}> <X size={18}/> </button>
                                                    <button onClick={() => handleDemandeAction(d.id, 'valider')} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors" title={t("manager.valider")}> <Check size={18}/> </button>
                                                    <button onClick={() => handleViewDemande(d.id)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title={t("common.view")}> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* CASH TAB CONTENT */}
                    {activeTab === 'caisse' && (
                        operations.length === 0 ? (
                            <EmptyState message={t("manager.aucune_operation")} />
                        ) : (
                            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.type")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.caissier")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.service")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.motif")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.date")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t("manager.justificatif")}</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t("manager.montant")}</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">{t("common.action")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {operations.map((op) => (
                                            <tr key={op.id} className="hover:bg-orange-50/40 transition">
                                                <td className="px-4 py-3 font-medium text-gray-900 max-w-[120px] truncate" title={op.type}>{op.type}</td>
                                                <td className="px-4 py-3 text-gray-700">{op.caissier}</td>
                                                <td className="px-4 py-3 text-gray-500">{op.service}</td>
                                                <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate" title={op.motif}>{op.motif}</td>
                                                <td className="px-4 py-3 text-gray-400">{op.date}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {op.has_justificatif ? (
                                                        <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium border border-green-100">📎</span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-orange-600">{op.montant.toLocaleString()} <span className="text-xs font-normal text-gray-500">FCFA</span></td>
                                                <td className="px-4 py-3 text-center flex gap-2 justify-center items-center">
                                                    <button onClick={() => handleOperationAction(op.id, 'refuser')} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title={t("manager.refuser")}> <X size={18}/> </button>
                                                    <button onClick={() => handleOperationAction(op.id, 'valider')} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors" title={t("manager.payer")}> <Check size={18}/> </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* Modale viewer demande RH */}
                    {selectedDemande && (
                        <RequestBonViewer demande={selectedDemande} onClose={handleCloseViewer} />
                    )}

                    {/* Loader overlay pour le détail */}
                    {loadingDetail && (
                        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// SUB-COMPONENTS

const EmptyState = ({ message }: { message: string }) => (
    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
        <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">{message}</p>
    </div>
);



export default ManagerValidationPage;