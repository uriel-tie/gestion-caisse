import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader, PlusCircle, FileText, Copy, Check } from 'lucide-react'; // Ajout de Copy et Check
import { NewDemandeModal } from '../components/NewDemandeModal';

interface Demande {
  id: string; 
  titre: string;
  montant: string;
  type: string;
  statut: string;
  dateCreation: string;
}

export const MyRequestsWidget: React.FC = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDemandeModal, setShowNewDemandeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour gérer le feedback visuel de la copie (quel ID vient d'être copié ?)
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDemandeCreated = () => {
    fetchDemandes();
    setShowNewDemandeModal(false);
  };

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      // Attention: Assure-toi que ton backend renvoie bien l'UUID dans le champ 'id'
      const response = await fetch('https://127.0.0.1:8000/api/demandes/me', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDemandes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      console.error('Fetch erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Fonction pour copier l'UUID
  const copyToClipboard = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopiedId(uuid);
    // Remettre l'icône normale après 2 secondes
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadgeColor = (statut: string): string => {
    const statusMap: Record<string, string> = {
      'ATTENTE_CHEF': 'bg-yellow-100 text-yellow-800',
      'ATTENTE_MANAGER': 'bg-blue-100 text-blue-800',
      'VALIDEE': 'bg-green-100 text-green-800',
      'REJETEE': 'bg-red-100 text-red-800',
    };
    return statusMap[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (statut: string): string => {
    const labelMap: Record<string, string> = {
      'ATTENTE_CHEF': 'En attente (Chef)',
      'ATTENTE_MANAGER': 'En attente (Manager)',
      'VALIDEE': 'Validée',
      'REJETEE': 'Rejetée',
    };
    return labelMap[statut] || statut;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Mes Demandes</h3>
        <div className="flex items-center justify-center py-8">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Mes Demandes</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4 flex items-start gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <p className="text-red-800 font-medium">Erreur de chargement</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-violet-100 p-2 rounded-xl">
            <FileText className="text-violet-600 h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Mes Demandes RH</h3>
            <p className="text-sm text-gray-500">Historique personnel</p>
          </div>
        </div>
        <button 
          onClick={() => setShowNewDemandeModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors">
          <PlusCircle className="h-4 w-4" />
          Nouvelle Demande
        </button>
      </div>

      {demandes.length === 0 ? (
        <p className="text-gray-500 text-center py-6">Aucune demande pour le moment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                {/* Nouvelle colonne CODE */}
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Objet</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Montant</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Statut</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((demande) => (
                <tr key={demande.id} className="border-b hover:bg-gray-50 transition">
                  
                  {/* Cellule du CODE UUID avec bouton copier */}
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2 group">
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {/* On affiche seulement le début de l'UUID pour ne pas casser le design */}
                        {demande.id.toString().substring(0, 8)}...
                      </span>
                      <button 
                        onClick={() => copyToClipboard(demande.id.toString())}
                        className="text-gray-400 hover:text-violet-600 transition-colors p-1 rounded hover:bg-violet-50"
                        title="Copier l'identifiant complet"
                      >
                        {copiedId === demande.id.toString() ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-800">
                    {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{demande.titre}</td>
                  <td className="px-4 py-3 text-gray-800">
                    {parseFloat(demande.montant).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(demande.statut)}`}>
                      {getStatusLabel(demande.statut)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nouvelle Demande */}
      {showNewDemandeModal && (
        <NewDemandeModal
          onClose={() => setShowNewDemandeModal(false)}
          onSuccess={handleDemandeCreated}
        />
      )}
    </div>
  );
};