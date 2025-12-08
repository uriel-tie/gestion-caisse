import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Loader, ArrowRight, FileText, PenTool, UploadCloud, Trash2 } from 'lucide-react';
import ItemsTable, { type ItemDetail } from '../components/ItemsTable';
import SignatureArea from '../components/SignatureArea';

interface DecaissementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DecaissementModal({ isOpen, onClose, onSuccess }: DecaissementModalProps) {
  // --- STATES EXISTANTS ---
  const [montant, setMontant] = useState('');
  const [mode, setMode] = useState('Espèces');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- NOUVEAUX STATES (Bon Interne) ---
  const [isBonInterne, setIsBonInterne] = useState(false);
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [beneficiaire, setBeneficiaire] = useState('');

  // --- NOUVEAUX STATES (Fichier Externe) ---
  const [fichier, setFichier] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Calcul dynamique du montant total
  const montantFinal = isBonInterne 
    ? items.reduce((acc, curr) => acc + curr.total, 0) 
    : parseFloat(montant) || 0;

  // Helper pour convertir un fichier en Base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setFichier(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let fichierBase64 = null;

      // 1. Validations
      if (isBonInterne) {
        if (items.length === 0) throw new Error("Veuillez ajouter au moins un article au bon.");
        if (!beneficiaire.trim()) throw new Error("Le nom du bénéficiaire est obligatoire.");
        if (!signature) throw new Error("La signature du bénéficiaire est requise.");
      } else {
        if (montantFinal <= 0) throw new Error("Le montant doit être supérieur à 0.");
        // Optionnel : Rendre le fichier obligatoire
        // if (!fichier) throw new Error("Veuillez joindre un justificatif (photo/pdf).");
      }

      // 2. Conversion Fichier -> Base64 si présent
      if (!isBonInterne && fichier) {
         fichierBase64 = await convertFileToBase64(fichier);
      }

      const token = localStorage.getItem('token');

      // 3. Construction du Payload
      const payload = {
        montant: montantFinal,
        mode: mode,
        motif: motif,
        
        // Switch
        is_bon_interne: isBonInterne,
        
        // Données Bon Interne
        details: isBonInterne ? items : [],
        signature: isBonInterne ? signature : null,
        beneficiaire: isBonInterne ? beneficiaire : null,

        // Données Fichier Externe
        fichier_data: fichierBase64, // Le contenu du fichier
        fichier_nom: fichier ? fichier.name : null // Le nom d'origine
      };

      const response = await fetch('https://127.0.0.1:8000/api/operations/decaissement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du décaissement');
      }

      if (data.statut === 'EN_ATTENTE') {
        alert("⚠️ Montant élevé : Opération en attente de validation Manager.");
      }

      // Reset total
      setMontant('');
      setItems([]);
      setSignature(null);
      setBeneficiaire('');
      setFichier(null);
      onSuccess();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* En-tête ROUGE */}
        <div className="bg-red-600 px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            {isBonInterne ? <PenTool className="h-5 w-5"/> : <FileText className="h-5 w-5"/>}
            {isBonInterne ? 'Nouveau Bon de Dépense' : 'Sortie de Caisse (Facture)'}
          </h3>
          <button onClick={onClose} className="text-red-100 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center animate-pulse">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {/* --- SWITCH TYPE DE JUSTIFICATIF --- */}
          <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-700 block">Type de Justificatif</span>
              <span className="text-xs text-gray-500">
                  {isBonInterne ? "Création d'un bon numérique (Pas de papier)" : "Upload d'un document existant (Reçu/Facture)"}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isBonInterne}
                onChange={(e) => setIsBonInterne(e.target.checked)}
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- CONTENU DYNAMIQUE --- */}
            {isBonInterne ? (
               /* --- MODE BON INTERNE --- */
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire (Reçu par)</label>
                    <input 
                      type="text" 
                      required
                      value={beneficiaire}
                      onChange={(e) => setBeneficiaire(e.target.value)}
                      className="block w-full rounded-md border-gray-300 py-2 px-3 focus:border-red-500 focus:ring-red-500 sm:text-sm border"
                      placeholder="Ex: Taxi Yango..."
                    />
                  </div>
                  <ItemsTable items={items} setItems={setItems} onTotalChange={() => {}} />
                  <SignatureArea onEnd={setSignature} />
                  <div className="flex justify-end items-center mt-2 p-3 bg-red-50 rounded border border-red-100">
                    <span className="text-gray-600 mr-2">Total à décaisser :</span>
                    <span className="text-2xl font-bold text-red-600">{montantFinal.toLocaleString()} FCFA</span>
                  </div>
               </div>
            ) : (
              /* --- MODE CLASSIQUE + UPLOAD --- */
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant à sortir (F)</label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        step="1"
                        required={!isBonInterne}
                        min="1"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        className="block w-full rounded-md border-gray-300 pl-4 pr-12 py-3 text-2xl font-bold text-red-600 focus:border-red-500 focus:ring-red-500 border"
                        placeholder="0"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* ZONE D'UPLOAD */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Justificatif (Photo, PDF...)</label>
                      
                      {!fichier ? (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors text-center"
                          >
                              <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 font-medium">Cliquez pour ajouter un fichier</p>
                              <p className="text-xs text-gray-400">PNG, JPG, PDF (Max 5Mo)</p>
                              <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                              />
                          </div>
                      ) : (
                          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center">
                                  <FileText className="h-5 w-5 text-blue-500 mr-3" />
                                  <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{fichier.name}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setFichier(null)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                              >
                                  <Trash2 className="h-5 w-5" />
                              </button>
                          </div>
                      )}
                  </div>
              </div>
            )}

            {/* --- CHAMPS COMMUNS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motif global</label>
                  <input 
                    type="text" 
                    required
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-2 px-3 focus:border-red-500 focus:ring-red-500 sm:text-sm border"
                    placeholder="Ex: Achat fournitures..."
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Paiement</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 sm:text-sm focus:border-red-500 focus:ring-red-500 border bg-white"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Carte Bancaire">Carte Bancaire</option>
                    <option value="Virement">Virement</option>
                    <option value="Chèque">Chèque</option>
                  </select>
               </div>
            </div>

            {/* --- BOUTONS --- */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-md flex items-center transition-colors disabled:opacity-50"
              >
                {loading ? <Loader className="animate-spin h-5 w-5" /> : <>Valider <ArrowRight className="ml-2 h-4 w-4" /></>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}