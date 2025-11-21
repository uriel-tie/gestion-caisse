import React, { useState } from 'react';
import { LogOut, Activity, ArrowRight, Search, Settings } from 'lucide-react'; 
import type { UserData } from '../types';
import SoldeCard from '../components/SoldeCard';
import JournalTable from '../components/JournalTable';
import EncaissementModal from '../components/EncaissementModal';
import DecaissementModal from '../components/DecaissementModal';

interface DashboardProps {
  user: UserData;
  onLogout: () => void;
}

export default function DashboardManager({ user, onLogout }: DashboardProps) {
  const [showEncaissement, setShowEncaissement] = useState(false);
  const [showDecaissement, setShowDecaissement] = useState(false);

  const handleSuccess = () => window.location.reload();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR MANAGER */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-pink-100 p-2 rounded-lg">
            <Activity className="h-6 w-6 text-pink-600" />
          </div>
          <span className="text-xl font-bold text-gray-800">CashFlow Manager</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user.nom || user.email}</p>
            <div className="flex items-center justify-end mt-1">
                {/* BOUTON ADMIN AJOUTÉ ICI */}
                <button 
                    onClick={() => window.location.href = '/admin'} 
                    className="p-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 mr-2 transition-colors"
                    title="Administration"
                >
                    <Settings className="h-4 w-4" /> 
                </button>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                MANAGER
                </span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg bg-gray-100 hover:bg-pink-600 hover:text-white text-gray-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... (Le reste de ton code principal ne change pas) ... */}
        <EncaissementModal isOpen={showEncaissement} onClose={() => setShowEncaissement(false)} onSuccess={handleSuccess} />
        <DecaissementModal isOpen={showDecaissement} onClose={() => setShowDecaissement(false)} onSuccess={handleSuccess} />

        {/* HEADER & SOLDE */}
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Vue d'ensemble Trésorerie</h2>
            <p className="text-gray-500">Bienvenue, voici l'état actuel de la caisse.</p>
        </div>
        <div className="mb-8"><SoldeCard /></div>

        {/* ACTIONS (4 Colonnes) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div onClick={() => setShowEncaissement(true)} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-green-500 transition-all cursor-pointer group">
                <h3 className="font-bold text-gray-800 group-hover:text-green-600">Encaissement</h3>
                <p className="text-sm text-gray-500 mt-2">Nouvelle entrée d'argent</p>
            </div>
            <div onClick={() => setShowDecaissement(true)} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-red-500 transition-all cursor-pointer group">
                <h3 className="font-bold text-gray-800 group-hover:text-red-600">Décaissement</h3>
                <p className="text-sm text-gray-500 mt-2">Sortie directe</p>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer group">
                <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Validations</h3>
                <p className="text-sm text-gray-500 mt-2">Demandes en attente</p>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-purple-500 transition-all cursor-pointer group">
                <h3 className="font-bold text-gray-800 group-hover:text-purple-600">Clôture</h3>
                <p className="text-sm text-gray-500 mt-2">Fermer la journée</p>
            </div>
        </div>

        {/* JOURNAL */}
        <div className="mt-8">
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold text-gray-800">Derniers Mouvements</h3>
            </div>
            <JournalTable />
            
            {/* LIEN VERS JOURNAL COMPLET */}
            <div className="mt-4 text-center">
                <button 
                    onClick={() => alert("Redirection vers la page Journal Complet (À coder demain !)")}
                    className="inline-flex items-center text-sm font-medium text-pink-600 hover:text-pink-800 transition-colors"
                >
                    <Search className="h-4 w-4 mr-1"/> Accéder au journal complet et à la recherche <ArrowRight className="ml-1 h-4 w-4"/>
                </button>
            </div>
        </div>
      </main>
    </div>
  );
}