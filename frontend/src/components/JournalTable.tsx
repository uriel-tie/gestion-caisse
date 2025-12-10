import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, RotateCcw, AlertTriangle,  } from 'lucide-react';
import type { UserData } from '../types';

// Interface mise à jour avec les nouveaux champs
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
  est_demande_annulation?: boolean; // Le champ qu'on a ajouté (via l'API, assure-toi de le renvoyer dans le JSON)
  motif_annulation?: string;
}

export default function JournalTable() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  // Récupération user pour les droits
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://127.0.0.1:8000/api/operations?limit=10&page=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        // Mapping simple si les clés API diffèrent légèrement
        setOperations(json.data.map((op: any) => ({
            ...op,
            est_demande_annulation: op.estDemandeAnnulation || false // Adaptation selon ta réponse API
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReversalClick = async (op: Operation) => {
    const isManager = user?.roles.includes('ROLE_MANAGER');
    const token = localStorage.getItem('token');

    if (isManager) {
        // --- ACTION MANAGER : EXECUTER ---
        if (!confirm(`Confirmer la contre-passation de l'opération "${op.motif}" de ${op.montant} FCFA ?\nCela va créer une écriture inverse.`)) return;
        
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
        // --- ACTION CAISSIER : DEMANDER ---
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
                fetchOperations(); // Rafraîchir pour voir le statut changer (optionnel visuellement)
            }
        } catch (e) {
            alert("Erreur lors de la demande");
        }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* ... (Code du Header et Filtres identique à avant) ... */}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operations.map((op) => {
                const isEncaissement = op.type === 'ENCAISSEMENT';
                // Si l'opération est une contre-passation (souvent indiqué dans le motif), on peut la griser
                const isReversal = op.motif.toLowerCase().includes('contre-passation');

                return (
                  <tr key={op.id} className={`hover:bg-gray-50 ${op.est_demande_annulation ? 'bg-orange-50' : ''}`}>
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
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                        isEncaissement ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {isEncaissement ? '+' : '-'}{op.montant.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* BOUTON CONTRE-PASSATION */}
                        {!isReversal && (
                            <button
                                onClick={() => handleReversalClick(op)}
                                className={`p-2 rounded-full transition-colors ${
                                    user?.roles.includes('ROLE_MANAGER') 
                                        ? 'text-red-600 hover:bg-red-100' // Manager : Rouge vif
                                        : 'text-gray-400 hover:text-red-500 hover:bg-gray-100' // Caissier : Discret
                                }`}
                                title={user?.roles.includes('ROLE_MANAGER') ? "Contre-passer (Annuler)" : "Demander l'annulation"}
                            >
                                <RotateCcw className="w-4 h-4" />
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