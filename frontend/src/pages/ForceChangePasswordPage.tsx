import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Lock, Save } from 'lucide-react';

export default function ForceChangePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectToDashboard = (roles: string[] = []) => {
        if (roles.includes('ROLE_SUPER_ADMIN')) {
            window.location.href = '/dashboard';
            return;
        }

        window.location.href = '/home';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirm) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        if (password.length < 6) {
            setError("Le mot de passe est trop court (min 6 caractères).");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('https://127.0.0.1:8000/api/users/Forced-change-password', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ new_password: password })
            });

            if (!res.ok) throw new Error('Erreur lors de la mise à jour');

            // Succès : On met à jour le user local pour dire qu'il n'a plus besoin de changer
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.password_must_be_changed = false; // On update le flag localement
                localStorage.setItem('user', JSON.stringify(user));
                await Swal.fire({
                    icon: 'success',
                    title: 'Mot de passe modifié avec succès !',
                    timer: 1500,
                    showConfirmButton: false
                });
                redirectToDashboard(user.roles || []);
            } else {
                await Swal.fire({
                    icon: 'success',
                    title: 'Mot de passe modifié avec succès !',
                    timer: 1500,
                    showConfirmButton: false
                });
                redirectToDashboard();
            }
        } catch (err) {
            setError("Impossible de changer le mot de passe.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 border-t-4 border-red-600">
                <div className="text-center mb-6">
                    <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Sécurité Requise</h1>
                    <p className="text-gray-600 mt-2 text-sm">
                        C'est votre première connexion (ou une réinitialisation).
                        Pour des raisons de sécurité, vous devez définir votre propre mot de passe personnel.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            required
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex justify-center items-center disabled:opacity-50"
                    >
                        {loading ? 'Enregistrement...' : <><Save className="mr-2 h-4 w-4" /> Définir et Accéder</>}
                    </button>
                </form>
            </div>
        </div>
    );
}