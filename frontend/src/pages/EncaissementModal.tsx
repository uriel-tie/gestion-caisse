import React, { useState } from 'react';
import { X, Check, Loader } from 'lucide-react';

interface EncaissementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Pour rafraîchir le dashboard après succès
}

export default function EncaissementModal({ isOpen, onClose, onSuccess }: EncaissementModalProps) {
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [mode, setMode] = useState('Espèces');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/operations/encaissement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          montant: parseFloat(montant),
          mode: mode,
          motif: motif
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
      }

      // Succès !
      setMontant(''); // Reset du champ
      onSuccess(); // On prévient le parent
      onClose(); // On ferme

    } catch (err) {
      setError("Impossible d'enregistrer l'opération.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
        
        {/* En-tête */}
        <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Nouvel Encaissement</h3>
          <button onClick={onClose} className="text-green-100 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Champ Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (€)</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-4 pr-12 py-3 text-2xl font-bold text-gray-900 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">EUR</span>
              </div>
            </div>
          </div>

            {/* Champ Motif */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif de l'encaissement</label>
            <input
              type="text"
              required
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 px-3 focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Ex: Vente Client Dupont, Retour de mission..."
            />
          </div>

          {/* Champ Mode de Paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Paiement</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
            >
              <option value="Espèces">Espèces</option>
              <option value="Carte Bancaire">Carte Bancaire</option>
              <option value="Chèque">Chèque</option>
              <option value="Virement">Virement</option>
            </select>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Traitement...
                </>
              ) : (
                <>
                  <Check className="-ml-1 mr-2 h-5 w-5" />
                  Valider l'Encaissement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}