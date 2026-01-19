import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Edit2, Save, X } from 'lucide-react';

export default function AdminCompta() {
    const [comptes, setComptes] = useState<any[]>([]);
    
    // Formulaire Création
    const [newNum, setNewNum] = useState('');
    const [newLibelle, setNewLibelle] = useState('');
    const [newType, setNewType] = useState('CHARGE'); // Type par défaut

    // Mode Édition
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNum, setEditNum] = useState('');
    const [editLibelle, setEditLibelle] = useState('');
    const [editType, setEditType] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchComptes();
    }, []);

    const fetchComptes = async () => {
        try {
            const res = await fetch('https://127.0.0.1:8000/api/comptes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setComptes(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleCreate = async () => {
        if (!newNum || !newLibelle) return;
        try {
            const res = await fetch('https://127.0.0.1:8000/api/comptes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ numero: newNum, libelle: newLibelle, type: newType || 'CHARGE' })
            });
            if (res.ok) {
                setNewNum('');
                setNewLibelle('');
                setNewType('CHARGE');
                fetchComptes();
            }
        } catch (e) { alert("Erreur création"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce compte comptable ?")) return;
        try {
            const res = await fetch(`https://127.0.0.1:8000/api/comptes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchComptes();
        } catch (e) { alert("Erreur suppression"); }
    };

    const startEdit = (c: any) => {
        setEditingId(c.id);
        setEditNum(c.numero);
        setEditLibelle(c.libelle);
        setEditType(c.type || 'CHARGE');
    };

    const handleUpdate = async () => {
        try {
            const res = await fetch(`https://127.0.0.1:8000/api/comptes/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ numero: editNum, libelle: editLibelle, type: editType })
            });
            if (res.ok) {
                setEditingId(null);
                fetchComptes();
            }
        } catch (e) { alert("Erreur modification"); }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-6 text-orange-600">
                <BookOpen className="mr-2 h-6 w-6" />
                <h3 className="text-xl font-bold">Plan Comptable</h3>
            </div>

            {/* BARRE D'AJOUT */}
            <div className="grid grid-cols-12 gap-3 mb-6 bg-orange-50 p-4 rounded-lg">
                <input 
                    type="text" 
                    value={newNum} 
                    onChange={(e) => setNewNum(e.target.value)} 
                    placeholder="Numéro de compte (ex: 606)" 
                    className="col-span-2 border rounded-lg px-3 py-2 font-mono font-bold text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none" 
                />
                <input 
                    type="text" 
                    value={newLibelle} 
                    onChange={(e) => setNewLibelle(e.target.value)} 
                    placeholder="Libellé (ex: Achats Fournitures)" 
                    className="col-span-5 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none" 
                />
                <select 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value)} 
                    className="col-span-2 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-700 font-medium"
                >
                    <option value="CHARGE">Charge</option>
                    <option value="PRODUIT">Produit</option>
                    <option value="ACTIF">Actif</option>
                    <option value="PASSIF">Passif</option>
                </select>
                <button 
                    onClick={handleCreate}
                    disabled={!newNum || !newLibelle}
                    className="col-span-3 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
                >
                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                </button>
            </div>

            {/* LISTE */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {comptes.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                {editingId === c.id ? (
                                    // MODE ÉDITION
                                    <>
                                        <td className="px-6 py-4">
                                            <input className="border rounded px-2 py-1 w-full font-mono" value={editNum} onChange={e => setEditNum(e.target.value)} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input className="border rounded px-2 py-1 w-full" value={editLibelle} onChange={e => setEditLibelle(e.target.value)} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <select className="border rounded px-2 py-1 w-full bg-white" value={editType} onChange={e => setEditType(e.target.value)}>
                                                <option value="CHARGE">Charge</option>
                                                <option value="PRODUIT">Produit</option>
                                                <option value="ACTIF">Actif</option>
                                                <option value="PASSIF">Passif</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={handleUpdate} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={18}/></button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-500 hover:bg-gray-100 p-1 rounded"><X size={18}/></button>
                                        </td>
                                    </>
                                ) : (
                                    // MODE LECTURE
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                                            {c.numero}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {c.libelle}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-medium text-xs">
                                                {c.type || 'CHARGE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(c)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 size={18}/></button>
                                            <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}