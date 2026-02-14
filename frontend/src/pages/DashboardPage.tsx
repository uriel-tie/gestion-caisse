import React from 'react';
import { useTranslation } from 'react-i18next';
import type { UserData } from '../types';
import DashboardManager from './DashboardManager';
import DashboardCaissier from './DashboardCaissier';
import DashboardEmploye  from './DashboardEmploye';
import DashboardChef from './DashboardChef';

// 1. On définit ce que ce composant attend comme données (Props)
interface DashboardPageProps {
  user: UserData;
  onLogout: () => void;
}

// 2. On définit le composant en lui disant d'utiliser ces Props
const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();

  // Fonction utilitaire pour vérifier le rôle
  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    if (Array.isArray(user.roles)) {
      return user.roles.includes(roleName);
    }
    return user.roles === roleName;
  };

  // --- LOGIQUE D'AFFICHAGE (ORDRE D'IMPORTANCE) ---

  // 1. ADMIN (Le plus haut)
  if (hasRole('ROLE_ADMIN')) {
      return (
          <div className="p-6">
              <h1>{t('pages.dashboard.admin')}</h1>
              <p>{t('pages.dashboard.access_admin')}</p>
              <button onClick={onLogout} className="btn btn-primary">{t('pages.dashboard.logout')}</button>
          </div>
      );
  }

  // 2. MANAGER (Avant Employé !)
  if (hasRole('ROLE_MANAGER')) {
    return <DashboardManager user={user} onLogout={onLogout} />;
  }

  // 3. CHEF DE SERVICE
  if (hasRole('ROLE_CHEF_SERVICE')) {
    return <DashboardChef user={user} onLogout={onLogout} />;
  }

  // 4. CAISSIER
  if (hasRole('ROLE_CAISSIER')) {
    return <DashboardCaissier user={user} onLogout={onLogout} />;
  }

  // 5. EMPLOYÉ (Le rôle de base, à mettre en dernier)
  // Car souvent ROLE_MANAGER ou ROLE_CAISSIER inclut aussi ROLE_EMPLOYE
  if (hasRole('ROLE_EMPLOYE') || hasRole('ROLE_USER')) { 
    return <DashboardEmploye user={user} onLogout={onLogout} />;
  }

  // --- FALLBACK (Si aucun rôle ne correspond) ---
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{t('pages.dashboard.access_denied')}</h2>
        <p className="text-gray-700 mb-6">
          {t('pages.dashboard.role_unknown', { role: JSON.stringify(user.roles) })}
        </p>
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          {t('pages.dashboard.logout')}
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;