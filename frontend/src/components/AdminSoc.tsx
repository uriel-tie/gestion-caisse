import React, { useEffect, useState } from 'react';
import { Building2, Save, Loader2, Zap, ShieldCheck, UserCheck } from 'lucide-react';
import { societeService } from '../services/societe.service';
import { type Societe } from '../types';

const AdminSoc: React.FC = () => {
    // On ajoute le champ modeValidation dans l'état
    const [formData, setFormData] = useState<Partial<Societe>>({
        nom: '',
        forme: '',
        adresse: '',
        telephone: '',
        registreCommerce: '',
        siegeSocial: '',
        capitalSocial: '',
        modeValidation: 'STANDARD' // Valeur par défaut
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await societeService.get();
            setFormData({
                nom: data.nom,
                forme: data.forme || '',
                adresse: data.adresse || '',
                telephone: data.telephone || '',
                registreCommerce: data.registreCommerce || '',
                siegeSocial: data.siegeSocial || '',
                capitalSocial: data.capitalSocial || '',
                modeValidation: data.modeValidation || 'STANDARD'
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Fonction spécifique pour changer le mode (radio ou click sur carte)
    const handleModeChange = (mode: 'STANDARD' | 'DELEGATION' | 'AUTONOMIE') => {
        setFormData(prev => ({ ...prev, modeValidation: mode }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await societeService.update(formData);
            setMsg({ type: 'success', text: 'Configuration enregistrée avec succès !' });
        } catch (error) {
            setMsg({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 flex items-center gap-2"><Loader2 className="animate-spin"/> Chargement...</div>;

    return (
        <div className="space-y-6">
            
            {/* 1. SECTION WORKFLOW (Le Cerveau de l'App) */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    Mode de Validation (Workflow)
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                    Définissez la rigidité du circuit de validation des dépenses. Ce réglage s'applique immédiatement.
                </p>

                <div className="grid gap-4 md:grid-cols-3 mb-4">
                    {/* MODE STANDARD */}
                    <div 
                        onClick={() => handleModeChange('STANDARD')}
                        className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                            formData.modeValidation === 'STANDARD' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className={`w-5 h-5 ${formData.modeValidation === 'STANDARD' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className="font-bold text-gray-800">Standard</span>
                        </div>
                        <p className="text-xs text-gray-600">
                            <strong>Strict (Recommandé)</strong><br/>
                            Demandeur &rarr; Chef &rarr; Manager &rarr; Caisse.
                        </p>
                    </div>

                    {/* MODE DELEGATION */}
                    <div 
                        onClick={() => handleModeChange('DELEGATION')}
                        className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                            formData.modeValidation === 'DELEGATION' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <UserCheck className={`w-5 h-5 ${formData.modeValidation === 'DELEGATION' ? 'text-purple-600' : 'text-gray-400'}`} />
                            <span className="font-bold text-gray-800">Délégation</span>
                        </div>
                        <p className="text-xs text-gray-600">
                            <strong>Rapide</strong><br/>
                            Le Manager est sauté.<br/>
                            Demandeur &rarr; Chef &rarr; Caisse.
                        </p>
                    </div>

                    {/* MODE AUTONOMIE */}
                    <div 
                        onClick={() => handleModeChange('AUTONOMIE')}
                        className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                            formData.modeValidation === 'AUTONOMIE' 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className={`w-5 h-5 ${formData.modeValidation === 'AUTONOMIE' ? 'text-red-600' : 'text-gray-400'}`} />
                            <span className="font-bold text-gray-800">Autonomie</span>
                        </div>
                        <p className="text-xs text-gray-600">
                            <strong>Urgence</strong><br/>
                            Le Caissier peut créer et valider lui-même.<br/>
                            (Traçabilité auditable).
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. SECTION INFOS LEGALES (Ton code existant) */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    Informations Légales
                </h2>

                {msg && (
                    <div className={`p-3 mb-4 rounded ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Ligne 1 */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Raison Sociale</label>
                            <input 
                                name="nom" 
                                value={formData.nom} 
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Forme Juridique</label>
                            <input 
                                name="forme" 
                                value={formData.forme} 
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: SARL"
                            />
                        </div>

                        {/* Ligne 2 */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                            <input 
                                name="adresse" 
                                value={formData.adresse} 
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                            <input 
                                name="telephone" 
                                value={formData.telephone} 
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Ligne 3 */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">N° Registre Commerce</label>
                            <input 
                                name="registreCommerce" 
                                value={formData.registreCommerce} 
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capital Social</label>
                            <input 
                                name="capitalSocial" 
                                value={formData.capitalSocial} 
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                            Enregistrer Tout
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSoc;