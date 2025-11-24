import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Activity, Settings, Search, ArrowRight, FileText, Shield, Users } from 'lucide-react'; 
import type { UserData } from '../types';
import JournalTable from '../components/JournalTable';
import SessionValidationWidget from '../components/SessionValidationWidget';
import CaissesLiveView from '../components/CaissesLiveView';

interface DashboardProps {
  user: UserData;
  onLogout: () => void;
}

export default function DashboardManager({ user, onLogout }: DashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Activity className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-xl font-bold text-gray-800">CashFlow <span className="text-purple-600">Supervision</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user.nom}</p>
            <div className="flex items-center justify-end mt-1">
                {/* Petit raccourci profil */}
                <button className="p-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 mr-2 transition-colors" title="Mon Profil">
                    <Settings className="h-4 w-4" /> 
                </button>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">MANAGER</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. ALERTES (Widget Orange) - Priorité absolue */}
        <SessionValidationWidget />

        <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">État du Parc</h2>
                <p className="text-gray-500">Supervision des caisses physiques en temps réel</p>
            </div>
        </div>

        {/* 2. VUE LIVE DES CAISSES (C'est ici qu'on verra les soldes individuels) */}
        <CaissesLiveView />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            
            {/* COLONNE GAUCHE : LE FLUX (Journal Global) */}
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Flux Financiers Globaux</h3>
                        <p className="text-xs text-gray-500">Consolidated live feed (Toutes caisses)</p>
                    </div>
                    <button className="text-sm text-purple-600 hover:text-purple-800 flex items-center font-medium">
                        <Search className="h-4 w-4 mr-1"/> Recherche avancée
                    </button>
                </div>
                {/* Le tableau prend toute la largeur de sa colonne */}
                <JournalTable />
            </div>

            {/* COLONNE DROITE : ACTIONS DE GESTION */}
            <div className="space-y-6">
                
                {/* CARTE GESTION RH (Validation demandes) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600"/> Gestion RH
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Valider les demandes d'achats et ordres de mission.</p>
                    <button className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors flex justify-center items-center">
                        Voir les demandes <ArrowRight className="h-4 w-4 ml-2"/>
                    </button>
                </div>

                {/* CARTE ADMINISTRATION (Remplacement de Rapports) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Settings className="h-16 w-16 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-purple-600"/> Administration
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Gérer les utilisateurs, les services et les caisses physiques.</p>
                    
                    <button 
                        onClick={() => navigate('/admin')}
                        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex justify-center items-center shadow-md"
                    >
                        <Users className="h-4 w-4 mr-2" /> Accéder à l'Admin
                    </button>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
}