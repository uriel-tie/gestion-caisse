import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard, Edit2, Save, X } from 'lucide-react';

export default function AdminModes() {
    const [modes, setModes] = useState<any[]>([]);
    const [newLibelle, setNewLibelle] = useState('');
    const [newType, setNewType] = useState('AUTRE');

    // Édition
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLibelle, setEditLibelle] = useState('');
    const [editType, setEditType] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => { fetchModes(); }, []);

    const fetchModes = async () => {
        const res = await fetch('https://127.0.0.1:8000/api/modes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setModes(await res.json());
    };

    const handleCreate = async () => {
        if (!newLibelle) return;
        await fetch('https://127.0.0.1:8000/api/modes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ libelle: newLibelle, type: newType })
        });
        setNewLibelle('');
        fetchModes();
    };

    const handleUpdate = async () => {
        await fetch(`https://127.0.0.1:8000/api/modes/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ libelle: editLibelle, type: editType })
        });
        setEditingId(null);
        fetchModes();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce mode ?")) return;
        const res = await fetch(`https://127.0.0.1:8000/api/modes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchModes();
        else alert("Impossible de supprimer (probablement utilisé).");
    };

    const startEdit = (m: any) => {
        setEditingId(m.id);
        setEditLibelle(m.libelle);
        setEditType(m.type);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl">
            <div className="flex items-center mb-6 text-indigo-600">
                <CreditCard className="mr-2 h-6 w-6" />
                <h3 className="text-xl font-bold">Modes de Paiement</h3>
            </div>

            {/* BARRE D'AJOUT */}
            <div className="flex gap-3 mb-6 bg-indigo-50 p-4 rounded-lg">
                <input 
                    type="text" 
                    value={newLibelle} 
                    onChange={(e) => setNewLibelle(e.target.value)} 
                    placeholder="Libellé (ex: Mobile Money)" 
                    className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" 
                />
                <select 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value)}
                    className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="ESPECE">Espèces</option>
                    <option value="ELECTRONIQUE">Electronique (CB, Mobile)</option>
                    <option value="CHEQUE">Chèque</option>
                    <option value="VIREMENT">Virement</option>
                    <option value="AUTRE">Autre</option>
                </select>
                <button 
                    onClick={handleCreate}
                    disabled={!newLibelle}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                </button>
            </div>

            {/* LISTE */}
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type Technique</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {modes.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                            {editingId === m.id ? (
                                <>
                                    <td className="px-6 py-4"><input className="border rounded px-2 py-1 w-full" value={editLibelle} onChange={e => setEditLibelle(e.target.value)} /></td>
                                    <td className="px-6 py-4">
                                        <select className="border rounded px-2 py-1 w-full" value={editType} onChange={e => setEditType(e.target.value)}>
                                            <option value="ESPECE">Espèces</option>
                                            <option value="ELECTRONIQUE">Electronique</option>
                                            <option value="CHEQUE">Chèque</option>
                                            <option value="VIREMENT">Virement</option>
                                            <option value="AUTRE">Autre</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={handleUpdate} className="text-green-600"><Save size={18}/></button>
                                        <button onClick={() => setEditingId(null)} className="text-gray-500"><X size={18}/></button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.libelle}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{m.type}</span></td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                                        <button onClick={() => startEdit(m)} className="text-blue-600 hover:text-blue-900"><Edit2 size={18}/></button>
                                        <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}