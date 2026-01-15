import React, { useEffect, useState } from 'react';
import { Check, X, Banknote, FileText, AlertCircle, RefreshCw } from 'lucide-react';
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
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {demandes.map((d) => (
                                    <CardRH key={d.id} data={d} onAction={handleDemandeAction} />
                                ))}
                            </div>
                        )
                    )}

                    {/* CASH TAB CONTENT */}
                    {activeTab === 'caisse' && (
                        operations.length === 0 ? (
                            <EmptyState message={t("manager.aucune_operation")} />
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {operations.map((op) => (
                                    <CardOperation key={op.id} data={op} onAction={handleOperationAction} />
                                ))}
                            </div>
                        )
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

const CardRH = ({ data, onAction }: { data: DemandeToValidate, onAction: (id: string, action: 'valider' | 'refuser') => void }) => {
    const { t } = useTranslation();
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-900 line-clamp-1" title={data.titre}>{data.titre}</h3>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">{data.type}</span>
            </div>
            
            <div className="mb-4 flex-1">
                <p className="text-xs text-gray-500 mb-1">{t("manager.demandeur")}</p>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                        {data.demandeur.charAt(0)}
                    </span>
                    {data.demandeur}
                </p>
                
                <p className="text-xs text-gray-500 mb-1">{t("manager.motif")}</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 line-clamp-3 min-h-[4rem]">
                    {data.motif || "Aucune description fournie."}
                </p>
            </div>

            <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400">{t("manager.montant")}</p>
                    <span className="font-bold text-lg text-gray-900">{data.montant} <span className="text-xs font-normal text-gray-500">FCFA</span></span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onAction(data.id, 'refuser')} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title={t("manager.refuser")}>
                        <X size={20}/>
                    </button>
                    <button onClick={() => onAction(data.id, 'valider')} className="py-2 px-4 bg-purple-600 text-white hover:bg-purple-700 rounded-lg flex items-center text-sm font-medium transition-colors shadow-sm shadow-purple-200">
                        <Check size={16} className="mr-2"/> {t("manager.valider")}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CardOperation = ({ data, onAction }: { data: OperationToValidate, onAction: (id: string, action: 'valider' | 'refuser') => void }) => {
    const { t } = useTranslation();
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            
            <div className="flex justify-between items-start mb-3 pl-2">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500"/>
                    {data.type}
                </h3>
                <span className="text-xs text-gray-400">{data.date}</span>
            </div>
            
            <div className="mb-4 flex-1 pl-2">
                <div className="flex justify-between items-center mb-3">
                     <div>
                        <p className="text-xs text-gray-500">{t("manager.caissier")}</p>
                        <p className="text-sm font-medium text-gray-800">{data.caissier}</p>
                     </div>
                     {data.has_justificatif && (
                        <span className="bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded-full font-medium border border-green-100">
                            📎 {t("manager.justificatif")}
                        </span>
                     )}
                </div>

                <p className="text-sm text-gray-600 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100 italic">
                    "{data.motif}"
                </p>
            </div>
            
            <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between pl-2">
                <div>
                    <p className="text-xs text-gray-400">{t("manager.montant")}</p>
                    <span className="font-bold text-xl text-orange-600">{data.montant.toLocaleString()} <span className="text-xs font-normal text-gray-500">FCFA</span></span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onAction(data.id, 'refuser')} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title={t("manager.refuser")}>
                        <X size={20}/>
                    </button>
                    <button onClick={() => onAction(data.id, 'valider')} className="py-2 px-4 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center text-sm font-medium transition-colors shadow-sm shadow-green-200">
                        <Check size={16} className="mr-2"/> {t("manager.payer")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagerValidationPage;