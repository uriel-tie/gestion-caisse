import React from 'react';
import type { UserData } from '../types';
import DashboardManager from './DashboardManager';
import DashboardCaissier from './DashboardCaissier';
import { DashboardEmploye } from './DashboardEmploye';
import DashboardChef from './DashboardChef';

// 1. On définit ce que ce composant attend comme données (Props)
interface DashboardPageProps {
  user: UserData;
  onLogout: () => void;
}

// 2. On définit le composant en lui disant d'utiliser ces Props
const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {

  // Fonction utilitaire pour vérifier le rôle
  // Gère le cas où roles est un tableau ['ROLE_ADMIN', 'ROLE_USER'] ou une string
  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    if (Array.isArray(user.roles)) {
      return user.roles.includes(roleName);
    }
    return user.roles === roleName;
  };

  // --- LOGIQUE D'AFFICHAGE SELON LE RÔLE ---

  if (hasRole('ROLE_EMPLOYE')) {
  
    return <DashboardEmploye user={user} onLogout={onLogout} />;
  }

  if (hasRole('ROLE_MANAGER')) {
    // On transmet les infos reçues au Manager
    return <DashboardManager user={user} onLogout={onLogout} />;
  }

  if (hasRole('ROLE_CAISSIER')) {
    // On transmet les infos reçues au Caissier
    return <DashboardCaissier user={user} onLogout={onLogout} />;
  }

  if (hasRole('ROLE_CHEF_SERVICE')) {
    return <DashboardChef user={user} onLogout={onLogout} />;
}

  // Si on est Admin, on peut rediriger ou afficher un message spécifique
  if (hasRole('ROLE_ADMIN')) {
      return (
          <div className="p-6">
              <h1>Compte Administrateur</h1>
              <p>Veuillez accéder à la route /admin.</p>
              <button onClick={onLogout} className="btn btn-primary">Déconnexion</button>
          </div>
      );
  }

  // --- FALLBACK (Si aucun rôle ne correspond) ---
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h2>
        <p className="text-gray-700 mb-6">
          Votre rôle actuel (<code>{JSON.stringify(user.roles)}</code>) n'est pas configuré pour ce tableau de bord.
        </p>
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;