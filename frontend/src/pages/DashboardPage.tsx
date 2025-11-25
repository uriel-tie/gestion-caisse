import React from 'react';
import type { UserData } from '../types';

// Import des pages
import DashboardManager from './DashboardManager';
import DashboardCaissier from './DashboardCaissier';
import ConstructionPage from './ConstructionPage';

interface DashboardPageProps {
  user: UserData;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  // MANAGER
  if (user.roles.includes('ROLE_MANAGER')) {
    return <DashboardManager user={user} onLogout={onLogout} />;
  }

  // CAISSIER : rediriger systématiquement vers le Dashboard Caissier
  if (user.roles.includes('ROLE_CAISSIER')) {
    return <DashboardCaissier user={user} onLogout={onLogout} />;
  }

  // AUTRES RÔLES
  return <ConstructionPage user={user} onLogout={onLogout} />;
};

export default DashboardPage;