import React, { useState, useEffect } from 'react';
import { X, Save, Check } from 'lucide-react';

interface UserEditModalProps {
    user: any;
    services: any[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserEditModal({ user, services: servicesProps, onClose, onSuccess }: UserEditModalProps) {
    const [role, setRole] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // 1. Initialiser les données au chargement
    useEffect(() => {
        if (user) {
            // Déduire le rôle principal depuis la string du rôle
            const userRole = user.role || 'EMPLOYE';
            if (userRole.includes('MANAGER')) setRole('MANAGER');
            else if (userRole.includes('CAISSIER')) setRole('CAISSIER');
            else if (userRole.includes('CHEF_SERVICE')) setRole('CHEF_SERVICE');
            else setRole('EMPLOYE');

            // ID du service actuel
            setServiceId(user.service || ''); 
        }
        
        if (servicesProps && servicesProps.length > 0) {
            setServices(servicesProps);
        } else {
            fetchServices();
        }
    }, [user, servicesProps]);

    // 2. Charger la liste des services pour le dropdown
    const fetchServices = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('https://127.0.0.1:8000/api/services', { // Adaptez cette URL
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setServices(await res.json());
        } catch (e) { console.error(e); }
    };

    // 3. Envoyer les modifications
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`https://127.0.0.1:8000/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    role: 'ROLE_' + role,
                    service_id: serviceId || null
                })
            });

            if (res.ok) {
                onSuccess(); // Rafraichir la liste parente
                onClose();   // Fermer la modale
            } else {
                alert("Erreur lors de la mise à jour");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Modifier {user.nom}</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* SELECTEUR DE ROLE */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="EMPLOYE">Employé (Standard)</option>
                            <option value="CAISSIER">Caissier</option>
                            <option value="CHEF_SERVICE">Chef de Service</option>
                            <option value="MANAGER">Manager (Admin)</option>
                        </select>
                    </div>

                    {/* SELECTEUR DE SERVICE */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                        <select 
                            value={serviceId} 
                            onChange={(e) => setServiceId(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Aucun Service --</option>
                            {services.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.nom}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            {loading ? 'Enregistrement...' : <><Save size={18} /> Enregistrer</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}