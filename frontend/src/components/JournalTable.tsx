import React, { useEffect, useState } from 'react';
import { Search, Filter, RotateCcw, AlertTriangle, Printer } from 'lucide-react';
import type { UserData } from '../types';

interface Operation {
  id: string;
  type: string;
  montant: number;
  date: string;
  statut: string;
  mode: string;
  utilisateur: string;
  motif: string;
  caisse: string;
  est_demande_annulation?: boolean;
  motif_annulation?: string;
}

export default function JournalTable() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const token = localStorage.getItem('token');
      // On récupère les opérations (page 1, limit 20 pour l'exemple)
      const response = await fetch('https://127.0.0.1:8000/api/operations?limit=20&page=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        // Mapping pour s'assurer que les champs optionnels existent
        setOperations(json.data.map((op: any) => ({
            ...op,
            est_demande_annulation: op.estDemandeAnnulation || false
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- Fonction d'impression ---
  const handlePrint = (opId: string) => {
      // Ouvre l'onglet d'impression sécurisé
      window.open(`/print/bon-caisse/${opId}`, '_blank');
  };

  const handleReversalClick = async (op: Operation) => {
    const isManager = user?.roles.includes('ROLE_MANAGER');
    const token = localStorage.getItem('token');

    if (isManager) {
        // --- MANAGER : Exécuter la contre-passation ---
        if (!confirm(`Confirmer la contre-passation de l'opération "${op.motif}" de ${op.montant} FCFA ?`)) return;
        
        try {
            const res = await fetch(`https://127.0.0.1:8000/api/operations/${op.id}/reverse`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Opération contre-passée avec succès !");
                fetchOperations();
            } else {
                const err = await res.json();
                alert("Erreur: " + err.error);
            }
        } catch (e) {
            alert("Erreur réseau");
        }
    } else {
        // --- CAISSIER : Demander l'annulation ---
        const motif = prompt("Pourquoi souhaitez-vous annuler cette opération ?");
        if (!motif) return;

        try {
            const res = await fetch(`https://127.0.0.1:8000/api/operations/${op.id}/request-cancellation`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ motif })
            });
            if (res.ok) {
                alert("Votre demande d'annulation a été envoyée au manager.");
                fetchOperations();
            }
        } catch (e) {
            alert("Erreur lors de la demande");
        }
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Chargement du journal...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="font-bold text-gray-700 flex items-center gap-2">
            Journal des Opérations
        </h2>
        <button onClick={fetchOperations} className="text-sm text-blue-600 hover:underline">Actualiser</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operations.map((op) => {
                const isEncaissement = op.type === 'ENCAISSEMENT';
                // On détecte si c'est déjà une ligne d'annulation pour ne pas la re-annuler
                const isReversal = op.motif.toLowerCase().includes('contre-passation');

                return (
                  <tr key={op.id} className={`hover:bg-gray-50 transition-colors ${op.est_demande_annulation ? 'bg-orange-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {op.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isEncaissement ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {op.type}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                        {op.motif}
                        {op.est_demande_annulation && (
                            <div className="flex items-center text-xs text-orange-600 mt-1 font-bold">
                                <AlertTriangle className="w-3 h-3 mr-1"/> Annulation demandée
                            </div>
                        )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                        isEncaissement ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {isEncaissement ? '+' : '-'}{op.montant.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium flex justify-center gap-2">
                        
                        {/* BOUTON IMPRIMER (Seulement pour les décaissements) */}
                        {!isEncaissement && (
                            <button
                                onClick={() => handlePrint(op.id)}
                                className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition"
                                title="Imprimer le Bon de Caisse"
                            >
                                <Printer size={16} />
                            </button>
                        )}

                        {/* BOUTON ANNULATION */}
                        {!isReversal && (
                            <button
                                onClick={() => handleReversalClick(op)}
                                className={`p-1.5 rounded-full transition ${
                                    user?.roles.includes('ROLE_MANAGER') 
                                        ? 'text-red-600 hover:bg-red-100' 
                                        : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                                }`}
                                title={user?.roles.includes('ROLE_MANAGER') ? "Contre-passer" : "Demander l'annulation"}
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}