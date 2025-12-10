import React, { useState, useEffect } from 'react';
import { X, Check, Loader } from 'lucide-react';

interface EncaissementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Interface pour typer les données de l'API
interface ModePaiement {
  id: string;
  libelle: string;
}

export default function EncaissementModal({ isOpen, onClose, onSuccess }: EncaissementModalProps) {
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [mode, setMode] = useState(''); // Plus de valeur par défaut en dur
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour stocker les modes de paiement
  const [modes, setModes] = useState<ModePaiement[]>([]);

  // Chargement des modes à l'ouverture
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      fetch('https://127.0.0.1:8000/api/modes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Erreur chargement modes');
        return res.json();
      })
      .then((data: ModePaiement[]) => {
        setModes(data);
        // On sélectionne par défaut "Espèces" s'il existe, sinon le premier de la liste
        const especes = data.find(m => m.libelle === 'Espèces');
        if (especes) setMode(especes.libelle);
        else if (data.length > 0) setMode(data[0].libelle);
      })
      .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('https://127.0.0.1:8000/api/operations/encaissement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          montant: parseFloat(montant),
          mode: mode, // Envoie le libellé (ex: "Espèces")
          motif: motif
        })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement");
      }

      setMontant('');
      setMotif('');
      onSuccess();
      onClose();

    } catch (err) {
      setError("Impossible d'enregistrer l'opération.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
        
        <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Nouvel Encaissement</h3>
          <button onClick={onClose} className="text-green-100 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (F)</label>
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
                <span className="text-gray-500 sm:text-sm">FCFA</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif de l'encaissement</label>
            <input
              type="text"
              required
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 px-3 focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Ex: Vente Client Dupont..."
            />
          </div>

          {/* SÉLECTEUR DYNAMIQUE DES MODES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Paiement</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
            >
              {modes.length === 0 && <option>Chargement...</option>}
              {modes.map((m) => (
                <option key={m.id} value={m.libelle}>
                  {m.libelle}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md flex items-center disabled:opacity-50">
              {loading ? <Loader className="animate-spin h-5 w-5" /> : <><Check className="mr-2 h-5 w-5" /> Valider</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}