import React from 'react';
import { LogOut, Activity } from 'lucide-react'; // J'ai retiré ShieldCheck car on change le design
import type { UserData } from '../types';

// Import de tes nouveaux composants
// (Ajuste le chemin si nécessaire, ex: './components/SoldeCard')
import SoldeCard from './SoldeCard';
import JournalTable from './JournalTable';

interface DashboardPageProps {
  user: UserData;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50"> {/* Fond gris clair pour faire ressortir les cartes blanches */}
      
      {/* --- NAVBAR (Inchangée) --- */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-pink-100 p-2 rounded-lg"> {/* Changé en Rose selon ta charte */}
            <Activity className="h-6 w-6 text-pink-600" />
          </div>
          <span className="text-xl font-bold text-gray-800">CashFlow Manager</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user.name || user.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {/* On affiche le rôle pour être sûr */}
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
        
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Vue d'ensemble Trésorerie</h2>
            <p className="text-gray-500">Bienvenue, voici l'état actuel de la caisse.</p>
        </div>

        {/* 1. LE SOLDE (Tout en haut pour le Manager) */}
        <div className="mb-8">
            <SoldeCard />
        </div>

        {/* 2. LES ACTIONS RAPIDES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Carte Action 1 */}
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group">
                <h3 className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors">Encaissement Rapide</h3>
                <p className="text-sm text-gray-500 mt-2">Enregistrer une entrée d'argent immédiate</p>
            </div>
            
            {/* Carte Action 2 - Grisée pour le manager s'il ne fait pas de caisse, ou active s'il doit tester */}
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group">
                <h3 className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors">Validation Demandes</h3>
                <p className="text-sm text-gray-500 mt-2">Voir les demandes en attente de validation</p>
            </div>

            {/* Carte Action 3 */}
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group">
                <h3 className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors">Rapport de Clôture</h3>
                <p className="text-sm text-gray-500 mt-2">Consulter les écarts de caisse</p>
            </div>
        </div>

        {/* 3. LE JOURNAL (L'historique) */}
        <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Derniers Mouvements</h3>
            <JournalTable />
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;