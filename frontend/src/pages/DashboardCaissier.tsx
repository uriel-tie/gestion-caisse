import React, { useState } from 'react';
import { LogOut, Activity, Search, ArrowRight } from 'lucide-react';
import type { UserData } from '../types';
import SoldeCard from '../components/SoldeCard';
import JournalTable from '../components/JournalTable';
import EncaissementModal from '../components/EncaissementModal';
import DecaissementModal from '../components/DecaissementModal';

interface DashboardProps {
  user: UserData;
  onLogout: () => void;
}

export default function DashboardCaissier({ user, onLogout }: DashboardProps) {
  const [showEncaissement, setShowEncaissement] = useState(false);
  const [showDecaissement, setShowDecaissement] = useState(false);
  const handleSuccess = () => window.location.reload();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR CAISSIER (Couleur différente pour distinguer ?) */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-xl font-bold text-gray-800">CashFlow Caisse</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user.nom || user.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              CAISSIER
            </span>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EncaissementModal isOpen={showEncaissement} onClose={() => setShowEncaissement(false)} onSuccess={handleSuccess} />
        <DecaissementModal isOpen={showDecaissement} onClose={() => setShowDecaissement(false)} onSuccess={handleSuccess} />

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Opérations de Caisse</h2>
        </div>
        <div className="mb-8"><SoldeCard /></div>

        {/* ACTIONS (Seulement 2 colonnes pour le Caissier) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div onClick={() => setShowEncaissement(true)} className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-green-500 transition-all cursor-pointer group flex flex-col items-center text-center">
                <h3 className="font-bold text-xl text-gray-800 group-hover:text-green-600">Encaissement</h3>
                <p className="text-gray-500 mt-2">Recevoir un paiement</p>
            </div>
            <div onClick={() => setShowDecaissement(true)} className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-red-500 transition-all cursor-pointer group flex flex-col items-center text-center">
                <h3 className="font-bold text-xl text-gray-800 group-hover:text-red-600">Décaissement</h3>
                <p className="text-gray-500 mt-2">Sortie d'espèces</p>
            </div>
        </div>

       <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Historique des Mouvements</h3>
            <JournalTable />

            {/* LIEN AJOUTÉ POUR LE CAISSIER AUSSI */}
            <div className="mt-4 text-center">
                <button 
                    onClick={() => alert("Accès au journal complet - Page à venir")}
                    className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                >
                    <Search className="h-4 w-4 mr-1"/> Rechercher une ancienne opération <ArrowRight className="ml-1 h-4 w-4"/>
                </button>
            </div>
        </div>
        
      </main>
    </div>
  );
}