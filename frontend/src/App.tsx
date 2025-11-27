import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// IMPORTS DES PAGES
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';
import ManagerValidationPage from './pages/ManagerValidationPage'; // <--- IMPORT AJOUTÉ
import type { UserData } from './types';

function App() {
  // 1. INITIALISATION ROBUSTE DES ÉTATS
  const [user, setUser] = useState<UserData | null>(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Erreur de lecture user:", e);
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    return !!token && !!storedUser;
  });

  // Effet de sécurité
  useEffect(() => {
    if (isAuthenticated && !user) {
      console.warn("État incohérent détecté (Auth sans User). Déconnexion forcée.");
      handleLogout();
    }
  }, [isAuthenticated, user]);

  // 2. HANDLERS
  const handleLoginSuccess = (token: string, userData: UserData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    
    setUser(null);
    setIsAuthenticated(false);
  };

  // 3. FONCTION UTILITAIRE
  const isPasswordChangeRequired = () => {
    return user?.password_must_be_changed === true;
  };

  // 4. RENDU
  return (
    <Router>
      <Routes>
        {/* Route Login */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Route Changement de mot de passe */}
        <Route 
            path="/change-password-required" 
            element={isAuthenticated ? <ForceChangePasswordPage /> : <Navigate to="/login" replace />} 
        />
        
        {/* Route Dashboard (Menu Principal) */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated && user ? (
              isPasswordChangeRequired() ? <Navigate to="/change-password-required" replace /> : <DashboardPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Route Admin */}
        <Route 
          path="/admin" 
          element={
            isAuthenticated && user ? (
              isPasswordChangeRequired() ? <Navigate to="/change-password-required" replace /> : <AdminPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* --- NOUVELLE ROUTE : VALIDATION MANAGER --- */}
        <Route 
          path="/manager/validations" 
          element={
            isAuthenticated && user ? (
               // Vérification Password + Appel du bon composant ManagerValidationPage
              isPasswordChangeRequired() ? (
                  <Navigate to="/change-password-required" replace />
              ) : (
                  <ManagerValidationPage user={user} onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;