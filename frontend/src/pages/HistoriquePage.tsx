import React, { useEffect, useState } from 'react';
import { Calendar, Printer, ArrowLeft, ChevronLeft, ChevronRight, FileSpreadsheet, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OperationDetailModal from '../components/OperationDetailModal';

// Interfaces
interface ModePaiement { id: string; libelle: string; }
interface CompteComptable { id: string; numero: string; libelle: string; }
interface Caisse { id: string; nom: string; }

export default function HistoriquePage() {
  const navigate = useNavigate();

  // États des filtres (incluant CAISSE par ID)
  const [filters, setFilters] = useState({
    type: '', mode: '', compte: '', statut: '', caisse: '', date_debut: '', date_fin: '',
  });

  const [page, setPage] = useState(1);
  const [operations, setOperations] = useState<any[]>([]);
  const [modes, setModes] = useState<ModePaiement[]>([]);
  const [comptes, setComptes] = useState<CompteComptable[]>([]);
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [selectedOp, setSelectedOp] = useState<any>(null);

  const [meta, setMeta] = useState({
    currentPage: 1,
    itemsPerPage: 30,
    totalPages: 1,
    totalItems: 0
  });

  const [loading, setLoading] = useState(false);
    const userRole = localStorage.getItem('userRole') as 'MANAGER' | 'CAISSIER';

  // 1. Chargement initial des listes
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      fetch('https://127.0.0.1:8000/api/modes', { headers }).then(r => r.json()),
      fetch('https://127.0.0.1:8000/api/comptes', { headers }).then(r => r.json()),
      fetch('https://127.0.0.1:8000/api/caisses', { headers }).then(r => r.ok ? r.json() : [])
    ])
    .then(([modesData, comptesData, caissesData]) => {
      setModes(modesData);
      setComptes(comptesData);
      setCaisses(caissesData);
    })
    .catch(console.error);
  }, []);

  // 2. Fetch opérations
  const fetchOperations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    const params = new URLSearchParams({
      page: page.toString(),
      limit: '30',
      ...filters
    });

    // Suppression des filtres vides
    Array.from(params.keys()).forEach(k => {
      if (!params.get(k)) params.delete(k);
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [page, filters]);

  // Changement de filtres
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  // Export PDF
  const handlePrint = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(filters as any);

    Array.from(params.keys()).forEach(k => {
      if (!params.get(k)) params.delete(k);
    });

    try {
      const r = await fetch(`https://127.0.0.1:8000/api/reports/journal?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (r.ok) {
        const blob = await r.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du PDF.");
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(filters as any);

    Array.from(params.keys()).forEach(k => {
      if (!params.get(k)) params.delete(k);
    });

    try {
      const r = await fetch(`https://127.0.0.1:8000/api/reports/journal/excel?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (r.ok) {
        const blob = await r.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'export Excel.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-500 hover:text-purple-700 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Historique Complet</h1>
          <p className="text-gray-500">Consultez, filtrez et exportez toutes les opérations.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </button>
          <button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md">
            <Printer className="h-4 w-4 mr-2" /> PDF
          </button>
        </div>
      </div>

      {/* Bloc principal */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">

        {/* Filtres */}
        <div className="p-5 border-b bg-gray-50 grid grid-cols-1 md:grid-cols-6 gap-4">

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
            <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full border rounded-md p-2 text-sm">
              <option value="">Tous</option>
              <option value="ENCAISSEMENT">Encaissement (+)</option>
              <option value="DECAISSEMENT">Décaissement (-)</option>
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mode de paiement</label>
            <select name="mode" value={filters.mode} onChange={handleFilterChange} className="w-full border rounded-md p-2 text-sm">
              <option value="">Tous</option>
              {modes.map(m => (
                <option key={m.id} value={m.libelle}>{m.libelle}</option>
              ))}
            </select>
          </div>

          {/* Compte comptable */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Compte comptable</label>
            <select name="compte" value={filters.compte} onChange={handleFilterChange} className="w-full border rounded-md p-2 text-sm">
              <option value="">Tous</option>
              {comptes.map(c => (
                <option key={c.id} value={c.numero}>{c.numero} — {c.libelle}</option>
              ))}
            </select>
          </div>

          {/* Caisse */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Caisse</label>
            <select name="caisse" value={filters.caisse} onChange={handleFilterChange} className="w-full border rounded-md p-2 text-sm">
              <option value="">Toutes</option>
              {caisses.map(cs => (
                <option key={cs.id} value={cs.id}>{cs.nom}</option>
              ))}
            </select>
          </div>

          {/* Date début */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Du</label>
            <input type="date" name="date_debut" value={filters.date_debut} onChange={handleFilterChange} className="w-full border rounded-md p-2 text-sm" />
          </div>

          {/* Date fin */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Au</label>
            <input type="date" name="date_fin" value={filters.date_fin} onChange={handleFilterChange} className="w-full border rounded-md p-2 text-sm" />
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Motif</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Caissier</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10">Chargement...</td></tr>
              ) : operations.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Aucun résultat.</td></tr>
              ) : operations.map((op) => (
                <tr key={op.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{op.date}</td>

                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      op.type === 'ENCAISSEMENT'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                      {op.type}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900 truncate">{op.motif}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{op.mode}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{op.utilisateur}</td>

                  <td className={`px-6 py-4 text-right text-sm font-bold ${
                    op.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {op.type === 'ENCAISSEMENT' ? '+' : '-'}{op.montant.toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedOp(op)}
                      className="text-gray-400 hover:text-purple-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page <strong>{meta.currentPage}</strong> sur <strong>{meta.totalPages}</strong> — {meta.totalItems} opérations
          </span>

          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border rounded-md bg-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="p-2 border rounded-md bg-white disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modale */}
      {selectedOp && (
        <OperationDetailModal operation={selectedOp} onClose={() => setSelectedOp(null)}
        onRefresh={fetchOperations}       
        userRole="MANAGER"  />
      )}

    </div>
  );
}
