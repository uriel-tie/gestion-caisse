import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Monitor, FileText, Activity, Users, Shield, 
  ArrowRight, Plus, Clock, DollarSign, CheckCircle 
} from 'lucide-react';
import type { UserData } from '../types';

interface HomePageProps {
  user: UserData;
}

export default function HomePage({ user }: HomePageProps) {
  const navigate = useNavigate();
  const role = user.roles && user.roles.length > 0 ? user.roles[0] : 'EMPLOYE';

  // Helper pour afficher le rôle proprement
  const getRoleLabel = (r: string) => {
    if (r.includes('MANAGER')) return 'Manager';
    if (r.includes('CAISSIER')) return 'Caissier';
    if (r.includes('CHEF')) return 'Chef de Service';
    if (r.includes('ADMIN')) return 'Administrateur';
    if (r.includes('SUPER_ADMIN')) return 'Super Administrateur';
    return 'Collaborateur';
  };

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* 1. En-tête de Bienvenue */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity size={150} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Ravi de vous revoir, {user.nom.split(' ')[0]} ! 👋
          </h1>
          <p className="text-blue-200 text-lg flex items-center gap-2">
            <span className="bg-blue-800/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-700">
              {getRoleLabel(role)}
            </span>
            <span className="text-sm opacity-80">
              — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </p>
        </div>
      </div>

      {/* 2. Grille de Raccourcis (Selon le Rôle) */}
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ArrowRight className="text-blue-600" /> Accès Rapide
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* --- BLOC COMMUN : TOUS LES UTILISATEURS --- */}
        <div 
          onClick={() => navigate('/requests/new')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
            <Plus size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Nouvelle Demande</h3>
          <p className="text-sm text-gray-500">Créer un bon de caisse ou une fiche de besoin.</p>
        </div>

        <div 
          onClick={() => navigate('/requests')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
            <FileText size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Mes Demandes</h3>
          <p className="text-sm text-gray-500">Suivre l'état de mes demandes en cours.</p>
        </div>

        {/* --- BLOC CAISSIER --- */}
        {role.includes('CAISSIER') && (
          <>
            <div 
              onClick={() => navigate('/workstation')}
              className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition cursor-pointer group"
            >
              <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition">
                <Monitor size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Ma Caisse</h3>
              <p className="text-sm text-gray-500">Accéder à la station de travail pour encaisser/décaisser.</p>
            </div>
            
            <div 
              onClick={() => navigate('/caisse/history')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group"
            >
              <div className="bg-gray-50 w-12 h-12 rounded-lg flex items-center justify-center text-gray-600 mb-4">
                <Clock size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Journal</h3>
              <p className="text-sm text-gray-500">Voir l'historique de mes opérations.</p>
            </div>
          </>
        )}

        {/* --- BLOC CHEF DE SERVICE --- */}
        {role.includes('CHEF') && (
          <>
            <div 
              onClick={() => navigate('/chef/validations')}
              className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-orange-500 hover:shadow-md transition cursor-pointer group"
            >
              <div className="bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center text-orange-600 mb-4">
                <CheckCircle size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Validations</h3>
              <p className="text-sm text-gray-500">Demandes de l'équipe en attente.</p>
            </div>
            <div 
              onClick={() => navigate('/chef/team')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
            >
              <div className="bg-teal-50 w-12 h-12 rounded-lg flex items-center justify-center text-teal-600 mb-4">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Mon Équipe</h3>
              <p className="text-sm text-gray-500">Gérer les membres du service.</p>
            </div>
          </>
        )}

        {/* --- BLOC MANAGER --- */}
        {role.includes('MANAGER') && (
          <>
            <div 
              onClick={() => navigate('/manager/supervision')}
              className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-purple-600 hover:shadow-md transition cursor-pointer"
            >
              <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                <Activity size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Supervision Live</h3>
              <p className="text-sm text-gray-500">État des caisses en temps réel.</p>
            </div>

            <div 
              onClick={() => navigate('/manager/history')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
            >
              <div className="bg-yellow-50 w-12 h-12 rounded-lg flex items-center justify-center text-yellow-600 mb-4">
                <DollarSign size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Finance</h3>
              <p className="text-sm text-gray-500">Historique global et comptabilité.</p>
            </div>

            <div 
              onClick={() => navigate('/admin')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
            >
              <div className="bg-gray-50 w-12 h-12 rounded-lg flex items-center justify-center text-gray-600 mb-4">
                <Shield size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Admin</h3>
              <p className="text-sm text-gray-500">Paramétrage système.</p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}