// src/pages/AdminManagersPage.tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Manager {
  id: string;
  nom: string;
  email: string;
  actif: boolean;
}

const AdminManagersPage: React.FC = () => {
  const navigate = useNavigate();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchManagers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://127.0.0.1:8000/api/users?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Impossible de récupérer la liste');
      const data: Manager[] = await res.json();

      // On filtre uniquement les managers
      setManagers(data.filter(u => u.role === 'ROLE_MANAGER'));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleManager = async (id: string) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://127.0.0.1:8000/api/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Impossible de modifier le statut');
      }

      fetchManagers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erreur');
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Gestion des Managers</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {managers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucun manager trouvé.
        </div>
      ) : (
        <table className="w-full text-left border-collapse shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-blue-900 text-white text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-3">Nom</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Statut</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {managers.map(m => (
              <tr key={m.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4">{m.nom}</td>
                <td className="px-6 py-4">{m.email}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  {m.actif ? (
                    <span className="text-green-700 flex items-center gap-1">
                      <CheckCircle size={16} /> Actif
                    </span>
                  ) : (
                    <span className="text-yellow-700 flex items-center gap-1">
                      <XCircle size={16} /> Inactif
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    disabled={updatingId === m.id}
                    onClick={() => toggleManager(m.id)}
                    className={`px-3 py-1 rounded-lg text-white shadow-md transition ${
                      m.actif ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updatingId === m.id ? '...' : m.actif ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminManagersPage;
