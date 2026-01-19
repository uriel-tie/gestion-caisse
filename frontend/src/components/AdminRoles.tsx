import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Shield } from 'lucide-react';
import { NAVIGATION } from '../config/navigation';
import type { UserData } from '../types';

interface AdminRolesProps {
    user: UserData;
}

interface CustomRole {
    id: string;
    nom: string;
    baseRole: string;
    restrictions: string[];
    adminRestrictions: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function AdminRoles({ user }: AdminRolesProps) {
    const [roles, setRoles] = useState<CustomRole[]>([]);
    const [baseRoles] = useState([
        { value: 'ROLE_MANAGER', label: 'Manager' },
        { value: 'ROLE_CHEF_SERVICE', label: 'Chef de Service' },
        { value: 'ROLE_EMPLOYE', label: 'Employé' },
    ]);

    // Mode création
    const [showCreate, setShowCreate] = useState(false);
    const [newRole, setNewRole] = useState({
        nom: '',
        baseRole: 'ROLE_MANAGER',
        restrictions: [] as string[],
        adminRestrictions: [] as string[],
    });

    // Mode édition
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<Partial<CustomRole>>({});

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch('https://127.0.0.1:8000/api/roles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setRoles(await res.json());
        } catch (e) {
            console.error('Erreur fetch roles:', e);
        }
    };

    const handleCreate = async () => {
        if (!newRole.nom) {
            alert('Veuillez remplir le nom du rôle');
            return;
        }
        try {
            const res = await fetch('https://127.0.0.1:8000/api/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newRole)
            });
            if (res.ok) {
                setNewRole({ nom: '', baseRole: 'ROLE_MANAGER', restrictions: [], adminRestrictions: [] });
                setShowCreate(false);
                fetchRoles();
            } else {
                alert('Erreur création rôle');
            }
        } catch (e) {
            alert('Erreur: ' + e);
        }
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        try {
            const res = await fetch(`https://127.0.0.1:8000/api/roles/${editingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editRole)
            });
            if (res.ok) {
                setEditingId(null);
                fetchRoles();
            }
        } catch (e) {
            alert('Erreur modification: ' + e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr ? Cette action est irréversible.')) return;
        try {
            const res = await fetch(`https://127.0.0.1:8000/api/roles/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRoles();
            } else {
                const data = await res.json();
                alert('Erreur: ' + data.error);
            }
        } catch (e) {
            alert('Erreur suppression: ' + e);
        }
    };

    const startEdit = (role: CustomRole) => {
        setEditingId(role.id);
        setEditRole(role);
    };

    const toggleRestriction = (key: string, field: 'restrictions' | 'adminRestrictions') => {
        if (field === 'restrictions') {
            const updated = editRole.restrictions || [];
            if (updated.includes(key)) {
                setEditRole({ ...editRole, restrictions: updated.filter(r => r !== key) });
            } else {
                setEditRole({ ...editRole, restrictions: [...updated, key] });
            }
        } else {
            const updated = editRole.adminRestrictions || [];
            if (updated.includes(key)) {
                setEditRole({ ...editRole, adminRestrictions: updated.filter(r => r !== key) });
            } else {
                setEditRole({ ...editRole, adminRestrictions: [...updated, key] });
            }
        }
    };

    const toggleNewRestriction = (key: string, field: 'restrictions' | 'adminRestrictions') => {
        if (field === 'restrictions') {
            if (newRole.restrictions.includes(key)) {
                setNewRole({ ...newRole, restrictions: newRole.restrictions.filter(r => r !== key) });
            } else {
                setNewRole({ ...newRole, restrictions: [...newRole.restrictions, key] });
            }
        } else {
            if (newRole.adminRestrictions.includes(key)) {
                setNewRole({ ...newRole, adminRestrictions: newRole.adminRestrictions.filter(r => r !== key) });
            } else {
                setNewRole({ ...newRole, adminRestrictions: [...newRole.adminRestrictions, key] });
            }
        }
    };

    const menuItems = NAVIGATION.filter(n => !n.roles.includes('ALL'));
    const adminItems = ['caisses', 'comptes', 'utilisateurs', 'dossiers', 'rapports'];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Shield size={24} />
                        <h3 className="text-xl font-bold">Rôles Personnalisés</h3>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} /> Nouveau Rôle
                    </button>
                </div>

                {/* FORMULAIRE CRÉATION */}
                {showCreate && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nom du rôle</label>
                                <input
                                    type="text"
                                    value={newRole.nom}
                                    onChange={(e) => setNewRole({ ...newRole, nom: e.target.value })}
                                    placeholder="Ex: Manager Limité"
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Rôle de base</label>
                                <select
                                    value={newRole.baseRole}
                                    onChange={(e) => setNewRole({ ...newRole, baseRole: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    {baseRoles.map(br => (
                                        <option key={br.value} value={br.value}>{br.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Masquer dans la navigation</label>
                            <div className="grid grid-cols-2 gap-2">
                                {menuItems.map(item => (
                                    <label key={item.path} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={newRole.restrictions.includes(item.path)}
                                            onChange={() => toggleNewRestriction(item.path, 'restrictions')}
                                            className="rounded"
                                        />
                                        <span className="text-sm">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Masquer en admin</label>
                            <div className="grid grid-cols-2 gap-2">
                                {adminItems.map(item => (
                                    <label key={item} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={newRole.adminRestrictions.includes(item)}
                                            onChange={() => toggleNewRestriction(item, 'adminRestrictions')}
                                            className="rounded"
                                        />
                                        <span className="text-sm capitalize">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCreate}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Créer
                            </button>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}

                {/* LISTE RÔLES */}
                <div className="space-y-3">
                    {roles.map((role) => (
                        <div key={role.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                            {editingId === role.id ? (
                                // Mode édition
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={editRole.nom}
                                        onChange={(e) => setEditRole({ ...editRole, nom: e.target.value })}
                                        className="w-full border rounded px-2 py-1 font-semibold"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        {menuItems.map(item => (
                                            <label key={item.path} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editRole.restrictions?.includes(item.path) || false}
                                                    onChange={() => toggleRestriction(item.path, 'restrictions')}
                                                    className="rounded"
                                                />
                                                <span className="text-sm">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpdate}
                                            className="text-green-600 hover:bg-green-100 p-2 rounded"
                                        >
                                            <Save size={18} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="text-gray-500 hover:bg-gray-100 p-2 rounded"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Mode lecture
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{role.nom}</h4>
                                        <p className="text-sm text-gray-500">
                                            Base: {baseRoles.find(br => br.value === role.baseRole)?.label}
                                        </p>
                                        {role.restrictions.length > 0 && (
                                            <p className="text-xs text-amber-600 mt-1">
                                                🚫 Restrictions: {role.restrictions.length} item(s)
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(role)}
                                            className="text-blue-600 hover:bg-blue-100 p-2 rounded"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(role.id)}
                                            className="text-red-600 hover:bg-red-100 p-2 rounded"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {roles.length === 0 && (
                        <p className="text-center text-gray-500 py-6">Aucun rôle personnalisé créé</p>
                    )}
                </div>
            </div>
        </div>
    );
}
