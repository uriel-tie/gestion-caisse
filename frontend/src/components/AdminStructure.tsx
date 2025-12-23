import React, { useState, useEffect } from 'react';
import { Plus, Monitor, Layers, Trash2 } from 'lucide-react'; // Ajout Trash2

export default function AdminStructure() {
    const [services, setServices] = useState<any[]>([]);
    const [caisses, setCaisses] = useState<any[]>([]);
    const [caissiers, setCaissiers] = useState<any[]>([]);
    const [comptes, setComptes] = useState<any[]>([]);
    
    // Champs de création
    const [newService, setNewService] = useState('');
    const [newCaisse, setNewCaisse] = useState('');
    const [newCaisseEmploye, setNewCaisseEmploye] = useState('');
    const [newCaisseCompte, setNewCaisseCompte] = useState('');
    const [newCaisseSeuil, setNewCaisseSeuil] = useState('50000'); 

    const token = localStorage.getItem('token');

    // Chargement initial
    useEffect(() => {
        fetchData('services', setServices);
        fetchData('caisses', setCaisses);
        fetchData('comptes', setComptes);
        fetchUsers();
    }, []);

    const fetchData = async (endpoint: string, setter: Function) => {
        const res = await fetch(`https://127.0.0.1:8000/api/${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setter(await res.json());
    };

    const handleCreate = async (endpoint: string, payload: object, refreshEndpoint: string, refreshSetter: Function, resetCallback: () => void) => {
        const res = await fetch(`https://127.0.0.1:8000/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            fetchData(refreshEndpoint, refreshSetter);
            resetCallback();
        }
    };

    const fetchUsers = async () => {
        const res = await fetch('https://127.0.0.1:8000/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const users = await res.json();
            setCaissiers(users.filter((u: any) => u.role === 'ROLE_CAISSIER'));
        }
    };

    const handleAssignCaisse = async (caisseId: string, employeId: string) => {
        const res = await fetch(`https://127.0.0.1:8000/api/caisses/${caisseId}/assign`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ employe_id: employeId || null })
        });
        if (res.ok) {
            fetchData('caisses', setCaisses);
        }
    };

    const handleUpdateCaisse = async (caisseId: string, payload: object) => {
        const res = await fetch(`https://127.0.0.1:8000/api/caisses/${caisseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) fetchData('caisses', setCaisses);
    };

    // --- NOUVELLE FONCTION DELETE CAISSE ---
    const handleDeleteCaisse = async (id: string) => {
        if(!window.confirm("Êtes-vous sûr de vouloir supprimer cette caisse ?")) return;

        const res = await fetch(`https://127.0.0.1:8000/api/caisses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            setCaisses(caisses.filter(c => c.id !== id));
        } else {
            // Ici on gère l'erreur "Solde non nul" renvoyée par le backend
            const errorData = await res.json();
            alert(`Erreur : ${errorData.error || "Impossible de supprimer la caisse"}`);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* GESTION DES SERVICES (Inchangé) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                <div className="flex items-center mb-4 text-blue-600">
                    <Layers className="mr-2" />
                    <h3 className="text-lg font-bold">Services / Départements</h3>
                </div>
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        placeholder="Nom du service (ex: RH)"
                        className="flex-1 border rounded-lg px-3 py-2"
                    />
                    <button 
                        onClick={() => handleCreate('services', { nom: newService }, 'services', setServices, () => setNewService(''))}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus />
                    </button>
                </div>
                <ul className="space-y-2">
                    {services.map((s) => (
                        <li key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <span>{s.nom}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* GESTION DES CAISSES */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center mb-4 text-green-600">
                    <Monitor className="mr-2" />
                    <h3 className="text-lg font-bold">Caisses Physiques</h3>
                </div>
                
                {/* Formulaire Création (Inchangé) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <input 
                        type="text" 
                        value={newCaisse}
                        onChange={(e) => setNewCaisse(e.target.value)}
                        placeholder="Nom de la caisse"
                        className="border rounded-lg px-3 py-2"
                    />
                    <div className="relative">
                        <input 
                            type="number" 
                            value={newCaisseSeuil}
                            onChange={(e) => setNewCaisseSeuil(e.target.value)}
                            placeholder="Plafond auto"
                            className="w-full border rounded-lg px-3 py-2 text-right pr-12"
                        />
                        <span className="absolute right-3 top-2 text-gray-400 text-sm">FCFA</span>
                    </div>
                    <select
                        value={newCaisseEmploye}
                        onChange={(e) => setNewCaisseEmploye(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    >
                        <option value="">-- Caissier (Optionnel) --</option>
                        {caissiers.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.nom}</option>
                        ))}
                    </select>
                    <select
                        value={newCaisseCompte}
                        onChange={(e) => setNewCaisseCompte(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    >
                        <option value="">-- Compte Comptable --</option>
                        {comptes.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.numero} - {c.libelle}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={() => handleCreate(
                        'caisses',
                        { nom: newCaisse, employe_id: newCaisseEmploye || null, compte_id: newCaisseCompte || null, seuil: newCaisseSeuil },
                        'caisses',
                        setCaisses,
                        () => { setNewCaisse(''); setNewCaisseSeuil('50000'); setNewCaisseEmploye(''); setNewCaisseCompte(''); }
                    )}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 mb-6 disabled:opacity-50 font-medium"
                    disabled={!newCaisse}
                >
                    <Plus className="inline mr-2 h-4 w-4" /> Ajouter la caisse
                </button>

                {/* Liste des Caisses */}
                <ul className="space-y-4">
                    {caisses.map((c) => (
                        <li key={c.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow relative">
                            
                            {/* BOUTON SUPPRIMER CAISSE */}
                            <button 
                                onClick={() => handleDeleteCaisse(c.id)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
                                title="Supprimer la caisse (si solde nul)"
                            >
                                <Trash2 size={16} />
                            </button>

                            {/* En-tête */}
                            <div className="flex items-center justify-between mb-3 border-b pb-2 pr-8">
                                <div>
                                    <p className="font-bold text-gray-800">{c.nom}</p>
                                    <p className="text-xs text-gray-400 font-mono">ID: {c.id.substring(0,8)}...</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${c.estOuverte ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {c.estOuverte ? 'OUVERTE' : 'DISPONIBLE'}
                                </span>
                            </div>

                            {/* Corps (Inchangé) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Employé assigné</label>
                                        <select
                                            value={c.employeAssigne?.id || ''}
                                            onChange={(e) => handleAssignCaisse(c.id, e.target.value)}
                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                                        >
                                            <option value="">-- Non assignée --</option>
                                            {caissiers.map((caissier: any) => (
                                                <option key={caissier.id} value={caissier.id}>
                                                    {caissier.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Compte Comptable</label>
                                        <select
                                            value={c.compte?.id || ''}
                                            onChange={(e) => handleUpdateCaisse(c.id, { compte_id: e.target.value || null })}
                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                                        >
                                            <option value="">-- Non défini --</option>
                                            {comptes.map((cc: any) => (
                                                <option key={cc.id} value={cc.id}>{cc.numero} - {cc.libelle}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Plafond Décaissement</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            defaultValue={c.seuilDecaissement}
                                            onBlur={(e) => handleUpdateCaisse(c.id, { seuil: e.target.value })}
                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right pr-10"
                                        />
                                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">F</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                        Au-delà, validation requise.
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}