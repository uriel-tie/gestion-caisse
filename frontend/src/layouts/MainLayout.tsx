import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, Bell, X, User } from 'lucide-react';
import { NAVIGATION } from '../config/navigation';
import type { UserData } from '../types';

interface MainLayoutProps {
  user: UserData;
  onLogout: () => void;
  children?: React.ReactNode; // On accepte les enfants
}

export default function MainLayout({ user, onLogout, children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Pour savoir quelle page est active

  // Filtrage du menu selon les rôles
  const filteredNav = NAVIGATION.filter(item => {
    if (item.roles.includes('ALL')) return true;
    return item.roles.some(role => user.roles.includes(role));
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl z-20`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-slate-800 bg-slate-950">
            {isSidebarOpen ? (
               <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                   <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">OC</div>
                   <span>ORBIS CAISSE</span>
               </div>
            ) : (
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">OC</div>
            )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
          {filteredNav.map((item) => {
             const isActive = location.pathname.startsWith(item.path);
             return (
              <div key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  <item.icon size={22} className={`min-w-[22px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  
                  <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${
                    isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
            <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                {isSidebarOpen && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {user.nom.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.nom.split(' ')[0]}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}
                <button 
                    onClick={onLogout}
                    className="text-slate-400 hover:text-red-400 transition p-1 rounded-md hover:bg-slate-800"
                    title="Déconnexion"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 border-b border-gray-100">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
                <Bell size={20} className="text-gray-400 hover:text-gray-600 cursor-pointer transition" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                    {user.roles[0]?.replace('ROLE_', '') || 'EMPLOYE'}
                </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth bg-gray-50/50">
             {children ? children : <Outlet />}
        </main>
        
      </div>
    </div>
  );
}