import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Bell, User } from 'lucide-react';
import { NAVIGATION } from '../config/navigation';
import type { UserData } from '../types';

interface MainLayoutProps {
  user: UserData;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Filtrer les liens selon le rôle
  const filteredNav = NAVIGATION.filter(item => {
    if (item.roles.includes('ALL')) return true;
    return item.roles.some(role => user.roles.includes(role));
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 bg-slate-950">
            <span className="text-xl font-bold tracking-wider text-blue-400">ORBIS CAISSE</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-3 rounded-lg transition-colors text-sm font-medium
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Sidebar (Profil rapide) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                    {user.nom.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.nom}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
            </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center ml-auto space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <button 
                onClick={onLogout}
                className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition"
            >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
             <Outlet />
        </main>
        
        {/* Overlay Mobile */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}
      </div>
    </div>
  );
}