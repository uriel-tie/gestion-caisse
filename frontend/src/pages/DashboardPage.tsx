import React from 'react';
import { LogOut, Activity, ShieldCheck } from 'lucide-react';
import type { UserData } from '../types';

interface DashboardPageProps {
  user: UserData;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-primary-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-200 p-2 rounded-lg">
            <Activity className="h-6 w-6 text-primary-700" />
          </div>
          <span className="text-xl font-bold text-gray-800">Dashboard Caisse</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user.name || user.email}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 rounded-lg bg-gray-200 hover:bg-primary-700 hover:text-white text-gray-500 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-primary-50 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-primary-200 mb-6">
            <ShieldCheck className="h-10 w-10 text-primary-700" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenue, {user.name || user.email} !</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Vous êtes connecté à l'espace de gestion.
          </p>
          
          {/* Cartes d'actions principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
             <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary-700 transition-all cursor-pointer">
                <h3 className="font-bold text-gray-800">Encaissement</h3>
                <p className="text-sm text-gray-500 mt-2">Enregistrer une nouvelle vente</p>
             </div>
             <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary-700 transition-all cursor-pointer">
                <h3 className="font-bold text-gray-800">Journal</h3>
                <p className="text-sm text-gray-500 mt-2">Voir l'historique des opérations</p>
             </div>
             <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary-700 transition-all cursor-pointer">
                <h3 className="font-bold text-gray-800">Clôture</h3>
                <p className="text-sm text-gray-500 mt-2">Fermer la caisse journalière</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
