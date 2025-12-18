import React, { useState, useEffect } from 'react';
import { X, DollarSign, Printer, CheckCircle, ListPlus } from 'lucide-react';
import { RequestLinesEditor, type RequestLine } from './RequestLinesEditor'; // Assure-toi d'avoir cet import

interface DecaissementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    demande?: { id: string; titre: string; montant: number; beneficiaire: string };
}

export default function DecaissementModal({ isOpen, onClose, onSuccess, demande }: DecaissementModalProps) {
    const [modeDetaille, setModeDetaille] = useState(false); // Toggle simple/détaillé
    const [lignes, setLignes] = useState<RequestLine[]>([
        { id: 1, designation: '', quantite: 1, prixUnitaire: 0, total: 0 }
    ]);
    
    const [montant, setMontant] = useState('');
    const [motif, setMotif] = useState('');
    const [beneficiaire, setBeneficiaire] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastOpId, setLastOpId] = useState<string | null>(null);

    // Calcul automatique du total si mode détaillé
    const totalLignes = lignes.reduce((acc, l) => acc + l.total, 0);

    useEffect(() => {
        if (isOpen) {
            setLastOpId(null);
            setModeDetaille(false);
            setLignes([{ id: 1, designation: '', quantite: 1, prixUnitaire: 0, total: 0 }]);
            
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

        // Si mode détaillé, on prend le total calculé, sinon le montant saisi
        const montantFinal = (!demande && modeDetaille) ? totalLignes : parseFloat(montant);

        if (montantFinal <= 0) {
            alert("Montant invalide");
            setLoading(false);
            return;
        }

        try {
            const payload: any = {
                montant: montantFinal,
                motif,
                demande_id: demande?.id || null,
            };
            
            if (!demande?.id) {
                payload.beneficiaire = beneficiaire;
                // Si on a saisi des lignes, on les envoie
                if (modeDetaille) {
                    payload.lignes = lignes.map(l => ({
                        designation: l.designation,
                        quantite: l.quantite,
                        prix: l.prixUnitaire, // Backend attend 'prix' ou 'prixUnitaire' selon ton mapping
                        total: l.total
                    }));
                }
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
                    alert("Succès, mais ID manquant pour impression.");
                    onSuccess();
                    onClose();
                }
            } else {
                alert(`Erreur : ${data.error || 'Erreur décaissement'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Erreur technique.");
        } finally {
            setLoading(false);
        }
    };

    // ... (Bloc Succès avec Impression identique à avant) ...
    if (lastOpId) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Décaissement Réussi !</h2>
                    <p className="text-gray-500 mb-6">L'opération a été enregistrée.</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.open(`/print/bon-caisse/${lastOpId}`, '_blank')}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold transition shadow-lg"
                        >
                            <Printer size={20} /> IMPRIMER LE BON (FACTURE)
                        </button>
                        <button onClick={onClose} className="w-full text-gray-500 py-2 hover:text-gray-800 font-medium">Fermer</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                        <DollarSign className="w-5 h-5"/> Sortie de Caisse
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Bénéficiaire */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire</label>
                            <input
                                type="text"
                                required
                                value={beneficiaire}
                                onChange={(e) => setBeneficiaire(e.target.value)}
                                className={`w-full p-2.5 border border-gray-300 rounded-lg outline-none ${demande ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-red-500'}`}
                                placeholder="Nom du preneur..."
                                readOnly={!!demande}
                            />
                        </div>

                        {/* Motif */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Motif / Justification</label>
                            <input
                                type="text"
                                required
                                value={motif}
                                onChange={(e) => setMotif(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Motif global..."
                            />
                        </div>

                        {/* SWITCH : MONTANT GLOBAL OU DETAILS */}
                        {!demande && (
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                <span className="text-sm font-medium text-gray-600">Mode de saisie :</span>
                                <button
                                    type="button"
                                    onClick={() => setModeDetaille(false)}
                                    className={`px-3 py-1 rounded text-sm transition ${!modeDetaille ? 'bg-red-100 text-red-700 font-bold' : 'text-gray-500'}`}
                                >
                                    Montant Global
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModeDetaille(true)}
                                    className={`px-3 py-1 rounded text-sm transition flex items-center gap-1 ${modeDetaille ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500'}`}
                                >
                                    <ListPlus size={14}/> Lignes / Articles
                                </button>
                            </div>
                        )}

                        {/* SAISIE */}
                        {(!demande && modeDetaille) ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Détail des articles</label>
                                <RequestLinesEditor lines={lignes} onChange={setLignes} />
                                <div className="text-right mt-2 text-xl font-bold text-red-600">
                                    Total: {totalLignes.toLocaleString()} FCFA
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant à décaisser (FCFA)</label>
                                <input
                                    type="number"
                                    required={!modeDetaille}
                                    min="1"
                                    value={montant}
                                    onChange={(e) => setMontant(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg text-2xl font-bold text-red-600 text-right outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="0"
                                    readOnly={!!demande}
                                />
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition flex justify-center items-center gap-2"
                            >
                                {loading ? 'Traitement...' : 'VALIDER LE PAIEMENT'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}