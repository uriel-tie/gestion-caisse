import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { 
  Building2, 
  Users, 
  CheckCircle, 
  RefreshCw,
  Power,
  ShieldCheck,
  LogOut, // Import icône Logout
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserData } from '../types';

interface Manager {
  id: number;
  nomComplet: string;
  email: string;
  estActif: boolean;
}

interface Societe {
  id: number;
  nom: string;
  ncc: string;
  isActive: boolean;
  manager: Manager | null;
}

interface SuperAdminPageProps {
   user: UserData;
   onLogout: () => void;
}

const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [societes, setSocietes] = useState<Societe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fonction pour charger les données
  const fetchDashboard = async () => {
    setLoading(true);
    setError(''); // Reset error
    try {
      const token = localStorage.getItem('token'); 
      if (!token) { navigate('/login'); return; }

      const response = await fetch('https://localhost:8000/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erreur chargement dashboard');
      const data = await response.json();
      setSocietes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Actions de Toggle
  const handleToggleSociete = async (id: number) => {
    const result = await Swal.fire({
        title: 'Confirmer',
        text: 'Changer le statut de cette entreprise ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Non'
    });
    if (!result.isConfirmed) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://localhost:8000/api/admin/societe/${id}/toggle`, { 
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            await Swal.fire({ icon: 'success', title: 'Statut mis à jour', timer: 1500, showConfirmButton: false });
            fetchDashboard(); // Recharger les données
        } else {
            const data = await res.json().catch(() => ({}));
            await Swal.fire('Erreur', data.error || 'Impossible de mettre à jour', 'error');
        }
    } catch(e) { console.error(e); await Swal.fire('Erreur', 'Impossible de mettre à jour', 'error'); }
  };

  const handleToggleUser = async (id: number) => {
    const result = await Swal.fire({
        title: 'Confirmer',
        text: 'Changer le statut de cet utilisateur ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Non'
    });
    if (!result.isConfirmed) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://localhost:8000/api/admin/user/${id}/toggle`, { 
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            await Swal.fire({ icon: 'success', title: 'Statut utilisateur mis à jour', timer: 1500, showConfirmButton: false });
            fetchDashboard();
        } else {
            const data = await res.json().catch(() => ({}));
            await Swal.fire('Erreur', data.error || 'Impossible de mettre à jour', 'error');
        }
    } catch(e) { console.error(e); await Swal.fire('Erreur', 'Impossible de mettre à jour', 'error'); }
  };

  // Filtrage pour la recherche
  const filteredSocietes = societes.filter(s => 
    s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.manager?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Navbar Simplifiée Super Admin */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Super Administration</h1>
                    <p className="text-xs text-slate-500">
                        Connecté en tant que <span className="font-medium text-slate-700"> {user.nom}</span>
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={fetchDashboard} 
                    className="flex items-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                >
                    <RefreshCw size={16} className="mr-2" /> Actualiser
                </button>
                <button 
                    onClick={onLogout}
                    className="flex items-center px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
                >
                    <LogOut size={16} className="mr-2" /> Déconnexion
                </button>
            </div>
        </div>

        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        )}

        {/* Stats Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4"><Building2 /></div>
                <div>
                    <p className="text-sm text-slate-500">Entreprises inscrites</p>
                    <p className="text-2xl font-bold text-slate-800">{societes.length}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg mr-4"><Users /></div>
                <div>
                    <p className="text-sm text-slate-500">En attente de validation</p>
                    <p className="text-2xl font-bold text-slate-800">
                        {societes.filter(s => s.manager && !s.manager.estActif).length}
                    </p>
                </div>
            </div>
             {/* Ajout d'une stat "Actives" pour équilibrer la grille */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-4"><CheckCircle /></div>
                <div>
                    <p className="text-sm text-slate-500">Sociétés Actives</p>
                    <p className="text-2xl font-bold text-slate-800">
                        {societes.filter(s => s.isActive).length}
                    </p>
                </div>
            </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Rechercher une entreprise, un email..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entreprise</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NCC</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Accès Société</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Manager Principal</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Statut Manager</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Chargement des données...</td></tr>
                ) : filteredSocietes.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Aucune entreprise trouvée.</td></tr>
                ) : (
                    filteredSocietes.map((societe) => (
                  <tr key={societe.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{societe.nom}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                        {societe.ncc || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            societe.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {societe.isActive ? 'Active' : 'Bloquée'}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        {societe.manager ? (
                            <div>
                                <div className="text-sm font-medium text-slate-900">{societe.manager.nomComplet}</div>
                                <div className="text-xs text-slate-500">{societe.manager.email}</div>
                            </div>
                        ) : (
                            <span className="text-slate-400 italic text-sm">Aucun manager</span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center">
                        {societe.manager && (
                             <button 
                                onClick={() => handleToggleUser(societe.manager!.id)}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                                    societe.manager.estActif 
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                }`}
                                title="Cliquez pour changer le statut"
                             >
                                {societe.manager.estActif ? <CheckCircle size={12}/> : <Power size={12}/>}
                                {societe.manager.estActif ? 'Validé' : 'En attente'}
                             </button>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => handleToggleSociete(societe.id)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                                societe.isActive 
                                ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                        >
                            {societe.isActive ? 'Bloquer' : 'Débloquer'}
                        </button>
                    </td>
                  </tr>
                ))
               )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;