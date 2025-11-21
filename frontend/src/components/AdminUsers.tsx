import React, { useState, useEffect } from 'react';
import { UserPlus, User, Copy } from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [formData, setFormData] = useState({ nom: '', email: '', role: 'ROLE_EMPLOYE', service_id: '' });
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchUsers();
        fetchServices();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch('http://127.0.0.1:8000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setUsers(await res.json());
    };

    const fetchServices = async () => {
        const res = await fetch('http://127.0.0.1:8000/api/services', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setServices(await res.json());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTempPassword(null);
        const res = await fetch('http://127.0.0.1:8000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        
        if (res.ok) {
            const data = await res.json();
            setTempPassword(data.temp_password); // BINGO ! On affiche le mot de passe
            fetchUsers();
            setFormData({ ...formData, nom: '', email: '' }); // Reset partiel
        }
    };

    return (
        <div className="space-y-8">
            {/* FORMULAIRE CRÉATION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-4 flex items-center"><UserPlus className="mr-2"/> Nouvel Employé</h3>
                
                {tempPassword && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="text-green-800 font-bold">Utilisateur créé avec succès !</p>
                            <p className="text-green-700 text-sm">Mot de passe temporaire : <span className="font-mono bg-white px-2 py-1 rounded border">{tempPassword}</span></p>
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(tempPassword)} className="text-green-600 hover:text-green-800">
                            <Copy size={20} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="text-xs text-gray-500">Nom Complet</label>
                        <input required type="text" placeholder="Jean Dupont" className="w-full border rounded-lg px-3 py-2"
                            value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="text-xs text-gray-500">Email Pro</label>
                        <input required type="email" placeholder="jean@cashflow.com" className="w-full border rounded-lg px-3 py-2"
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="text-xs text-gray-500">Rôle</label>
                        <select className="w-full border rounded-lg px-3 py-2 bg-white"
                            value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="ROLE_EMPLOYE">Employé Standard</option>
                            <option value="ROLE_CAISSIER">Caissier</option>
                            <option value="ROLE_CHEF_SERVICE">Chef de Service</option>
                            <option value="ROLE_MANAGER">Manager</option>
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="text-xs text-gray-500">Service</label>
                        <select className="w-full border rounded-lg px-3 py-2 bg-white"
                            value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})}>
                            <option value="">-- Aucun --</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium">
                        Créer
                    </button>
                </form>
            </div>

            {/* LISTE PERSONNEL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.nom}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                <td className="px-6 py-4 text-sm"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{u.role}</span></td>
                                <td className="px-6 py-4 text-sm text-gray-500">{u.service}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}