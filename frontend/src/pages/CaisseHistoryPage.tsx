import React, { useEffect, useState } from 'react';
import { Calendar, Eye, Filter, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OperationDetailModal from '../components/OperationDetailModal';

export default function CaisseHistoryPage() {
  const navigate = useNavigate();
  
  // Filtres Simplifiés pour le Caissier
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

  const fetchOperations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Le backend filtre déjà par "user" connecté si pas manager
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* Modale (Role Caissier) */}
      {selectedOp && (
        <OperationDetailModal 
            operation={selectedOp} 
            onClose={() => setSelectedOp(null)} 
            onRefresh={fetchOperations}
            userRole="CAISSIER" // Active le bouton "Demander Annulation"
        />
      )}

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <button onClick={() => navigate('/workstation')} className="flex items-center text-gray-500 hover:text-blue-700 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1"/> Retour Caisse
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Mes Opérations</h1>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Filtres Simples */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-end">
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                <select name="type" className="border-gray-300 rounded text-sm p-2 w-32" onChange={handleFilterChange}>
                    <option value="">Tout</option>
                    <option value="ENCAISSEMENT">Entrées (+)</option>
                    <option value="DECAISSEMENT">Sorties (-)</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Du</label>
                <input type="date" name="date_debut" className="border-gray-300 rounded text-sm p-2" onChange={handleFilterChange} />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Au</label>
                <input type="date" name="date_fin" className="border-gray-300 rounded text-sm p-2" onChange={handleFilterChange} />
            </div>
        </div>

        {/* Liste */}
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Heure</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Motif</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-center">Détail</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {operations.map((op) => (
                    <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(op.date).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${op.type === 'ENCAISSEMENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {op.type === 'ENCAISSEMENT' ? 'ENTRÉE' : 'SORTIE'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{op.motif}</td>
                        <td className={`px-6 py-4 text-right text-sm font-bold ${op.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(op.montant).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <button onClick={() => setSelectedOp(op)} className="text-gray-400 hover:text-blue-600">
                                <Eye size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* Pagination minimaliste */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="p-1 disabled:opacity-30"><ChevronLeft/></button>
            <span className="text-sm text-gray-500">Page {meta.currentPage}</span>
            <button disabled={page===meta.totalPages} onClick={() => setPage(p=>p+1)} className="p-1 disabled:opacity-30"><ChevronRight/></button>
        </div>
      </div>
    </div>
  );
}