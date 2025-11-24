import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';
import type { UserData } from './types';

function App() {
  // 1. INITIALISATION DES ÉTATS
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token');
  });

  const [user, setUser] = useState<UserData | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // 2. HANDLERS
  const handleLoginSuccess = (token: string, userData: UserData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // 3. FONCTION UTILITAIRE (Définie AVANT le return)
  const isPasswordChangeRequired = () => {
    return user?.password_must_be_changed === true;
  };

  // 4. RENDU (Un seul return, un seul Router)
  return (
    <Router>
      <Routes>
        {/* Route Login : Si déjà connecté, on va au dashboard */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />} 
        />

        {/* Route Changement de mot de passe (Protégée par Auth seulement) */}
        <Route 
            path="/change-password-required" 
            element={isAuthenticated ? <ForceChangePasswordPage /> : <Navigate to="/login" />} 
        />
        
        {/* Route Dashboard (Protégée par Auth ET par le Flag de sécurité) */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated && user ? (
              isPasswordChangeRequired() ? <Navigate to="/change-password-required" /> : <DashboardPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Route Admin (Protégée par Auth ET par le Flag de sécurité) */}
        <Route 
          path="/admin" 
          element={
            isAuthenticated && user ? (
              isPasswordChangeRequired() ? <Navigate to="/change-password-required" /> : <AdminPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;