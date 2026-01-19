import { 
  Home, FileText, Users, DollarSign, 
  Activity, Shield, Settings, Monitor, CheckSquare 
} from 'lucide-react';

export const NAVIGATION = [
  // --- ÉTATS COMMUNS ---
  { 
    label: 'Accueil', 
    path: '/home', 
    icon: Home, 
    roles: ['ALL'] // Accessible à tous
  },
  { 
    label: 'Mes Demandes', 
    path: '/requests', 
    icon: FileText, 
    roles: ['ROLE_EMPLOYE', 'ROLE_CHEF_SERVICE', 'ROLE_CAISSIER', 'ROLE_MANAGER'] // Exclu ADMIN et SUPER_ADMIN
  },


  // --- EMPLOYÉ (Rien de plus) ---

  // --- CHEF DE SERVICE ---
  { 
    label: 'Validations Équipe', 
    path: '/chef/validations', 
    icon: CheckSquare, 
    roles: ['ROLE_CHEF_SERVICE'] 
  },
  { 
    label: 'Mon Équipe', 
    path: '/chef/team', 
    icon: Users, 
    roles: ['ROLE_CHEF_SERVICE'] 
  },

  // --- CAISSIER ---
  { 
    label: 'Station de Travail', 
    path: '/caisse/workstation', 
    icon: Monitor, 
    roles: ['ROLE_CAISSIER'] 
  },
  { 
    label: 'Historique Caisse', 
    path: '/caisse/history', 
    icon: Activity, 
    roles: ['ROLE_CAISSIER'] 
  },

  // --- MANAGER ---
  { 
    label: 'Supervision Live', 
    path: '/manager/supervision', 
    icon: Activity, 
    roles: ['ROLE_MANAGER'] 
  },
  { 
    label: 'Centre Validation', 
    path: '/manager/validations', 
    icon: CheckSquare, 
    roles: ['ROLE_MANAGER'] 
  },
  { 
    label: 'Historique Financier', 
    path: '/manager/history', 
    icon: DollarSign, 
    roles: ['ROLE_MANAGER'] 
  },
  { 
    label: 'Audit & Sécurité', 
    path: '/manager/audit', 
    icon: Shield, 
    roles: ['ROLE_MANAGER'] 
  },
  
  // --- ADMIN ---
  {
      label: 'Administration',
      path: '/admin',
      icon: Settings,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] // Le manager a aussi accès à certains réglages
  },

  { 
    label: 'profil', 
    path: '/profile', 
    icon: Users, 
    roles: ['ALL'] 
  },
];