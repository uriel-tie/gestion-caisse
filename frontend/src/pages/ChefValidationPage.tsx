import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { Check, X, Eye } from 'lucide-react';
import { RequestBonViewer } from '../components/RequestBonViewer';

export default function ChefValidationPage() {
    const [demandes, setDemandes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDemande, setSelectedDemande] = useState<any>(null); // Pour le viewer
    const { t, i18n } = useTranslation();

    const fetchDemandes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://127.0.0.1:8000/api/demandes/to-validate', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setDemandes(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDemandes(); }, []);

    // Charger le détail complet pour la modale
    const openDetail = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://127.0.0.1:8000/api/demandes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSelectedDemande(await res.json());
        } catch (e) { Swal.fire(t('common.error'), t('pages.chefValidation.load_error'), 'error'); }
    };

    const handleAction = async (id: string, action: 'valider' | 'refuser') => {
        const result = await Swal.fire({
            title: t('pages.chefValidation.confirm_title'),
            text: t('pages.chefValidation.confirm_text', { action: t(`pages.chefValidation.actions.${action}`) }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('common.yes'),
            cancelButtonText: t('common.no')
        });
        if (!result.isConfirmed) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`https://127.0.0.1:8000/api/demandes/${id}/workflow`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                Swal.fire(t('common.ok'), t('pages.chefValidation.action_success'), 'success');
            } else {
                const data = await res.json();
                Swal.fire(t('common.error'), data.error || t('pages.chefValidation.action_error'), 'error');
            }
        } catch (e) {
            Swal.fire(t('common.error'), t('common.error'), 'error');
        } finally {
            // Fermer la modale si ouverte et rafraichir
            setSelectedDemande(null);
            fetchDemandes();
        }
    }; 

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Check className="mr-2 text-blue-600" /> {t('pages.chefValidation.title')}
            </h1>

            {loading ? (
                <div className="text-center py-10">{t('common.loading')}</div>
            ) : demandes.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Check className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{t('pages.chefValidation.empty_title')}</h3>
                    <p className="text-gray-500">{t('pages.chefValidation.empty_sub')}</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {demandes.map((d) => (
                        <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {d.numeroReference || '---'}
                                </span>
                                <span className="text-xs font-bold text-gray-400">{new Date(d.date).toLocaleString(i18n.language)}</span>
                            </div>
                            
                            <h3 className="font-bold text-gray-900 mb-1 truncate" title={d.titre}>{d.titre}</h3>
                            <p className="text-sm text-blue-600 font-medium mb-4">{d.demandeur}</p>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <span className="font-bold text-lg text-gray-800">{Number(d.montant).toLocaleString(i18n.language)} F</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openDetail(d.id)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                                        title={t('pages.chefValidation.view_request')}
                                    >
                                        <Eye size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleAction(d.id, 'valider')}
                                        className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm"
                                        title={t('pages.chefValidation.validate_button')}
                                    >
                                        <Check size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleAction(d.id, 'refuser')}
                                        className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                                        title={t('pages.chefValidation.refuse_button')}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modale "Bon de Caisse" */}
            {selectedDemande && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                     <RequestBonViewer demande={selectedDemande} onClose={() => setSelectedDemande(null)} />
                     {/* Ajoutons une barre d'action flottante en bas pour valider depuis la modale */}
                     <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 bg-white p-2 rounded-full shadow-2xl z-[60]">
                        <button 
                            onClick={() => handleAction(selectedDemande.id, 'refuser')}
                            className="bg-red-50 text-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-100 transition"
                        >
                            {t('pages.chefValidation.refuse_button')}
                        </button>
                        <button 
                            onClick={() => handleAction(selectedDemande.id, 'valider')}
                            className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition shadow-lg"
                        >
                            {t('pages.chefValidation.modal_validate')}
                        </button>
                     </div>
                </div>
            )}
        </div>
    );
}