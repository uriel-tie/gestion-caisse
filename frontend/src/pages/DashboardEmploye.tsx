import React, { useState } from 'react';
import {AlertCircle, LogOut } from 'lucide-react';
import { MyRequestsWidget } from '../components/MyRequestsWidget';
import type { UserData } from '../types';

interface DashboardEmployeProps {
  user: UserData;
  onLogout: () => void;
}

export const DashboardEmploye: React.FC<DashboardEmployeProps> = ({ user, onLogout }) => {
  


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Corrigée */}
      <nav className="bg-blue-600 text-white p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold">Espace Employé</h1>
                <div className="flex items-center gap-4">
                    <span className="font-medium"> {user.nom}</span>
                    <button 
                        onClick={onLogout} 
                        className="flex items-center gap-2 bg-blue-700 px-3 py-1 rounded-full hover:bg-blue-800 transition text-sm"
                    >
                        <LogOut size={16} /> Déconnexion
                    </button>
                </div>
            </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
                <p className="text-gray-600 mt-1">Suivez l'état de vos demandes de fonds en temps réel.</p>
            </div>
         
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Widget Mes Demandes (Prend 2 colonnes sur grand écran) */}
          <div className="lg:col-span-2">
            <MyRequestsWidget  />
          </div>

          {/* Info Box - Conseils (Prend 1 colonne) */}
          <div className="space-y-6">
            <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <AlertCircle className="text-blue-500 flex-shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Circuit de validation</h3>
                        <ul className="mt-3 space-y-3">
                            <li className="flex items-center text-sm text-gray-600">
                                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs mr-2">1</span>
                                Validation par le Chef de Service
                            </li>
                            <li className="flex items-center text-sm text-gray-600">
                                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs mr-2">2</span>
                                Validation par le Manager
                            </li>
                            <li className="flex items-center text-sm text-gray-600">
                                <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-2">3</span>
                                Paiement à la Caisse (avec Code)
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};