import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Mail, Ban, CheckCircle, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';

export default function MyTeamPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    
    const token = localStorage.getItem('token');

    const fetchTeam = async () => {
        try {
            // Le backend filtre maintenant automatiquement selon le rôle du chef
            const res = await fetch('https://127.0.0.1:8000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const allUsers = await res.json();
                setUsers(allUsers); 
            } else {
                console.error("Erreur 403 probable si backend non mis à jour");
            }
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTeam(); }, []);

    // --- ACTIONS ---

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('https://127.0.0.1:8000/api/users', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom, email }) 
            });

            const data = await res.json();

            if (res.ok) {
                setShowModal(false);
                setNom(''); setEmail('');
                Swal.fire({
                    icon: 'success',
                    title: 'Compte créé !',
                    html: `Mot de passe temporaire : <b>${data.temp_password}</b>`
                });
                fetchTeam();
            } else {
                Swal.fire('Erreur', data.error || 'Erreur inconnue', 'error');
            }
        } catch (e) {
            Swal.fire('Erreur', 'Erreur réseau', 'error');
        }
    };

    const handleToggleStatus = async (user: any) => {
        const action = user.actif ? 'suspendre' : 'réactiver';
        const result = await Swal.fire({
            title: `Voulez-vous ${action} ${user.nom} ?`,
            text: user.actif ? "Il ne pourra plus se connecter." : "Il retrouvera ses accès.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, confirmer',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`https://127.0.0.1:8000/api/users/${user.id}/toggle-status`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    fetchTeam();
                    Swal.fire('Succès', `Utilisateur ${action === 'suspendre' ? 'suspendu' : 'réactivé'}`, 'success');
                }
            } catch (error) {
                Swal.fire('Erreur', 'Impossible de changer le statut', 'error');
            }
        }
    };

    const handleResetPassword = async (user: any) => {
        const result = await Swal.fire({
            title: 'Réinitialiser le mot de passe ?',
            text: `Le mot de passe de ${user.nom} deviendra "ChangeMoi123!".`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Oui, réinitialiser'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`https://127.0.0.1:8000/api/users/${user.id}/reset-password`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    Swal.fire({
                        title: 'Succès',
                        html: `Nouveau mot de passe : <b>${data.temp_password}</b>`,
                        icon: 'success'
                    });
                }
            } catch (error) {
                Swal.fire('Erreur', 'Échec de la réinitialisation', 'error');
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Users className="mr-3 text-blue-600" /> Mon Équipe
                </h1>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg"
                >
                    <UserPlus size={18} /> Ajouter un collaborateur
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">Collaborateur</th>
                            <th className="px-6 py-4">Rôle</th>
                            <th className="px-6 py-4 text-center">Statut</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((u) => (
                            <tr key={u.id} className={`hover:bg-gray-50 ${!u.actif ? 'bg-red-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3 ${u.actif ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {u.nom.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{u.nom}</div>
                                            <div className="text-xs text-gray-500 flex items-center">
                                                <Mail size={10} className="mr-1"/> {u.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                                        {u.role || 'EMPLOYE'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {u.actif ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3 mr-1"/> Actif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                            <Ban className="w-3 h-3 mr-1"/> Suspendu
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {/* BOUTON SUSPENDRE */}
                                    <button 
                                        onClick={() => handleToggleStatus(u)}
                                        className={`p-1.5 rounded transition ${u.actif ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                        title={u.actif ? "Suspendre" : "Réactiver"}
                                    >
                                        {u.actif ? <Ban size={18}/> : <CheckCircle size={18}/>}
                                    </button>

                                    {/* BOUTON RESET */}
                                    <button 
                                        onClick={() => handleResetPassword(u)}
                                        className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition"
                                        title="Réinitialiser mot de passe"
                                    >
                                        <KeyRound size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Ajout (Inchangé) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Nouveau Membre</h2>
                        <form onSubmit={handleCreateUser}>
                            {/* ... champs ... */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Nom complet</label>
                                <input type="text" required className="w-full border p-2 rounded" value={nom} onChange={e=>setNom(e.target.value)} />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1">Email professionnel</label>
                                <input type="email" required className="w-full border p-2 rounded" value={email} onChange={e=>setEmail(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800">Annuler</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">Créer le compte</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}