import React from 'react';
import type { UserData } from '../types';

// Import des sous-dashboards
import DashboardManager from './DashboardManager';
import DashboardCaissier from './DashboardCaissier';
import ConstructionPage from './ConstructionPage';

interface DashboardPageProps {
  user: UserData;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  // LOGIQUE DE REDIRECTION SELON LE RÔLE
  
  // 1. Si c'est un ADMIN ou MANAGER
  if (user.roles.includes('ROLE_MANAGER') || user.roles.includes('ROLE_ADMIN')) {
    return <DashboardManager user={user} onLogout={onLogout} />;
  }

  // 2. Si c'est un CAISSIER
  if (user.roles.includes('ROLE_CAISSIER')) {
    return <DashboardCaissier user={user} onLogout={onLogout} />;
  }

  // 3. Si c'est un CHEF DE SERVICE (Pas encore fait)
  if (user.roles.includes('ROLE_CHEF_SERVICE')) {
    return <ConstructionPage user={user} onLogout={onLogout} />;
  }

  // 4. Si c'est un EMPLOYÉ STANDARD (Pas encore fait)
  return <ConstructionPage user={user} onLogout={onLogout} />;
};

export default DashboardPage;