import React, { useEffect, useState } from 'react';
import { Building2, Save, Loader2 } from 'lucide-react';
import { societeService } from '../services/societe.service';
import { type Societe } from '../types';
import InputField from './InputField'; // On réutilise ton composant existant s'il est là, sinon input standard

const AdminSoc: React.FC = () => {
    const [formData, setFormData] = useState<Partial<Societe>>({
        nom: '',
        forme: '',
        adresse: '',
        telephone: '',
        registreCommerce: '',
        siegeSocial: '',
        capitalSocial: ''
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
                capitalSocial: data.capitalSocial || ''
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await societeService.update(formData);
            setMsg({ type: 'success', text: 'Informations mises à jour avec succès !' });
        } catch (error) {
            setMsg({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 flex items-center gap-2"><Loader2 className="animate-spin"/> Chargement...</div>;

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                Informations Légales (Entête Documents)
            </h2>

            {msg && (
                <div className={`p-3 mb-4 rounded ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forme Juridique (SA, SARL...)</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Géographique</label>
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

                <div className="col-span-1 md:col-span-2 mt-4 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        Enregistrer les modifications
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSoc;