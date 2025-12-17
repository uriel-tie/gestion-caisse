import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, FileText, Users, Loader2, User, UserPlus } from 'lucide-react';
import { RequestLinesEditor, type RequestLine } from '../components/RequestLinesEditor';
import { type UserData } from '../types'; // Assure-toi d'importer UserData

export default function NewRequestPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // Données contextuelles
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    
    // Champs du formulaire
    const [titre, setTitre] = useState('');
    const [type, setType] = useState('FICHE_BESOIN');
    const [motif, setMotif] = useState('');
    
    // Gestion du Bénéficiaire
    const [beneficiaireMode, setBeneficiaireMode] = useState<'LIST' | 'MANUAL'>('LIST');
    const [beneficiaireId, setBeneficiaireId] = useState(''); // ID si liste
    const [beneficiaireNom, setBeneficiaireNom] = useState(''); // Texte si manuel

    // Lignes de la demande
    const [lignes, setLignes] = useState<RequestLine[]>([
        { id: 1, designation: '', quantite: 1, prixUnitaire: 0, total: 0 }
    ]);

    const totalGeneral = lignes.reduce((acc, curr) => acc + curr.total, 0);

    // Chargement initial
    useEffect(() => {
        const loadData = async () => {
            const token = localStorage.getItem('token');
            // 1. Charger l'utilisateur courant (si stocké ou via API)
            // On suppose ici qu'on peut le récupérer ou qu'il est stocké dans le localStorage
            // Si tu as un endpoint /api/me c'est mieux, sinon on simule avec le localStorage
            const storedUser = localStorage.getItem('user_data');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                setCurrentUser(u);
                setBeneficiaireId(u.id); // Par défaut c'est moi
            }

            // 2. Charger la liste des utilisateurs
            try {
                const res = await fetch('https://127.0.0.1:8000/api/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setUsers(await res.json());
            } catch (err) {
                console.error("Erreur users", err);
            }
        };
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (totalGeneral <= 0) {
            alert("Le montant total ne peut pas être nul.");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        
        try {
            const payload = {
                titre,
                type,
                motif,
                montant: totalGeneral,
                // Logique d'envoi selon le mode choisi
                beneficiaire_id: beneficiaireMode === 'LIST' ? beneficiaireId : null,
                beneficiaire_autre: beneficiaireMode === 'MANUAL' ? beneficiaireNom : null,
                
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
                navigate('/requests'); 
            } else {
                const error = await response.json();
                alert(`Erreur: ${error.message || 'Impossible de créer la demande'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Erreur réseau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-300">
            
            <div className="mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-800 transition font-medium">
                    <ArrowLeft size={20} className="mr-2"/> Annuler et Retour
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 shadow-2xl rounded-lg border-t-8 border-blue-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <FileText size={200} />
                </div>

                {/* HEADER DOCUMENT */}
                <div className="flex justify-between items-end border-b-2 border-gray-800 pb-6 mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Bon de Caisse</h2>
                        <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">Demande de Fonds</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs text-gray-400 uppercase">Date</span>
                        <span className="font-mono font-bold text-gray-700">{new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>

                {/* --- BLOC ACTEURS (EMETTEUR & BENEFICIAIRE) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    
                    {/* 1. EMETTEUR (FIXE) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <User size={14}/> Émetteur (Vous)
                        </label>
                        <input 
                            type="text" 
                            value={currentUser ? currentUser.nom : 'Chargement...'} 
                            disabled 
                            className="w-full bg-gray-200 border border-gray-300 text-gray-500 cursor-not-allowed p-3 rounded font-medium shadow-inner"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Personne connectée effectuant la saisie.</p>
                    </div>

                    {/* 2. BENEFICIAIRE (MODIFIABLE) */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-blue-700 uppercase flex items-center gap-2">
                                {beneficiaireMode === 'LIST' ? <Users size={14}/> : <UserPlus size={14}/>}
                                Bénéficiaire Réel
                            </label>
                            
                            {/* Toggle Mode */}
                            <div className="flex bg-white rounded-md shadow-sm border border-gray-200 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setBeneficiaireMode('LIST')}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${beneficiaireMode === 'LIST' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    LISTE
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBeneficiaireMode('MANUAL')}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${beneficiaireMode === 'MANUAL' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    AUTRE
                                </button>
                            </div>
                        </div>

                        {beneficiaireMode === 'LIST' ? (
                            <select
                                value={beneficiaireId}
                                onChange={(e) => setBeneficiaireId(e.target.value)}
                                className="w-full bg-white border border-blue-300 text-gray-800 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value={currentUser?.id}>Moi-même</option>
                                <option disabled>──────────</option>
                                {users.filter(u => u.id !== currentUser?.id).map(u => (
                                    <option key={u.id} value={u.id}>{u.nom}</option>
                                ))}
                            </select>
                        ) : (
                            <input 
                                type="text"
                                placeholder="Nom & Prénoms du bénéficiaire..."
                                value={beneficiaireNom}
                                onChange={(e) => setBeneficiaireNom(e.target.value)}
                                className="w-full bg-white border border-blue-300 text-gray-800 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400"
                                required={beneficiaireMode === 'MANUAL'}
                            />
                        )}
                        <p className="text-[10px] text-blue-500 mt-1">
                            {beneficiaireMode === 'LIST' 
                                ? "Sélectionnez un collègue disposant d'un compte." 
                                : "Saisissez le nom si la personne n'a pas de compte (ex: externe)."}
                        </p>
                    </div>
                </div>

                {/* DETAILS DEMANDE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titre / Objet</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: Achat fournitures bureau"
                            value={titre}
                            onChange={e => setTitre(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={type}
                            onChange={e => setType(e.target.value)}
                        >
                            <option value="FICHE_BESOIN">Fiche de Besoin</option>
                            <option value="ORDRE_MISSION">Ordre de Mission</option>
                            <option value="TRANSPORT">Transport</option>
                            <option value="DIVERS">Divers</option>
                        </select>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motif Détaillé</label>
                    <textarea 
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={motif}
                        onChange={e => setMotif(e.target.value)}
                    />
                </div>

                {/* LIGNES ET TOTAUX */}
                <div className="mb-8">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Détails financiers</label>
                    <RequestLinesEditor lines={lignes} onChange={setLignes} />
                </div>

                <div className="flex justify-end items-center border-t-2 border-gray-800 pt-8 mt-8 gap-8">
                    <div className="text-right">
                        <span className="block text-xs font-bold text-gray-500 uppercase">Total à Payer</span>
                        <span className="text-3xl font-black text-blue-600 tracking-tight">
                            {totalGeneral.toLocaleString()} <span className="text-lg text-gray-400 font-normal">FCFA</span>
                        </span>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`flex items-center px-8 py-4 rounded-lg font-bold text-white shadow-xl transform transition hover:-translate-y-1 hover:shadow-2xl ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                        SOUMETTRE
                    </button>
                </div>
            </form>
        </div>
    );
}