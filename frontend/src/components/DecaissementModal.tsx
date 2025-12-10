import React, { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle, Loader, ArrowRight, FileText, PenTool, UploadCloud, Trash2 } from 'lucide-react';
import ItemsTable, { type ItemDetail } from '../components/ItemsTable';
import SignatureArea from '../components/SignatureArea';

interface DecaissementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ModePaiement {
    id: string;
    libelle: string;
}

export default function DecaissementModal({ isOpen, onClose, onSuccess }: DecaissementModalProps) {
  const [montant, setMontant] = useState('');
  const [mode, setMode] = useState(''); // Dynamique
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Données dynamiques
  const [comptes, setComptes] = useState<any[]>([]);
  const [modes, setModes] = useState<ModePaiement[]>([]); // Ajouté
  const [selectedCompte, setSelectedCompte] = useState('');

  // States existants (Bon/Fichier)...
  const [isBonInterne, setIsBonInterne] = useState(false);
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [beneficiaire, setBeneficiaire] = useState('');
  const [fichier, setFichier] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chargement des données (Comptes + Modes)
  useEffect(() => {
    if (isOpen) {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Comptes
        fetch('https://127.0.0.1:8000/api/comptes', { headers })
            .then(r => r.json())
            .then(data => setComptes(data))
            .catch(console.error);

        // 2. Fetch Modes
        fetch('https://127.0.0.1:8000/api/modes', { headers })
            .then(r => r.json())
            .then((data: ModePaiement[]) => {
                setModes(data);
                // Sélection par défaut intelligente
                const especes = data.find(m => m.libelle === 'Espèces');
                if (especes) setMode(especes.libelle);
                else if (data.length > 0) setMode(data[0].libelle);
            })
            .catch(console.error);
    }
  }, [isOpen]);

  const montantFinal = isBonInterne 
    ? items.reduce((acc, curr) => acc + curr.total, 0) 
    : parseFloat(montant) || 0;

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

      if (isBonInterne) {
        if (items.length === 0) throw new Error("Veuillez ajouter au moins un article au bon.");
        if (!beneficiaire.trim()) throw new Error("Le nom du bénéficiaire est obligatoire.");
        if (!signature) throw new Error("La signature du bénéficiaire est requise.");
      } else {
        if (montantFinal <= 0) throw new Error("Le montant doit être supérieur à 0.");
      }

      if (!isBonInterne && fichier) {
         fichierBase64 = await convertFileToBase64(fichier);
      }

      const token = localStorage.getItem('token');

      const payload = {
        montant: montantFinal,
        mode: mode, // Envoi du libellé choisi
        motif: motif,
        compte_id: selectedCompte || null,
        is_bon_interne: isBonInterne,
        details: isBonInterne ? items : [],
        signature: isBonInterne ? signature : null,
        beneficiaire: isBonInterne ? beneficiaire : null,
        fichier_data: fichierBase64,
        fichier_nom: fichier ? fichier.name : null
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

      setMontant('');
      setMotif('');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
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

          <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-700 block">Type de Justificatif</span>
              <span className="text-xs text-gray-500">
                  {isBonInterne ? "Création d'un bon numérique" : "Upload d'un document existant"}
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
            
            {/* Contenu spécifique Bon Interne ou Fichier (Identique à avant, omis pour brièveté, garder votre code ici) */}
            {isBonInterne ? (
               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire (Reçu par)</label>
                    <input type="text" required value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)} className="block w-full rounded-md border-gray-300 py-2 px-3 focus:border-red-500 focus:ring-red-500 sm:text-sm border" placeholder="Ex: Taxi Yango..." />
                  </div>
                  <ItemsTable items={items} setItems={setItems} onTotalChange={() => {}} />
                  <SignatureArea onEnd={setSignature} />
                  <div className="flex justify-end items-center mt-2 p-3 bg-red-50 rounded border border-red-100">
                    <span className="text-gray-600 mr-2">Total à décaisser :</span>
                    <span className="text-2xl font-bold text-red-600">{montantFinal.toLocaleString()} FCFA</span>
                  </div>
               </div>
            ) : (
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant à sortir (F)</label>
                    <div className="relative rounded-md shadow-sm">
                      <input type="number" step="1" required={!isBonInterne} min="1" value={montant} onChange={(e) => setMontant(e.target.value)} className="block w-full rounded-md border-gray-300 pl-4 pr-12 py-3 text-2xl font-bold text-red-600 focus:border-red-500 focus:ring-red-500 border" placeholder="0" />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">FCFA</span></div>
                    </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Justificatif</label>
                      {!fichier ? (
                          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-center">
                              <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">Ajouter un fichier</p>
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                          </div>
                      ) : (
                          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border">
                              <span className="text-sm font-medium text-gray-700 truncate">{fichier.name}</span>
                              <button type="button" onClick={() => setFichier(null)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="h-5 w-5" /></button>
                          </div>
                      )}
                  </div>
              </div>
            )}

            {/* CHAMPS COMMUNS AVEC SELECTEUR DYNAMIQUE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motif global</label>
                  <input type="text" required value={motif} onChange={(e) => setMotif(e.target.value)} className="block w-full rounded-md border-gray-300 py-2 px-3 focus:border-red-500 focus:ring-red-500 sm:text-sm border" placeholder="Ex: Achat fournitures..." />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imputation Comptable</label>
                  <select value={selectedCompte} onChange={(e) => setSelectedCompte(e.target.value)} className="block w-full rounded-md border-gray-300 py-2 px-3 border focus:ring-red-500">
                      <option value="">-- Compte par défaut (606) --</option>
                      {comptes.filter(c => c.type === 'DEPENSE' || c.type === 'CHARGE').map((c: any) => (
                          <option key={c.id} value={c.id}>{c.numero} - {c.libelle}</option>
                      ))}
                  </select>
              </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Paiement</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 sm:text-sm focus:border-red-500 focus:ring-red-500 border bg-white"
                  >
                    {modes.length === 0 && <option>Chargement...</option>}
                    {modes.map((m) => (
                      <option key={m.id} value={m.libelle}>
                        {m.libelle}
                      </option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Annuler</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md flex items-center disabled:opacity-50">
                {loading ? <Loader className="animate-spin h-5 w-5" /> : <>Valider <ArrowRight className="ml-2 h-4 w-4" /></>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}