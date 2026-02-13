import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, ArrowLeft, FileText, Users, Loader2, User, UserPlus } from 'lucide-react';
import { RequestLinesEditor, type RequestLine } from '../components/RequestLinesEditor';
import { type UserData } from '../types';
import Swal from 'sweetalert2';

export default function NewRequestPage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
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

            

            // 1. Récupération robuste de l'utilisateur

            // On vérifie les deux clés possibles : 'user_data' ou 'user'

            const rawUserData = localStorage.getItem('user_data') || localStorage.getItem('user');

            

            if (rawUserData) {

                try {

                    const u = JSON.parse(rawUserData);

                    setCurrentUser(u);

                    setBeneficiaireId(u.id); // Par défaut c'est moi

                } catch (e) {

                    console.error("Erreur parsing user data", e);

                }

            }



            // 2. Charger la liste des utilisateurs (API)

            try {

                const res = await fetch('https://127.0.0.1:8000/api/users?all=true', {

                    headers: { 'Authorization': `Bearer ${token}` }

                });

                if (res.ok) {

                    const data = await res.json();

                    setUsers(data);

                }

            } catch (err) {

                console.error("Erreur fetch users", err);

            }

        };

        loadData();

    }, []);

    const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
        e.preventDefault();
        if (!isDraft && totalGeneral <= 0) {
            Swal.fire(t('common.error'), t('pages.newRequest.errors.amount_zero'), 'error');
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
                beneficiaire_id: beneficiaireMode === 'LIST' ? beneficiaireId : null,
                beneficiaire_autre: beneficiaireMode === 'MANUAL' ? beneficiaireNom : null,
                lignes: lignes.map(l => ({
                    designation: l.designation,
                    quantite: l.quantite,
                    prixUnitaire: l.prixUnitaire,
                    compte_id: l.compte_id || null
                })),
                isDraft
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
                Swal.fire(t('common.error'), error.message || t('pages.newRequest.errors.create_error'), 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire(t('common.error'), t('pages.newRequest.errors.network_error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-300">
            
            <div className="mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-800 transition font-medium">
                    <ArrowLeft size={20} className="mr-2"/> {t('pages.newRequest.back')}
                </button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className="bg-white p-8 md:p-12 shadow-2xl rounded-lg border-t-8 border-blue-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <FileText size={200} />
                </div>

                {/* HEADER DOCUMENT */}
                <div className="flex justify-between items-end border-b-2 border-gray-800 pb-6 mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{t('pages.newRequest.title')}</h2>
                        <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">{t('pages.newRequest.subtitle')}</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs text-gray-400 uppercase">{t('pages.newRequest.date')}</span>
                        <span className="font-mono font-bold text-gray-700">{new Date().toLocaleDateString(i18n.language)}</span>
                    </div>
                </div>

                {/* --- BLOC ACTEURS (EMETTEUR & BENEFICIAIRE) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    
                    {/* 1. EMETTEUR (FIXE) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <User size={14}/> {t('pages.newRequest.issuer_label')}
                        </label>
                        <input 
                            type="text" 
                            value={currentUser ? currentUser.nom : t('common.loading')} 
                            disabled 
                            className="w-full bg-gray-200 border border-gray-300 text-gray-500 cursor-not-allowed p-3 rounded font-medium shadow-inner"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">{t('pages.newRequest.issuer_helper')}</p>
                    </div>

                    {/* 2. BENEFICIAIRE (MODIFIABLE) */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-blue-700 uppercase flex items-center gap-2">
                                {beneficiaireMode === 'LIST' ? <Users size={14}/> : <UserPlus size={14}/>}
                                {t('pages.newRequest.beneficiary_label')}
                            </label>
                            
                            {/* Toggle Mode */}
                            <div className="flex bg-white rounded-md shadow-sm border border-gray-200 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setBeneficiaireMode('LIST')}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${beneficiaireMode === 'LIST' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {t('pages.newRequest.mode_list')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBeneficiaireMode('MANUAL')}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${beneficiaireMode === 'MANUAL' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {t('pages.newRequest.mode_other')}
                                </button>
                            </div>
                        </div>

                        {beneficiaireMode === 'LIST' ? (
                            <select
                                value={beneficiaireId}
                                onChange={(e) => setBeneficiaireId(e.target.value)}
                                className="w-full bg-white border border-blue-300 text-gray-800 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value={currentUser?.id}>{t('pages.newRequest.beneficiary_me')}</option>
                                <option disabled>──────────</option>
                                {users.filter(u => u.id !== currentUser?.id).map(u => (
                                    <option key={u.id} value={u.id}>{u.nom}</option>
                                ))}
                            </select>
                        ) : (
                            <input 
                                type="text"
                                placeholder={t('pages.newRequest.beneficiary_placeholder')}
                                value={beneficiaireNom}
                                onChange={(e) => setBeneficiaireNom(e.target.value)}
                                className="w-full bg-white border border-blue-300 text-gray-800 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400"
                                required={beneficiaireMode === 'MANUAL'}
                            />
                        )}
                        <p className="text-[10px] text-blue-500 mt-1">
                            {beneficiaireMode === 'LIST' 
                                ? t('pages.newRequest.beneficiary_helper_list') 
                                : t('pages.newRequest.beneficiary_helper_manual')}
                        </p>
                    </div>
                </div>

                {/* DETAILS DEMANDE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('components.fields.title')}</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder={t('pages.newRequest.title_placeholder')}
                            value={titre}
                            onChange={e => setTitre(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('pages.newRequest.type')}</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={type}
                            onChange={e => setType(e.target.value)}
                        >
                            <option value="FICHE_BESOIN">{t('pages.newRequest.type_options.FICHE_BESOIN')}</option>
                            <option value="ORDRE_MISSION">{t('pages.newRequest.type_options.ORDRE_MISSION')}</option>
                            <option value="TRANSPORT">{t('pages.newRequest.type_options.TRANSPORT')}</option>
                            <option value="DIVERS">{t('pages.newRequest.type_options.DIVERS')}</option>
                        </select>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('pages.newRequest.detailed_reason')}</label>
                    <textarea 
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={motif}
                        onChange={e => setMotif(e.target.value)}
                    />
                </div>

                {/* LIGNES ET TOTAUX */}
                <div className="mb-8">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('pages.newRequest.financial_details')}</label>
                    <RequestLinesEditor lines={lignes} onChange={setLignes} />
                </div>

                <div className="flex justify-end items-center border-t-2 border-gray-800 pt-8 mt-8 gap-8">
                    <div className="text-right">
                        <span className="block text-xs font-bold text-gray-500 uppercase">{t('pages.newRequest.total_to_pay')}</span>
                        <span className="text-3xl font-black text-blue-600 tracking-tight">
                            {totalGeneral.toLocaleString()} <span className="text-lg text-gray-400 font-normal">{t('common.currency')}</span>
                        </span>
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`flex items-center px-8 py-4 rounded-lg font-bold text-white shadow-xl transform transition hover:-translate-y-1 hover:shadow-2xl ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                        {loading ? t('pages.newRequest.submitting') : t('pages.newRequest.submit')}
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={(e) => handleSubmit(e as any, true)}
                        className="flex items-center px-8 py-4 rounded-lg font-bold text-blue-600 bg-blue-100 shadow-xl hover:bg-blue-200 transition"
                    >
                        <FileText className="mr-2" />
                        {t('pages.newRequest.save_draft')}
                    </button>
                </div>
            </form>
        </div>
    );
}