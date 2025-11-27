import React, { useState } from 'react';
import { ArrowLeft, Settings, Users } from 'lucide-react';
// Ajout de 'Navigate' dans les imports
import { useNavigate, Navigate } from 'react-router-dom';
import type { UserData } from '../types';
import AdminStructure from '../components/AdminStructure';
import AdminUsers from '../components/AdminUsers';

interface AdminPageProps {
    user: UserData;
    onLogout: () => void;
}

export default function AdminPage({ user }: AdminPageProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'structure' | 'users'>('users');

    // 1. CALCUL DES DROITS (Synchrone)
    const roles = user?.roles || [];
    const hasAccess = Array.isArray(roles) ? roles.includes('ROLE_MANAGER') : roles === 'ROLE_MANAGER';

    // 2. REDIRECTION SÉCURISÉE (Au lieu de useEffect)
    // On retourne le composant <Navigate> directement. 
    // "replace" est crucial pour éviter l'avertissement "history.pushState" que vous avez vu.
    if (!hasAccess) {
        return <Navigate to="/dashboard" replace />;
    }

    // 3. RENDU DE LA PAGE (Si on a l'accès)
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