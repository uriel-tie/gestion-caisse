import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import type { UserData } from './types';

function App() {
  // 1. ÉTAT GLOBAL : On charge l'utilisateur depuis le localStorage au démarrage
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  
  const [user, setUser] = useState<UserData | null>(() => {
    const savedUser = localStorage.getItem('user_data');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. ACTIONS : Fonctions pour modifier l'état global
  
  const handleLoginSuccess = (newToken: string, userData: UserData) => {
    localStorage.setItem('jwt_token', newToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
  };

  // 3. ROUTING : La logique de navigation
  return (
    <BrowserRouter>
      <Routes>
        {/* Si déjà connecté -> Dashboard, sinon -> Login */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
          } 
        />

        {/* Si pas connecté -> Login, sinon -> Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            user ? <DashboardPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;