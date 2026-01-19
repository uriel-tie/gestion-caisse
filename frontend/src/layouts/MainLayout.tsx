import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, Bell, User, AlertTriangle, X} from 'lucide-react';
import { NAVIGATION } from '../config/navigation';
import type { UserData } from '../types';
import NotificationWidget from '../components/NotificationWidget';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface MainLayoutProps {
  user: UserData;
  onLogout: () => void;
  children?: React.ReactNode;
  title?: string;
}

export default function MainLayout({ user, onLogout, children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isEmailVerificationClosed, setIsEmailVerificationClosed] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Filtrage sécurisé du menu
  const filteredNav = NAVIGATION.filter(item => {
    if (item.roles.includes('ALL')) return true;
    // Vérification si user et user.roles existent avant d'utiliser .includes
    if (!user?.roles) return false;
    
    // Vérifier les rôles standards
    const hasRole = item.roles.some(role => user.roles.includes(role));
    if (!hasRole) return false;

    // Si l'utilisateur a un rôle personnalisé, vérifier les restrictions
    if (user.customRole?.restrictions && user.customRole.restrictions.includes(item.path)) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-slate-900 font-bold">OC</span>
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg text-white tracking-tight truncate">ORBIS CAISSE</span>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-yellow-500 text-slate-900 font-semibold shadow-lg shadow-yellow-500/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-yellow-500'} />
                {isSidebarOpen && <span className="text-sm truncate">{t(item.label)}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Footer Sécurisé */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
            <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                {isSidebarOpen && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {/* Sécurité charAt */}
                            {user?.nom?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {user?.nom || 'Utilisateur'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                )}
                <button 
                    onClick={onLogout}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Déconnexion"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 border-b border-gray-100">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <NotificationWidget />
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                    {/* Sécurité sur l'accès aux rôles */}
                    {user?.roles?.[0]?.replace('ROLE_', '').replaceAll('_', ' DE ') || 'EMPLOYE'}
                </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {/* Banderolette Vérification Email - Vérification stricte du champ isEmailVerified */}
          {user && user.isEmailVerified === false && !isEmailVerificationClosed && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0">
                  <AlertTriangle className="text-amber-500" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    Vérifiez votre adresse email
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Cela vous permettra de réinitialiser votre mot de passe en cas d'oubli.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Vérifier maintenant
                </button>
                <button 
                  onClick={() => setIsEmailVerificationClosed(true)}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 p-2 rounded-lg transition-colors"
                  title="Masquer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="max-w-7xl mx-auto h-full">
            {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}