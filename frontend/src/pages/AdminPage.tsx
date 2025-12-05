import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Users, BookOpen } from 'lucide-react'; // Ajout BookOpen
import { useNavigate } from 'react-router-dom';
import type { UserData } from '../types';
import AdminStructure from '../components/AdminStructure';
import AdminUsers from '../components/AdminUsers';
import AdminCompta from '../components/AdminCompta'; // <--- Import Nouveau

interface AdminPageProps {
    user: UserData;
    onLogout: () => void;
}

export default function AdminPage({ user }: AdminPageProps) {
    const navigate = useNavigate();
    // On ajoute 'compta' dans les types d'onglets
    const [activeTab, setActiveTab] = useState<'structure' | 'users' | 'compta'>('users');

    // ... (Sécurité inchangée) ...

    // Fonction utilitaire pour le style des onglets
    const getTabClass = (tabName: string, colorClass: string) => {
        const isActive = activeTab === tabName;
        return `pb-4 px-4 flex items-center font-medium transition-colors border-b-2 ${
            isActive ? `${colorClass} border-current` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;
    };

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
                            <p className="text-gray-500 text-sm mt-1">Configuration globale du système</p>
                        </div>
                    </div>
                </div>

                {/* Onglets de navigation */}
                <div className="flex space-x-1 mb-8 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={getTabClass('users', 'text-purple-600')}
                    >
                        <Users className="mr-2 h-5 w-5" /> Personnel
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('structure')}
                        className={getTabClass('structure', 'text-blue-600')}
                    >
                        <Settings className="mr-2 h-5 w-5" /> Services & Caisses
                    </button>

                    {/* NOUVEL ONGLET */}
                    <button
                        onClick={() => setActiveTab('compta')}
                        className={getTabClass('compta', 'text-orange-600')}
                    >
                        <BookOpen className="mr-2 h-5 w-5" /> Plan Comptable
                    </button>
                </div>

                {/* Contenu Dynamique */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {activeTab === 'users' && <AdminUsers />}
                    {activeTab === 'structure' && <AdminStructure />}
                    {activeTab === 'compta' && <AdminCompta />}
                </div>
            </div>
        </div>
    );
}