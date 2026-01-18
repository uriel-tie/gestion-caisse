import React, { useState, useEffect } from 'react';
import { 
    UserPlus, User, Copy, Ban, CheckCircle, 
    Trash2, AlertTriangle, KeyRound, Edit2, Loader2, X 
} from 'lucide-react';
import UserEditModal from './UserEditModal';
import Swal from 'sweetalert2';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [formData, setFormData] = useState({ nom: '', email: '', role: 'ROLE_EMPLOYE', service_id: '' });
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchUsers();
        fetchServices();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('https://127.0.0.1:8000/api/users', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) setUsers(await res.json());
        } catch (e) { console.error("Erreur users", e); }
    };

    const fetchServices = async () => {
        try {
            const res = await fetch('https://127.0.0.1:8000/api/services', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) setServices(await res.json());
        } catch (e) { console.error("Erreur services", e); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('https://127.0.0.1:8000/api/users', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const data = await res.json();
                setTempPassword(data.password);
                setFormData({ nom: '', email: '', role: 'ROLE_EMPLOYE', service_id: '' });
                fetchUsers();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const actionText = currentStatus ? 'Suspendre' : 'Activer';
        const confirmation = await Swal.fire({
            title: actionText,
            text: `Voulez-vous ${currentStatus ? 'suspendre' : 'activer'} cet utilisateur ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: actionText,
            cancelButtonText: 'Annuler',
            confirmButtonColor: currentStatus ? '#d33' : '#16a34a'
        });
        if (!confirmation.isConfirmed) return;
        try {
            const res = await fetch(`https://127.0.0.1:8000/api/users/${id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
                Swal.fire({ title: 'Succès', text: `Utilisateur ${currentStatus ? 'suspendu' : 'activé'}.`, icon: 'success' });
            } else {
                const err = await res.json().catch(() => null);
                Swal.fire({ title: 'Erreur', text: err?.error || 'Erreur serveur', icon: 'error' });
            }
        } catch (e) {
            Swal.fire({ title: 'Erreur', text: 'Erreur réseau', icon: 'error' });
        }
    }; 

    const handleDelete = async (id: string) => {
        const confirmation = await Swal.fire({
            title: 'Supprimer l\'utilisateur',
            text: "Supprimer définitivement cet utilisateur ?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#d33'
        });
        if (!confirmation.isConfirmed) return;
        try {
            const res = await fetch(`https://127.0.0.1:8000/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
                Swal.fire({ title: 'Supprimé', text: "L'utilisateur a été supprimé.", icon: 'success' });
            } else {
                const err = await res.json().catch(() => null);
                Swal.fire({ title: 'Erreur', text: err?.error || "Impossible de supprimer cet utilisateur.", icon: 'error' });
            }
        } catch (e) {
            Swal.fire({ title: 'Erreur', text: 'Erreur réseau', icon: 'error' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* FORMULAIRE D'AJOUT */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <UserPlus className="text-blue-600" /> Ajouter un collaborateur
                </h2>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nom complet</label>
                        <input type="text" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jean Dupont"/>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email professionnel</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="j.dupont@entreprise.com"/>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rôle</label>
                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="ROLE_EMPLOYE">Employé</option>
                            <option value="ROLE_CAISSIER">Caissier</option>
                            <option value="ROLE_CHEF">Chef de Service</option>
                            <option value="ROLE_MANAGER">Manager</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Service</label>
                        <select value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Aucun service</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="bg-slate-900 text-white p-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={18}/> : <UserPlus size={18}/>} Créer l'accès
                    </button>
                </form>

                {tempPassword && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <KeyRound className="text-amber-600" />
                            <div>
                                <p className="text-sm text-amber-800 font-medium">Compte créé ! Mot de passe provisoire :</p>
                                <p className="text-lg font-mono font-bold text-amber-900">{tempPassword}</p>
                            </div>
                        </div>
                        <button onClick={() => setTempPassword(null)} className="text-amber-600 hover:text-amber-800"><X size={20}/></button>
                    </div>
                )}

                {!tempPassword && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-2">ℹ️ Comment sont générés les mots de passe provisoires ?</p>
                        <p className="text-xs text-blue-700 mb-3">Le mot de passe provisoire est généré automatiquement à partir de l'e-mail et de l'année actuelle :</p>
                        <div className="bg-white border border-blue-200 p-3 rounded text-xs font-mono text-blue-900 mb-2">
                            Exemple : e-mail "johndoe@example.com" → Mot de passe : <span className="font-bold">Johndoe@2026!</span>
                        </div>
                        <p className="text-xs text-blue-700">
                            • Format : [Première partie de l'e-mail]@[année actuelle]!<br/>
                            • La première lettre est en majuscule, le reste en minuscules<br/>
                            • Le collaborateur doit obligatoirement le changer lors de sa première connexion
                        </p>
                    </div>
                )}
            </div>

            {/* TABLEAU DES UTILISATEURS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Collaborateur</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rôle / Accès</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Service</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${u.actif ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {u.nom.charAt(0)}
                                        </div>
                                        <div>
                                            <div className={`font-medium ${u.actif ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{u.nom}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600 font-medium">
                                        {u.role?.replace('ROLE_', '').replaceAll('_', ' de ') || 'EMPLOYE'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                        {u.service || 'Non assigné'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingUser(u)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleToggleStatus(u.id, u.actif)} className={`p-2 rounded-lg transition ${u.actif ? 'text-gray-400 hover:bg-gray-100' : 'text-green-600 hover:bg-green-50'}`} title={u.actif ? "Désactiver" : "Activer"}>
                                            {u.actif ? <Ban size={16} /> : <CheckCircle size={16} />}
                                        </button>
                                        <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALE DE MODIFICATION */}
            {editingUser && (
                <UserEditModal 
                    user={editingUser} 
                    services={services} 
                    onClose={() => setEditingUser(null)} 
                    onSuccess={() => { fetchUsers(); setEditingUser(null); }} 
                />
            )}
        </div>
    );
}