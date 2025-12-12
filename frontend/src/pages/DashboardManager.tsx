import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Shield, Users, TrendingUp, Settings } from 'lucide-react'; 
import type { UserData } from '../types';
import CaissesLiveView from '../components/CaissesLiveView';
import NotificationWidget from '../components/NotificationWidget';

interface DashboardProps {
  user: UserData;
  onLogout: () => void;
}

export default function DashboardManager({ user }: DashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
        
        {/* Header simple avec Bienvenue */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Supervision Globale</h1>
                <p className="text-gray-500 mt-1">Vue d'ensemble de la trésorerie et des opérations en cours.</p>
            </div>
            {/* Widget KPI rapide (Optionnel) */}
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp size={20} className="text-green-600"/>
                </div>
                <div>
                    <span className="block text-xs text-gray-500 uppercase font-bold">État Système</span>
                    <span className="block text-sm font-bold text-green-600">Opérationnel</span>
                </div>
            </div>
        </div>
   
        {/* VUE EN DIRECT DES CAISSES */}
        {/* On laisse ce composant gérer son propre affichage (polling) */}
        <section className="mb-10">
            <CaissesLiveView />
        </section>

        {/* ACTIONS RAPIDES (Cartes) */}
        <h2 className="text-xl font-bold text-gray-800 mb-6">Actions & Gestion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Carte Validations */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-pointer"
                 onClick={() => navigate('/manager/validations')}>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition">
                        <FileText className="h-6 w-6 text-blue-600"/> 
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition"/>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Validations</h3>
                <p className="text-sm text-gray-500">
                    Traiter les demandes d'achats, ordres de mission et décaissements exceptionnels.
                </p>
            </div>

            {/* Carte Historique Financier */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-pointer"
                 onClick={() => navigate('/manager/history')}>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-50 p-3 rounded-lg group-hover:bg-purple-100 transition">
                        <TrendingUp className="h-6 w-6 text-purple-600"/> 
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-purple-600 transition"/>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Historique Financier</h3>
                <p className="text-sm text-gray-500">
                    Consulter le journal global des mouvements et exporter les données comptables.
                </p>
            </div>

            {/* Carte Administration */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-pointer"
                 onClick={() => navigate('/admin')}>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg group-hover:bg-gray-100 transition">
                        <Settings className="h-6 w-6 text-gray-600"/> 
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-gray-600 transition"/>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Administration</h3>
                <p className="text-sm text-gray-500">
                    Gérer les utilisateurs, configurer les services et les caisses physiques.
                </p>
            </div>
        </div>
    </div>
  );
}