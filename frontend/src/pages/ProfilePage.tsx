import React, { useState, useEffect } from 'react';
import { User, Mail, Save, Lock, AlertTriangle, Clock } from 'lucide-react';
import InputField from '../components/InputField'; 

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Charger les infos actuelles
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        // Idéalement, faire un fetch sur /api/users/me pour avoir les infos fraîches
        setNom(localUser.nom || '');
        setEmail(localUser.email || '');
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('https://127.0.0.1:8000/api/users/profile', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    nom, 
                    email, 
                    password: password || undefined // On n'envoie pas si vide
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Erreur lors de la mise à jour");
            } else {
                alert("Profil mis à jour !");
                setPassword('');
                // Mettre à jour le localStorage pour l'affichage immédiat
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                localUser.nom = nom;
                localUser.email = email;
                localStorage.setItem('user', JSON.stringify(localUser));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <User className="mr-2 text-purple-600" /> Mon Profil
            </h2>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-sm flex items-start">
                <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>
                    Par mesure de sécurité et de traçabilité, le changement de nom n'est autorisé qu'une fois par mois.
                    Toute modification est enregistrée dans le journal d'audit.
                </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                    <input 
                        type="text" 
                        value={nom} 
                        onChange={e => setNom(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Professionnel</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                        <Lock className="h-4 w-4 mr-2"/> Sécurité
                    </h3>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 transition flex items-center"
                    >
                        <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
                    </button>
                </div>
            </form>
        </div>
    );
}