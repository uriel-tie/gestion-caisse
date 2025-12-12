import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, FileText, Printer } from 'lucide-react';
import { RequestLinesEditor, type RequestLine } from '../components/RequestLinesEditor';

export default function NewRequestPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Champs du formulaire
    const [titre, setTitre] = useState('');
    const [type, setType] = useState('FICHE_BESOIN');
    const [motif, setMotif] = useState('');
    
    // Initialisation avec une ligne vide
    const [lignes, setLignes] = useState<RequestLine[]>([
        { id: 1, designation: '', quantite: 1, prixUnitaire: 0, total: 0 }
    ]);

    // Calcul automatique du total général
    const totalGeneral = lignes.reduce((acc, curr) => acc + curr.total, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (totalGeneral <= 0) {
            alert("Le montant total ne peut pas être nul ou négatif.");
            return;
        }

        if (lignes.some(l => l.designation.trim() === '')) {
            alert("Veuillez remplir la désignation pour toutes les lignes.");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        
        try {
            // Construction du payload conforme au Backend attendu
            const payload = {
                titre,
                type,
                motif,
                montant: totalGeneral, // Le total est calculé par le front
                lignes: lignes.map(l => ({
                    designation: l.designation,
                    quantite: l.quantite,
                    prixUnitaire: l.prixUnitaire
                }))
            };

            const response = await fetch('https://127.0.0.1:8000/api/demandes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Succès : on redirige vers la liste des demandes
                navigate('/requests'); 
            } else {
                const error = await response.json();
                alert(`Erreur: ${error.message || 'Impossible de créer la demande'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Erreur réseau. Vérifiez votre connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            
            {/* Navigation Header */}
            <div className="mb-6 flex items-center justify-between no-print">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center text-gray-500 hover:text-gray-800 transition font-medium"
                >
                    <ArrowLeft size={20} className="mr-2"/> Annuler et Retour
                </button>
            </div>

            {/* --- LE DOCUMENT "BON" --- */}
            <form 
                onSubmit={handleSubmit} 
                className="bg-white p-8 md:p-12 shadow-2xl rounded-lg border-t-8 border-blue-600 relative overflow-hidden"
            >
                {/* Filigrane d'arrière-plan */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <FileText size={200} />
                </div>

                {/* En-tête du Document */}
                <div className="flex justify-between items-end border-b-2 border-gray-800 pb-6 mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Bon de Caisse</h2>
                        <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">Demande de Fonds</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded mb-2">
                            <span className="block text-xs text-gray-400 uppercase">Date d'émission</span>
                            <span className="font-mono font-bold text-gray-700">
                                {new Date().toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bloc : Informations Générales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titre / Objet</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Ex: Achat fournitures bureau"
                            value={titre}
                            onChange={e => setTitre(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type de demande</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={type}
                            onChange={e => setType(e.target.value)}
                        >
                            <option value="FICHE_BESOIN">Fiche de Besoin</option>
                            <option value="ORDRE_MISSION">Ordre de Mission</option>
                        </select>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motif Détaillé</label>
                    <textarea 
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Justification de la dépense..."
                        value={motif}
                        onChange={e => setMotif(e.target.value)}
                    />
                </div>

                {/* Bloc : Lignes de détails */}
                <div className="mb-8">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Détail des articles / Prestations</label>
                    <RequestLinesEditor lines={lignes} onChange={setLignes} />
                </div>

                {/* Pied de page : Totaux et Action */}
                <div className="flex flex-col md:flex-row justify-between items-center border-t-2 border-gray-800 pt-8 mt-8">
                    
                    <div className="text-sm text-gray-500 italic max-w-sm mb-6 md:mb-0">
                        <p>Note : Ce document est soumis à validation hiérarchique avant décaissement.</p>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <span className="block text-xs font-bold text-gray-500 uppercase">Montant Total à Payer</span>
                            <span className="text-3xl font-black text-blue-600 tracking-tight">
                                {totalGeneral.toLocaleString()} <span className="text-lg text-gray-400 font-normal">FCFA</span>
                            </span>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`
                                flex items-center px-8 py-4 rounded-lg font-bold text-white shadow-xl transform transition hover:-translate-y-1 hover:shadow-2xl
                                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                            `}
                        >
                            {loading ? 'Envoi...' : <><Save className="mr-2" /> SOUMETTRE</>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}