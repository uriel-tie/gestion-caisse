import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, Settings } from 'lucide-react';
import { NAVIGATION } from '../config/navigation';
import type { UserData } from '../types';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface AdminLayoutProps {
  user: UserData;
  onLogout: () => void;
  children?: React.ReactNode;
}

export default function AdminLayout({ user, onLogout, children }: AdminLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Filtrage du menu pour les super admins uniquement
  const filteredNav = NAVIGATION.filter(item => {
    if (item.roles.includes('ALL')) return true;
    if (!user?.roles) return false; 
    return item.roles.some(role => user.roles.includes(role));
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Settings size={18} className="text-white" />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg text-white tracking-tight truncate">SUPER ADMIN</span>
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
                    ? 'bg-purple-600 text-white font-semibold shadow-lg shadow-purple-600/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-400'} />
                {isSidebarOpen && <span className="text-sm truncate">{t(item.label)}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
            <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                {isSidebarOpen && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {user?.nom?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {user?.nom || 'Super Admin'}
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
            className="text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white bg-purple-600 px-3 py-1 rounded-full">
                    SUPER ADMIN
                </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50">
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
