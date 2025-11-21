import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserData } from '../types';
import AdminStructure from '../components/AdminStructure';
import AdminUsers from '../components/AdminUsers';

interface AdminPageProps {
    user: UserData; // Pour vérifier si on a le droit d'être là
    onLogout: () => void;
}

export default function AdminPage({ user }: AdminPageProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'structure' | 'users'>('users');

    // DEBUG : Pour vérifier dans la console
    console.log("👮‍♂️ ADMIN GUARD - Utilisateur :", user.nom);
    console.log("🔑 Rôles détectés :", user.roles);

    // SÉCURITÉ ROBUSTE : On utilise useEffect pour la redirection
    useEffect(() => {
        if (!user.roles.includes('ROLE_MANAGER')) {
            console.warn("⛔ Accès refusé : Redirection vers Dashboard");
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Pendant que React vérifie (ou si pas Manager), on n'affiche rien pour éviter le "flash"
    if (!user.roles.includes('ROLE_MANAGER')) {
        return null; 
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <button 
                            onClick={() => navigate('/dashboard')} 
                            className="mr-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-6 w-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Administration</h1>
                            <p className="text-gray-500 text-sm mt-1">Gestion globale de l'entreprise</p>
                        </div>
                    </div>
                </div>

                {/* Onglets de navigation */}
                <div className="flex space-x-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-4 px-4 flex items-center font-medium transition-colors ${activeTab === 'users' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="mr-2 h-5 w-5" /> Gestion du Personnel
                    </button>
                    <button
                        onClick={() => setActiveTab('structure')}
                        className={`pb-4 px-4 flex items-center font-medium transition-colors ${activeTab === 'structure' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Settings className="mr-2 h-5 w-5" /> Services & Caisses
                    </button>
                </div>

                {/* Contenu Dynamique */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'users' ? <AdminUsers /> : <AdminStructure />}
                </div>
            </div>
        </div>
    );
}