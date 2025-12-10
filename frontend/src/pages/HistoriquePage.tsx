import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, Download, Printer, ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Interface pour les modes de paiement
interface ModePaiement {
    id: string;
    libelle: string;
}
interface CompteComptable { id: string; numero: string; libelle: string; }

export default function HistoriquePage() {
  const navigate = useNavigate();
  
  // États des filtres
  const [filters, setFilters] = useState({
    type: '',
    mode: '',
    compte: '',
    date_debut: '',
    date_fin: '',
  });

  // États Pagination & Données
  const [page, setPage] = useState(1);
  const [operations, setOperations] = useState<any[]>([]);
  
  // État pour les modes de paiement dynamiques
  const [modes, setModes] = useState<ModePaiement[]>([]);

  const [comptes, setComptes] = useState<CompteComptable[]>([]);

  // Initialisation de l'objet meta pour éviter l'erreur TypeScript "currentPage does not exist"
  const [meta, setMeta] = useState({ 
      currentPage: 1, 
      itemsPerPage: 30, 
      totalPages: 1, 
      totalItems: 0 
  });
  
  const [loading, setLoading] = useState(false);

  // 1. Chargement initial : Modes de paiement et Comptes
  useEffect(() => {
      const token = localStorage.getItem('token');
      // Modes de paiement
      fetch('https://127.0.0.1:8000/api/modes', {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setModes(data))
      .catch(console.error);

      // Comptes 
      fetch('https://127.0.0.1:8000/api/comptes', { 
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setComptes(data))
        .catch(console.error);
  }, []);

  // 2. Fonction de chargement des opérations
  const fetchOperations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Construction de l'URL avec paramètres
    const params = new URLSearchParams({
        page: page.toString(),
        limit: '30', // 30 par page comme demandé
        ...filters // Ajoute type, date_debut, etc. s'ils ne sont pas vides
    });

    // Nettoyage des params vides
    Array.from(params.keys()).forEach(key => {
        if (!params.get(key)) params.delete(key);
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

  // Recharger quand la page ou les filtres changent
  useEffect(() => {
    fetchOperations();
  }, [page, filters]); // Déclenche auto si filters change

  // Gestion des changements de filtre
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1); // Retour page 1 si on filtre
  };

  // Impression PDF avec les filtres actuels
  const handlePrint = async () => {
    const token = localStorage.getItem('token');
    
    // 1. On transforme les filtres actuels en paramètres d'URL
    const params = new URLSearchParams(filters as any);
    
    // 2. On nettoie les paramètres vides
    Array.from(params.keys()).forEach(key => {
        if (!params.get(key)) params.delete(key);
    });

    try {
        // 3. On appelle l'API Report avec ces paramètres
        const response = await fetch(`https://127.0.0.1:8000/api/reports/journal?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } else {
            alert("Erreur lors de la génération du PDF");
        }
    } catch (error) {
        console.error("Erreur téléchargement PDF", error);
        alert("Impossible de contacter le serveur");
    }
  };

  const handleExportExcel = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(filters as any);

    Array.from(params.keys()).forEach(key => {
        if (!params.get(key)) params.delete(key);
    });

    try {
        const response = await fetch(`https://127.0.0.1:8000/api/reports/journal/excel?${params}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `journal_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            alert("Erreur lors de l'export Excel");
        }
    } catch (error) {
        console.error("Erreur export", error);
    }
};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
            <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-500 hover:text-purple-700 mb-2">
                <ArrowLeft className="h-4 w-4 mr-1"/> Retour Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Historique Complet</h1>
            <p className="text-gray-500">Consultez, filtrez et exportez toutes les opérations.</p>
        </div>
        <div className="flex gap-2">
    <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors">
        <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
    </button>
    <button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors">
        <Printer className="h-4 w-4 mr-2" /> PDF
    </button>
</div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Barre de Filtres */}
        <div className="p-5 border-b border-gray-200 bg-gray-50 grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Filtre Type */}
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Type d'opération</label>
                <select 
                    name="type" 
                    className="w-full border-gray-300 rounded-md text-sm p-2" 
                    onChange={handleFilterChange}
                    value={filters.type}
                >
                    <option value="">Tout voir</option>
                    <option value="ENCAISSEMENT">Encaissements (+)</option>
                    <option value="DECAISSEMENT">Décaissements (-)</option>
                </select>
            </div>

            {/* Filtre Mode (DYNAMIQUE MAINTENANT) */}
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Moyen de paiement</label>
                <select 
                    name="mode" 
                    className="w-full border-gray-300 rounded-md text-sm p-2"
                    onChange={handleFilterChange}
                    value={filters.mode}
                >
                    <option value="">Tous les modes</option>
                    {modes.map((m) => (
                        <option key={m.id} value={m.libelle}>
                            {m.libelle}
                        </option>
                    ))}
                </select>
            </div>
            {/* Filtre Compte Comptable (DYNAMIQUE) */}     
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Compte Comptable</label>
                <select 
                    name="compte" 
                    className="w-full border-gray-300 rounded-md text-sm p-2"
                    onChange={handleFilterChange}
                    value={filters.compte}
                >
                    <option value="">Tous</option>
                    {comptes.map((c) => (
                        <option key={c.id} value={c.numero}> {/* On envoie le numéro (ex: 606) */}
                            {c.numero} - {c.libelle}
                        </option>
                    ))}
                </select>
            </div>

            {/* Date Début */}
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Du</label>
                <div className="relative">
                    <Calendar className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                    <input 
                        type="date" 
                        name="date_debut" 
                        className="w-full pl-8 border-gray-300 rounded-md text-sm p-2" 
                        onChange={handleFilterChange}
                    />
                </div>
            </div>

            {/* Date Fin */}
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Au</label>
                <div className="relative">
                    <Calendar className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                    <input 
                        type="date" 
                        name="date_fin" 
                        className="w-full pl-8 border-gray-300 rounded-md text-sm p-2" 
                        onChange={handleFilterChange}
                    />
                </div>
            </div>

            {/* Reset */}
            <div className="flex items-end">
                <button 
                    onClick={() => { setFilters({ type:'', mode:'', compte:'', date_debut:'', date_fin:'' }); setPage(1); }}
                    className="w-full py-2 bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 text-sm"
                >
                    Réinitialiser
                </button>
            </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Motif</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mode</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Caissier</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan={7} className="text-center py-10">Chargement...</td></tr>
                    ) : operations.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-500">Aucun résultat pour ces filtres.</td></tr>
                    ) : (
                        operations.map((op) => (
                            <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${op.type === 'ENCAISSEMENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {op.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{op.motif}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{op.mode}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{op.utilisateur}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${op.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-600'}`}>
                                    {op.type === 'ENCAISSEMENT' ? '+' : '-'}{op.montant.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {/* Insérer ici tes boutons d'action (Détail, Annulation...) */}
                                    <button className="text-gray-400 hover:text-purple-600">
                                        <Filter className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* Footer Pagination */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
                Page <span className="font-medium">{meta.currentPage}</span> sur <span className="font-medium">{meta.totalPages}</span> 
                {' '}({meta.totalItems} opérations)
            </span>
            <div className="flex space-x-2">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50"
                >
                    <ChevronLeft className="h-4 w-4"/>
                </button>
                <button 
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50"
                >
                    <ChevronRight className="h-4 w-4"/>
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}