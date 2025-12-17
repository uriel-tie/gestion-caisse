import React, { useState, useEffect } from 'react';
import { X, DollarSign, Printer, CheckCircle } from 'lucide-react';

interface DecaissementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    demande?: { id: string; titre: string; montant: number; beneficiaire: string }; // Données pré-remplies si on vient d'une demande
}

export default function DecaissementModal({ isOpen, onClose, onSuccess, demande }: DecaissementModalProps) {
    const [montant, setMontant] = useState('');
    const [motif, setMotif] = useState('');
    const [beneficiaire, setBeneficiaire] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastOpId, setLastOpId] = useState<string | null>(null); // Pour l'impression après succès

    useEffect(() => {
        if (isOpen) {
            setLastOpId(null); // Reset
            if (demande) {
                setMontant(demande.montant.toString());
                setMotif(`Règlement Demande: ${demande.titre}`);
                setBeneficiaire(demande.beneficiaire);
            } else {
                setMontant('');
                setMotif('');
                setBeneficiaire('');
            }
        }
    }, [isOpen, demande]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const payload: any = {
                montant: parseFloat(montant),
                motif,
                demande_id: demande?.id || null,
            };
            
            if (!demande?.id) {
                payload.beneficiaire = beneficiaire;
            }

            const res = await fetch('https://127.0.0.1:8000/api/operations/decaissement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                if (data.id) {
                    setLastOpId(data.id);
                    onSuccess();
                } else {
                    // Cas rare : Succès mais pas d'ID retourné
                    alert("Opération réussie, mais l'ID du bon est manquant pour l'impression.");
                    onSuccess();
                    onClose();
                }
            } else {
                alert(`Erreur : ${data.error || 'Erreur lors du décaissement'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Erreur technique lors de la communication avec le serveur.");
        } finally {
            setLoading(false);
        }
    };

    // --- ÉCRAN DE SUCCÈS AVEC IMPRESSION ---
    if (lastOpId) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center animate-in zoom-in duration-200">
                    <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Décaissement Réussi !</h2>
                    <p className="text-gray-500 mb-6">L'opération a été enregistrée.</p>
                    
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                // Sécurité supplémentaire ici
                                if (lastOpId && lastOpId !== 'undefined') {
                                    window.open(`/print/bon-caisse/${lastOpId}`, '_blank');
                                } else {
                                    alert("Erreur : ID du document invalide.");
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-200"
                        >
                            <Printer size={20} /> IMPRIMER LE BON DE CAISSE
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full text-gray-500 py-2 hover:text-gray-800 font-medium"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        );
    }
   

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                        <DollarSign className="w-5 h-5"/> Sortie de Caisse (Décaissement)
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Montant */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant à décaisser (FCFA)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={montant}
                            onChange={(e) => setMontant(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-2xl font-bold text-red-600 text-right outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="0"
                            readOnly={!!demande} // Bloqué si lié à une demande
                        />
                    </div>

                    {/* Bénéficiaire */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire</label>
                        <input
                            type="text"
                            required
                            value={beneficiaire}
                            onChange={(e) => setBeneficiaire(e.target.value)}
                            className={`w-full p-2.5 border border-gray-300 rounded-lg outline-none ${demande ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-red-500'}`}
                            placeholder="Nom du preneur..."
                            readOnly={!!demande}
                        />
                    </div>

                    {/* Motif */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motif / Justification</label>
                        <textarea
                            required
                            rows={2}
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Pourquoi cet argent sort ?"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition flex justify-center items-center gap-2"
                        >
                            {loading ? 'Traitement...' : 'VALIDER LE DÉCAISSEMENT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}