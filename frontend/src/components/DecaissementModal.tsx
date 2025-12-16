import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import BonDeCaissePrint from './BonDeCaissePrint';

interface Compte {
  id: string;
  numero: string;
  libelle: string;
}

interface Operation {
  id: string;
  numeroReference: string;
  montant: number;
  beneficiaire: string;
  motif: string;
  createdAt: string;
  caissier?: string;
}

interface DecaissementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledData?: {
    montant: string;
    beneficiaire: string;
    motif: string;
    demandeId?: string;
  };
}

export default function DecaissementModal({ isOpen, onClose, onSuccess, prefilledData }: DecaissementModalProps) {
  const [formData, setFormData] = useState({
    montant: prefilledData?.montant || '',
    beneficiaire: prefilledData?.beneficiaire || '',
    motif: prefilledData?.motif || '',
    compte_id: '',
    mode: 'Espèces' // Ajout du mode de paiement
  });
  
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [loadingComptes, setLoadingComptes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [createdOperation, setCreatedOperation] = useState<Operation | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Fonction pour charger les comptes
  const fetchComptes = useCallback(async () => {
    if (!isOpen) return;
    
    setLoadingComptes(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }
      
      const response = await fetch('https://localhost:8000/api/comptes', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setComptes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement comptes", err);
      setError('Impossible de charger la liste des comptes');
    } finally {
      setLoadingComptes(false);
    }
  }, [isOpen]);

  // Charger les comptes quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      fetchComptes();
    }
  }, [isOpen, fetchComptes]);

  // Réinitialiser le formulaire quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        montant: prefilledData?.montant || '',
        beneficiaire: prefilledData?.beneficiaire || '',
        motif: prefilledData?.motif || '',
        compte_id: '',
        mode: 'Espèces'
      });
      setCreatedOperation(null);
      setError('');
    }
  }, [isOpen, prefilledData]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bon_de_Caisse_${createdOperation?.numeroReference || 'Nouveau'}`,
    onAfterPrint: () => {
      onSuccess();
      onClose();
    },
    onPrintError: () => {
      alert("Erreur lors de l'impression. Veuillez réessayer.");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.compte_id) {
      setError('Veuillez sélectionner un compte');
      return;
    }

    const montant = parseFloat(formData.montant);
    if (isNaN(montant) || montant <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const payload = {
        montant: montant,
        beneficiaire: formData.beneficiaire.trim(),
        motif: formData.motif.trim(),
        demande_id: prefilledData?.demandeId || null,
        compte_id: formData.compte_id,
        mode: formData.mode
      };

      const response = await fetch('https://localhost:8000/api/operations/decaissement', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedOperation({
          ...data,
          montant: parseFloat(data.montant),
          caissier: data.caissier || 'Moi-même',
          createdAt: data.createdAt || new Date().toISOString()
        });
      } else {
        throw new Error(data.message || data.error || `Erreur ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur lors du décaissement", error);
      setError(error instanceof Error ? error.message : 'Erreur lors du décaissement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (error) setError('');
  };

  if (!isOpen) return null;

  if (createdOperation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg max-w-lg w-full text-center shadow-2xl">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-4">Décaissement Validé !</h2>
          <p className="mb-4 text-gray-600">
            Référence: <span className="font-mono font-bold text-gray-800">{createdOperation.numeroReference}</span>
          </p>
          <p className="mb-6 text-gray-600">
            Montant: <span className="font-bold text-xl">{createdOperation.montant.toLocaleString()} FCFA</span>
          </p>
          
          <div style={{ display: 'none' }}>
            <div ref={printRef}>
              <BonDeCaissePrint operation={createdOperation} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => handlePrint()} 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              🖨️ IMPRIMER LE BON
            </button>
            <button 
              onClick={() => { onSuccess(); onClose(); }} 
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-yellow-50 p-6 md:p-8 rounded-lg shadow-2xl max-w-2xl w-full border-2 border-gray-300 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          aria-label="Fermer"
        >
          ×
        </button>
        
        <div className="absolute top-4 left-4 text-gray-400 font-mono text-xs">NOUVEAU DÉCAISSEMENT</div>
        
        <h2 className="text-2xl font-serif font-bold text-center mb-6 uppercase border-b border-gray-300 pb-3 text-gray-800">
          Ordre de Décaissement
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Montant */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-700">MONTANT (FCFA) *</label>
            <div className="relative">
              <input
                type="number"
                name="montant"
                required
                step="0.01"
                min="0"
                className="w-full bg-white border border-gray-300 rounded p-3 text-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.montant}
                onChange={handleChange}
                placeholder="0.00"
              />
              <span className="absolute right-3 top-3 font-bold text-gray-500">FCFA</span>
            </div>
          </div>

          {/* Bénéficiaire */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-700">Bénéficiaire *</label>
            <input
              type="text"
              name="beneficiaire"
              required
              className="w-full bg-white border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.beneficiaire}
              onChange={handleChange}
              placeholder="Nom du porteur"
            />
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-700">Motif *</label>
            <textarea
              name="motif"
              required
              rows={3}
              className="w-full bg-white border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.motif}
              onChange={handleChange}
              placeholder="Détails de l'opération..."
            />
          </div>

          {/* Mode de paiement */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-700">Mode de paiement *</label>
            <select
              name="mode"
              required
              className="w-full bg-white border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.mode}
              onChange={handleChange}
            >
              <option value="Espèces">Espèces</option>
              <option value="Chèque">Chèque</option>
              <option value="Virement">Virement</option>
              <option value="Carte">Carte</option>
            </select>
          </div>

          {/* Sélection du compte */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-700">Compte d'imputation *</label>
            <div>
              {loadingComptes ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  Chargement des comptes...
                </div>
              ) : (
                <select
                  name="compte_id"
                  required
                  className="w-full bg-white border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.compte_id}
                  onChange={handleChange}
                >
                  <option value="">-- Sélectionner un compte --</option>
                  {comptes.map((compte) => (
                    <option key={compte.id} value={compte.id}>
                      {compte.numero} - {compte.libelle}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
              {error}
            </div>
          )}

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || loadingComptes}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Validation...
                </span>
              ) : (
                'VALIDER LE DÉCAISSEMENT'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}