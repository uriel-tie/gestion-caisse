import React, { useState } from 'react';
import { User, Lock, Save, Mail, Briefcase } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); } 
        catch { return {}; }
    });

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            Swal.fire('Erreur', 'Les mots de passe ne correspondent pas', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch('https://127.0.0.1:8000/api/users/change-password', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    current_password: passwords.current, // Si ton backend le demande
                    new_password: passwords.new 
                })
            });

            if (res.ok) {
                Swal.fire('Succès', 'Mot de passe mis à jour', 'success');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                const err = await res.json();
                Swal.fire('Erreur', err.message || 'Erreur lors de la mise à jour', 'error');
            }
        } catch (error) {
            Swal.fire('Erreur', 'Erreur serveur', 'error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <User className="mr-3 text-blue-600" /> Mon Profil
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Carte Info */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mx-auto mb-4">
                            {user.nom ? user.nom.charAt(0) : 'U'}
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">{user.nom}</h2>
                        <div className="flex items-center justify-center text-gray-500 mt-2 text-sm">
                            <Mail size={14} className="mr-1"/> {user.email}
                        </div>
                        <div className="mt-4 inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">
                            <Briefcase size={12} className="mr-2"/>
                            {user.roles ? user.roles[0].replace('ROLE_', '') : 'EMPLOYE'}
                        </div>
                    </div>
                </div>

                {/* Formulaire Sécurité */}
                <div className="md:col-span-2">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <Lock size={18} className="mr-2 text-gray-400"/> Sécurité du compte
                        </h3>
                        
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            {/* Si ton backend exige l'ancien mot de passe, décommente ceci :
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                                <input type="password" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})}
                                />
                            </div> 
                            */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                                <input 
                                    type="password" required minLength={6}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                                <input 
                                    type="password" required minLength={6}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center shadow-lg transition transform active:scale-95">
                                    <Save size={18} className="mr-2" /> Mettre à jour
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}