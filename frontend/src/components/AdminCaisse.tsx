import React, { useState, useEffect } from 'react';
import { Plus, Monitor, Trash2 } from 'lucide-react';

export default function AdminCaisse() {

    const [caisses, setCaisses] = useState<any[]>([]);
    const [caissiers, setCaissiers] = useState<any[]>([]);
    const [comptes, setComptes] = useState<any[]>([]);
    const [newCaisse, setNewCaisse] = useState('');
    const [newCaisseEmploye, setNewCaisseEmploye] = useState('');
    const [newCaisseCompte, setNewCaisseCompte] = useState('');
    // Seuil décaissement par défaut
    const DEFAULT_SEUIL_DECAISSEMENT = '';
    const [newCaisseSeuil, setNewCaisseSeuil] = useState(DEFAULT_SEUIL_DECAISSEMENT); 
    
    const token = localStorage.getItem('token');

     useEffect(() => {
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
        <div className="space-y-8">
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
                                    placeholder="Seuil de décaissement"
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
                                () => { setNewCaisse(''); setNewCaisseSeuil(DEFAULT_SEUIL_DECAISSEMENT); setNewCaisseEmploye(''); setNewCaisseCompte(''); }
                            )}
                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 mb-6 disabled:opacity-50 font-medium"
                            disabled={!newCaisse}
                        >
                            <Plus className="inline mr-2 h-4 w-4" /> Ajouter la caisse
                        </button>
        
                        {/* Liste des Caisses */}
                        <div className="overflow-x-auto">
  <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
    <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
      <tr>
        <th className="px-3 py-2 text-left">Caisse</th>
        <th className="px-3 py-2 text-center">Statut</th>
        <th className="px-3 py-2">Caissier</th>
        <th className="px-3 py-2">Compte</th>
        <th className="px-3 py-2 text-right">Plafond</th>
        <th className="px-3 py-2 text-center">Actions</th>
      </tr>
    </thead>

    <tbody className="text-sm divide-y">
      {caisses.map((c) => (
        <tr key={c.id} className="hover:bg-gray-50">

          {/* NOM */}
          <td className="px-3 py-2 font-medium text-gray-800">
            {c.nom}
            <div className="text-[10px] text-gray-400 font-mono">
              {c.id.substring(0, 8)}…
            </div>
          </td>

          {/* STATUT */}
          <td className="px-3 py-2 text-center">
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold
              ${c.estOuverte
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'}`}
            >
              {c.estOuverte ? 'OUVERTE' : 'DISPO'}
            </span>
          </td>

          {/* CAISSIER */}
          <td className="px-3 py-2">
            <select
              value={c.employeAssigne?.id || ''}
              onChange={(e) => handleAssignCaisse(c.id, e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs"
            >
              <option value="">-- Aucun --</option>
              {caissiers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.nom}</option>
              ))}
            </select>
          </td>

          {/* COMPTE */}
          <td className="px-3 py-2">
            <select
              value={c.compte?.id || ''}
              onChange={(e) =>
                handleUpdateCaisse(c.id, { compte_id: e.target.value || null })
              }
              className="w-full border rounded px-2 py-1 text-xs"
            >
              <option value="">-- Aucun --</option>
              {comptes.map((cc: any) => (
                <option key={cc.id} value={cc.id}>
                  {cc.numero}
                </option>
              ))}
            </select>
          </td>

          {/* PLAFOND */}
          <td className="px-3 py-2 text-right">
            <input
              type="number"
              defaultValue={c.seuilDecaissement}
              onBlur={(e) =>
                handleUpdateCaisse(c.id, { seuil: e.target.value })
              }
              className="w-24 border rounded px-2 py-1 text-xs text-right"
            />
            <span className="ml-1 text-xs text-gray-400">F</span>
          </td>

          {/* ACTIONS */}
          <td className="px-3 py-2 text-center">
            <button
              onClick={() => handleDeleteCaisse(c.id)}
              className="text-gray-400 hover:text-red-600"
              title="Supprimer (si solde nul)"
            >
              <Trash2 size={16} />
            </button>
          </td>

        </tr>
      ))}
    </tbody>
  </table>
</div>
                    </div>
                </div>
            );
        }