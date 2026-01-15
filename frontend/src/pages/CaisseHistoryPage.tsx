import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, ArrowLeft, ChevronLeft, ChevronRight, Printer } from 'lucide-react'; // Ajout Printer
import { useNavigate } from 'react-router-dom';
import OperationDetailModal from '../components/OperationDetailModal';

export default function CaisseHistoryPage() {
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    type: '',
    date_debut: '',
    date_fin: '',
  });

  const [page, setPage] = useState(1);
  const [operations, setOperations] = useState<any[]>([]);
  const [meta, setMeta] = useState({ currentPage: 1, itemsPerPage: 30, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const { t, i18n } = useTranslation();

  const fetchOperations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
    });

    try {
      const res = await fetch(`https://127.0.0.1:8000/api/operations?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setOperations(json.data);
        setMeta(json.meta);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOperations(); }, [page, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  // --- FONCTION POUR IMPRIMER ---
  const handlePrint = (opId: string) => {
      window.open(`/print/bon/${opId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {selectedOp && (
        <OperationDetailModal 
            operation={selectedOp} 
            onClose={() => setSelectedOp(null)} 
            onRefresh={fetchOperations}
            userRole="CAISSIER" 
        />
      )}

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <button onClick={() => navigate('/workstation')} className="flex items-center text-gray-500 hover:text-blue-700 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1"/> {t('pages.caisseHistory.back')}
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{t('pages.caisseHistory.title')}</h1>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Filtres */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-end">
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{t('pages.caisseHistory.filters.type')}</label>
                <select name="type" className="border-gray-300 rounded text-sm p-2 w-32" onChange={handleFilterChange}>
                    <option value="">{t('pages.caisseHistory.filters.all')}</option>
                    <option value="ENCAISSEMENT">{t('pages.caisseHistory.filters.entry')}</option>
                    <option value="DECAISSEMENT">{t('pages.caisseHistory.filters.exit')}</option>
                </select>
            </div>
            {/* ... dates ... */}
        </div>

        {/* Liste */}
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('pages.caisseHistory.table.headers.hour')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('pages.caisseHistory.table.headers.type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('pages.caisseHistory.table.headers.reason')}</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t('pages.caisseHistory.table.headers.amount')}</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">{t('pages.caisseHistory.table.headers.actions')}</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {operations.map((op) => (
                    <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(op.date).toLocaleString(i18n.language)}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${op.type === 'ENCAISSEMENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {op.type === 'ENCAISSEMENT' ? t('pages.caisseHistory.type.entry') : t('pages.caisseHistory.type.exit')}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{op.motif}</td>
                        <td className={`px-6 py-4 text-right text-sm font-bold ${op.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(op.montant).toLocaleString(i18n.language)}
                        </td>
                        <td className="px-6 py-4 text-center flex justify-center gap-2">
                            {/* BOUTON DÉTAIL */}
                            <button 
                                onClick={() => setSelectedOp(op)} 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                title={t('pages.caisseHistory.view_details')}
                            >
                                <Eye size={18} />
                            </button>

                            {/* BOUTON IMPRESSION (Seulement pour Décaissement) */}
                            {op.type === 'DECAISSEMENT' && (
                                <button 
                                    onClick={() => handlePrint(op.id)}
                                    className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition"
                                    title={t('pages.caisseHistory.print_receipt')}
                                >
                                    <Printer size={18} />
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* ... Pagination ... */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="p-1 disabled:opacity-30"><ChevronLeft/></button>
            <span className="text-sm text-gray-500">{t('pages.caisseHistory.page', { current: meta.currentPage })}</span>
            <button disabled={page===meta.totalPages} onClick={() => setPage(p=>p+1)} className="p-1 disabled:opacity-30"><ChevronRight/></button>
        </div>
      </div>
    </div>
  );
}