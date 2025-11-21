import React, { useState } from 'react';
import { X, AlertTriangle, Loader, ArrowRight } from 'lucide-react';

interface DecaissementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DecaissementModal({ isOpen, onClose, onSuccess }: DecaissementModalProps) {
  const [montant, setMontant] = useState('');
  const [mode, setMode] = useState('Espèces');
  const [motif, setMotif] = useState(''); // Ajout d'un motif pour justifier
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/operations/decaissement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          montant: parseFloat(montant),
          mode: mode,
          motif: motif // On pourrait l'envoyer si le backend le gérait (champ description ?)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du décaissement');
      }

      // Si le backend renvoie un message spécifique (ex: "Mis en attente"), on pourrait l'afficher
      if (data.statut === 'EN_ATTENTE') {
        alert("⚠️ Attention : Ce montant dépasse le plafond autorisé. L'opération est en attente de validation par un Manager.");
      }

      setMontant('');
      onSuccess();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        
        {/* En-tête ROUGE */}
        <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Nouveau Décaissement</h3>
          <button onClick={onClose} className="text-red-100 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant à sortir (€)</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-4 pr-12 py-3 text-2xl font-bold text-red-600 focus:border-red-500 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Au-delà de 50€, une validation sera requise.</p>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la dépense</label>
             <input 
                type="text" 
                required
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="block w-full rounded-md border-gray-300 py-2 px-3 focus:border-red-500 focus:ring-red-500 sm:text-sm"
                placeholder="Ex: Frais de port, Café..."
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Paiement</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 sm:text-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="Espèces">Espèces</option>
              <option value="Carte Bancaire">Carte Bancaire</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-md flex items-center"
            >
              {loading ? <Loader className="animate-spin h-5 w-5" /> : <>Valider <ArrowRight className="ml-2 h-4 w-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}