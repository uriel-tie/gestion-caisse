import React, { useState } from 'react';
import { LogOut, Activity } from 'lucide-react'; 
import type { UserData } from '../types';
import SoldeCard from './SoldeCard';
import JournalTable from './JournalTable';
import EncaissementModal from './EncaissementModal';
import DecaissementModal from './DecaissementModal';

interface DashboardPageProps {
  user: UserData;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  // Gestion des modales
  const [showEncaissementModal, setShowEncaissementModal] = useState(false);
  const [showDecaissementModal, setShowDecaissementModal] = useState(false); // <--- NOUVEAU STATE

  // Rafraîchissement après opération réussie
  const handleOperationSuccess = () => {
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* --- NAVBAR --- */}
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
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              MANAGER
            </span>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 rounded-lg bg-gray-100 hover:bg-pink-600 hover:text-white text-gray-500 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* --- CONTENU PRINCIPAL --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* MODALE ENCAISSEMENT (Vert) */}
        <EncaissementModal 
            isOpen={showEncaissementModal} 
            onClose={() => setShowEncaissementModal(false)}
            onSuccess={handleOperationSuccess}
        />

        {/* MODALE DÉCAISSEMENT (Rouge) - AJOUTÉ ICI */}
        <DecaissementModal 
            isOpen={showDecaissementModal} 
            onClose={() => setShowDecaissementModal(false)}
            onSuccess={handleOperationSuccess}
        />

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Vue d'ensemble Trésorerie</h2>
            <p className="text-gray-500">Bienvenue, voici l'état actuel de la caisse.</p>
        </div>

        <div className="mb-8">
            <SoldeCard />
        </div>

        {/* GRILLE D'ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            
            {/* 1. ENCAISSEMENT */}
            <div 
                onClick={() => setShowEncaissementModal(true)}
                className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-green-500 transition-all cursor-pointer group"
            >
                <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition-colors">Encaissement</h3>
                <p className="text-sm text-gray-500 mt-2">Nouvelle entrée d'argent</p>
            </div>
            
            {/* 2. DÉCAISSEMENT RAPIDE - MAINTENANT ACTIF */}
            <div 
                onClick={() => setShowDecaissementModal(true)} // <--- AJOUT DE L'ACTION ICI
                className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-red-500 transition-all cursor-pointer group"
            >
                <h3 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">Décaissement</h3>
                <p className="text-sm text-gray-500 mt-2">Sortie directe (Frais, Achats)</p>
            </div>

            {/* 3. VALIDATION */}
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer group">
                <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Validations</h3>
                <p className="text-sm text-gray-500 mt-2">Demandes en attente</p>
            </div>

            {/* 4. CLÔTURE */}
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-purple-500 transition-all cursor-pointer group">
                <h3 className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors">Clôture</h3>
                <p className="text-sm text-gray-500 mt-2">Fermer la journée</p>
            </div>
        </div>

        <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Derniers Mouvements</h3>
            <JournalTable />
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;