import React, { useState } from 'react';
import { Search, CheckCircle, AlertCircle, Banknote, ArrowRight } from 'lucide-react';
import BonDeCaissePrint from './BonDeCaissePrint';

interface PaymentTerminalProps {
    onSuccess: () => void; // Pour rafraîchir le solde après paiement
}


export default function PaymentTerminal({ onSuccess }: PaymentTerminalProps) {
    const [code, setCode] = useState('');
    const [demande, setDemande] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const token = localStorage.getItem('token');
    const [operationToPrint, setOperationToPrint] = useState<any>(null);

    // 1. RECHERCHER LA DEMANDE
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setDemande(null); setSuccessMsg(null);
        setLoading(true);

        try {
            // Note : On suppose ici que l'ID est l'UUID exact.
            // Si tu veux une recherche floue, il faudra une API spécifique /api/demandes/search
            const res = await fetch(`https://127.0.0.1:8000/api/demandes/search/${code}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 404) throw new Error("Aucune demande trouvée avec ce code.");
            if (!res.ok) throw new Error("Erreur recherche.");

            const data = await res.json();
            setDemande(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. PAYER (DÉCAISSER)
    const handlePay = async () => {
        if (!demande) return;
        if (!confirm(`Confirmer le décaissement de ${demande.montant} F pour "${demande.titre}" ?`)) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://127.0.0.1:8000/api/operations/decaissement', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    montant: demande.montant,
                    motif: `Paiement Demande ${demande.numeroReference} - ${demande.titre}`,
                    demande_id: demande.id,
                    mode: 'Espèces'
                })
            });

            const data = await res.json();

            if (res.ok) {
                // SUCCÈS : On prépare l'objet pour l'impression
                const opForPrint = {
                    id: data.id || 'N/A', // L'ID retourné par l'API operation
                    date: new Date().toISOString(),
                    montant: demande.montant,
                    motif: demande.titre,
                    demandeur: demande.demandeur, // Nom du demandeur
                    utilisateur: 'Moi (Caissier)', // Ou récupérer depuis le user context
                    lignes: demande.lignes // On passe les lignes pour le détail
                };

                setOperationToPrint(opForPrint); // <-- Ouvre la modale d'impression
                
                onSuccess(); // Rafraichir le solde en arrière-plan
                setDemande(null); // Reset recherche
                setCode('');
            } else {
                setError(data.error || "Erreur de paiement");
            }
        } catch (e) {
            setError("Erreur réseau");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Banknote className="mr-2 h-5 w-5 text-purple-600" />
                Terminal de Paiement (Demandes Validées)
            </h3>

            {/* BARRE DE RECHERCHE */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Scanner ou saisir le code de la demande..."
                    className="flex-1 border rounded-lg px-4 py-2 font-mono text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button 
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50"
                >
                    {loading ? '...' : <Search className="h-5 w-5" />}
                </button>
            </form>

            {/* FEEDBACK ERREUR / SUCCES */}
            {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" /> {error}
                </div>
            )}
            {successMsg && (
                <div className="p-4 mb-4 bg-green-50 text-green-700 rounded-lg flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" /> {successMsg}
                </div>
            )}

            {/* RÉSULTAT DE LA DEMANDE */}
            {demande && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 animate-in fade-in">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="font-bold text-lg text-gray-900">{demande.titre}</h4>
                            <p className="text-sm text-gray-500">Demandeur : {demande.demandeur_nom || 'Employé'}</p>
                        </div>
                        <div className="text-right">
                            <span className="block font-mono text-xl font-bold text-gray-900">{parseFloat(demande.montant).toFixed(2)} F CFA</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                                demande.statut === 'VALIDEE_A_PAYER'  
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {demande.statut}
                            </span>
                        </div>
                    </div>

                    {/* BOUTON D'ACTION */}
                    {/* GESTION DES ÉTATS DU BOUTON */}
                    {demande.statut === 'VALIDEE_A_PAYER' ? (
                        /* CAS 1 : PRÊT À PAYER */
                        <button 
                            onClick={handlePay}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-transform active:scale-95 flex justify-center items-center"
                        >
                            {loading ? 'Traitement...' : <>CONFIRMER LE DÉCAISSEMENT <ArrowRight className="ml-2 h-5 w-5"/></>}
                        </button>

                    ) : demande.statut === 'PAYEE' ? (
                        /* CAS 2 : DÉJÀ PAYÉ (NOUVEAU) */
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-center">
                            <div className="flex justify-center mb-2">
                                {/* Tu peux importer CheckCircle de lucide-react si tu l'as, sinon une emoji suffit */}
                                <span className="text-3xl">✅</span> 
                            </div>
                            <p className="font-bold">Cette demande a déjà été réglée.</p>
                            <p className="text-xs text-blue-600 mt-1">Impossible d'effectuer un nouveau décaissement.</p>
                        </div>

                    ) : (
                        /* CAS 3 : AUTRES STATUTS (Brouillon, En attente...) */
                        <div className="bg-orange-100 border border-orange-200 text-orange-800 p-3 rounded-lg text-center font-medium flex items-center justify-center gap-2">
                            <span>⛔ Impossible de payer : Statut <b>{demande.statut}</b></span>
                        </div>
                    )}
                </div>
            )}        

            {/* MODALE D'IMPRESSION (S'affiche si operationToPrint existe) */}
            {/* MODALE D'IMPRESSION */}
            {operationToPrint && (
                <BonDeCaissePrint 
                    operationId={operationToPrint.id} // <--- C'EST ICI LA CLÉ : on passe l'ID, pas tout l'objet
                    onClose={() => setOperationToPrint(null)} 
                />
            )}
            </div>
    );
}