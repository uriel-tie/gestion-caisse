import React, { useState } from 'react';
import { Settings, Users, BookOpen, CreditCard, Building2 } from 'lucide-react';
import type { UserData } from '../types';

// On garde tes composants existants
import AdminStructure from '../components/AdminStructure';
import AdminUsers from '../components/AdminUsers';
import AdminCompta from '../components/AdminCompta'; 
import AdminModes from '../components/AdminModes';
import AdminSoc from '../components/AdminSoc';

interface AdminPageProps {
    user: UserData;
    onLogout: () => void;
}

export default function AdminPage({ user }: AdminPageProps) {
    // Plus besoin de useNavigate ici pour le retour
    const [activeTab, setActiveTab] = useState<'users' | 'structure' | 'compta' | 'modes' | 'soc'>('users');

    const getTabClass = (tabName: string, colorClass: string) => {
        const isActive = activeTab === tabName;
        return `pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            isActive ? `${colorClass} border-current` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Nouvel En-tête simplifié */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Settings className="text-gray-400" size={32} />
                    Administration
                </h1>
                <p className="text-gray-500 mt-2">
                    Configuration globale du système. Certaines actions sensibles sont enregistrées dans l'audit.
                </p>
            </div>

            {/* Navigation par Onglets (Style épuré) */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8">
                     <button 
                        onClick={() => setActiveTab('soc')} 
                        className={getTabClass('soc', 'text-green-600')}
                    >
                         <Building2 size={18} /> Société
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('users')}
                        className={getTabClass('users', 'text-purple-600')}
                    >
                        <Users size={18} /> Personnel
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('structure')}
                        className={getTabClass('structure', 'text-blue-600')}
                    >
                        <Settings size={18} /> Services & Caisses
                    </button>

                    <button
                        onClick={() => setActiveTab('compta')}
                        className={getTabClass('compta', 'text-orange-600')}
                    >
                        <BookOpen size={18} /> Plan Comptable
                    </button>

                    <button 
                        onClick={() => setActiveTab('modes')} 
                        className={getTabClass('modes', 'text-indigo-600')}
                    >
                         <CreditCard size={18} /> Modes Paiement
                    </button>
                </nav>
            </div>

            {/* Zone de Contenu */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                {activeTab === 'users' && <AdminUsers />}
                {activeTab === 'structure' && <AdminStructure />}
                {activeTab === 'compta' && <AdminCompta />}
                {activeTab === 'modes' && <AdminModes />}
                {activeTab === 'soc' && <AdminSoc />}
            </div>
        </div>
    );
}