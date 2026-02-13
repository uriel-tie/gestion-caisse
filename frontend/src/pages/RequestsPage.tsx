import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Copy, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RequestBonViewer } from '../components/RequestBonViewer';

export default function RequestsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [demandes, setDemandes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDemande, setSelectedDemande] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    
    // États pour la pagination et les filtres
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 6,
        total: 0,
        pages: 0
    });
    const [filters, setFilters] = useState({
        statut: 'all',
        periode: 'all',
        dateDebut: '',
        dateFin: '',
        sort: 'createdAt',
        order: 'DESC'
    });
    const [showFilters, setShowFilters] = useState(false);

    // Fetch avec pagination et filtres
    const fetchDemandes = async (page = pagination.page) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                ...filters
            });
            
            // Nettoyer les paramètres vides
            Object.keys(filters).forEach(key => {
                if (filters[key as keyof typeof filters] === 'all' || filters[key as keyof typeof filters] === '') {
                    params.delete(key);
                }
            });
            
            const res = await fetch(`https://127.0.0.1:8000/api/demandes/me?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDemandes(data.data || []);
                setPagination(data.pagination || pagination);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDemandes(); }, []);

    // Refetch quand les filtres changent
    useEffect(() => {
        fetchDemandes(1); // Reset à la première page quand on filtre
    }, [filters]);

    // Charger le détail pour la modale
    const openDetail = async (id: string) => {
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
            alert("Erreur chargement détail");
        } finally {
            setLoadingDetail(false);
        }
    };

    // Helper Statut Badge
    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            'BROUILLON': 'bg-gray-100 text-gray-600',
            'ATTENTE_CHEF': 'bg-blue-100 text-blue-700',
            'ATTENTE_MANAGER': 'bg-purple-100 text-purple-700',
            'VALIDEE_A_PAYER': 'bg-green-100 text-green-700',
            'PAYEE': 'bg-green-200 text-green-900 border-green-300',
            'REFUSEE': 'bg-red-100 text-red-700',
        };
        
        const { t } = useTranslation();
        const label = t(`pages.requests.status.${status}`);

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border border-transparent ${styles[status] || 'bg-gray-100'}`}>
                {label || status}
            </span>
        );
    };

    const copyToClipboard = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch (e) {
            console.error('Erreur copie', e);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchDemandes(newPage);
        }
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            statut: 'all',
            periode: 'all',
            dateDebut: '',
            dateFin: '',
            sort: 'createdAt',
            order: 'DESC'
        });
    };


    return (
        <div className="max-w-6xl mx-auto">
            {/* Header Page */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('pages.requests.title')}</h1>
                    <p className="text-gray-500">{t('pages.requests.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg transition font-medium"
                    >
                        <Filter size={18} />
                        Filtres
                        {(filters.statut !== 'all' || filters.periode !== 'all' || filters.dateDebut || filters.dateFin) && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">●</span>
                        )}
                    </button>
                    <button 
                        onClick={() => navigate('/requests/new')}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all font-medium"
                    >
                        <Plus size={20} /> Nouvelle Demande
                    </button>
                </div>
            </div>

            {/* Filtres */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Filtre par statut */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                            <select 
                                value={filters.statut}
                                onChange={(e) => handleFilterChange('statut', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="BROUILLON">Brouillon</option>
                                <option value="ATTENTE_CHEF">En attente chef</option>
                                <option value="ATTENTE_MANAGER">En attente manager</option>
                                <option value="VALIDEE_A_PAYER">Validée à payer</option>
                                <option value="PAYEE">Payée</option>
                                <option value="REFUSEE">Refusée</option>
                            </select>
                        </div>

                        {/* Filtre par période */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
                            <select 
                                value={filters.periode}
                                onChange={(e) => handleFilterChange('periode', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Toutes les périodes</option>
                                <option value="7jours">7 derniers jours</option>
                                <option value="30jours">30 derniers jours</option>
                                <option value="3mois">3 derniers mois</option>
                                <option value="custom">Personnalisée</option>
                            </select>
                        </div>

                        {/* Dates personnalisées */}
                        {filters.periode === 'custom' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                                    <input 
                                        type="date"
                                        value={filters.dateDebut}
                                        onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                                    <input 
                                        type="date"
                                        value={filters.dateFin}
                                        onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </>
                        )}

                        {/* Tri */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tri</label>
                            <div className="flex gap-2">
                                <select 
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="createdAt">Date</option>
                                    <option value="montant">Montant</option>
                                    <option value="titre">Titre</option>
                                    <option value="statut">Statut</option>
                                </select>
                                <select 
                                    value={filters.order}
                                    onChange={(e) => handleFilterChange('order', e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="DESC">↓</option>
                                    <option value="ASC">↑</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions des filtres */}
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                        <button 
                            onClick={resetFilters}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                        >
                            Réinitialiser
                        </button>
                        <button 
                            onClick={() => setShowFilters(false)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
                        >
                            Appliquer
                        </button>
                    </div>
                </div>
            )}

            {/* Liste */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {loading ? (
                    <div className="p-12 text-center text-gray-400">{t('common.loading')}</div>
                ) : demandes.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {filters.statut !== 'all' || filters.periode !== 'all' || filters.dateDebut || filters.dateFin 
                                ? 'Aucune demande trouvée' 
                                : t('pages.requests.empty_title')
                            }
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {filters.statut !== 'all' || filters.periode !== 'all' || filters.dateDebut || filters.dateFin 
                                ? 'Essayez de modifier vos filtres pour voir plus de résultats' 
                                : t('pages.requests.empty_sub')
                            }
                        </p>
                        {!(filters.statut !== 'all' || filters.periode !== 'all' || filters.dateDebut || filters.dateFin) && (
                            <button onClick={() => navigate('/requests/new')} className="text-blue-600 font-medium hover:underline">{t('pages.requests.create_first')}</button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">{t('pages.requests.table.reference')}</th>
                                <th className="px-6 py-4">{t('pages.requests.table.title')}</th>
                                <th className="px-6 py-4">{t('pages.requests.table.date')}</th>
                                <th className="px-6 py-4">{t('pages.requests.table.amount')}</th>
                                <th className="px-6 py-4">{t('pages.requests.table.status')}</th>
                                <th className="px-6 py-4 text-right">{t('pages.requests.table.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {demandes.map((d) => (
                                <tr key={d.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer" onClick={() => openDetail(d.id)}>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600 font-medium">
    <div className="flex items-center gap-2 group">
        <span>{d.numeroReference || '---'}</span>

        {d.numeroReference && (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(d.numeroReference);
                }}
                className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-blue-600"
                title={t('common.copy')}
            >
                <Copy size={14} />
            </button>
        )}
    </div>
</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{d.titre}</div>
                                        <div className="text-xs text-gray-500">{d.type}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {d.date}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800">
                                        {Number(d.montant).toLocaleString()} {t('common.currency')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={d.statut} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-100 transition">
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loading && demandes.length > 0 && pagination.pages > 1 && (
                    <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} demandes
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.pages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.pages - 2) {
                                        pageNum = pagination.pages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                                                pagination.page === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modale Viewer */}
            {selectedDemande && (
                <RequestBonViewer demande={selectedDemande} onClose={() => setSelectedDemande(null)} />
            )}
            
            {loadingDetail && (
                <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            )}
        </div>
    );
}