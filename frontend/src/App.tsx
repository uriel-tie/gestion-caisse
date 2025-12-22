import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// IMPORTS PAGES
import LoginPage from './pages/LoginPage';
// import HomePage from './pages/HomePage'; // <-- On remplace ça
import DashboardPage from './pages/DashboardPage'; // <-- PAR ÇA (Ton dashboard multi-rôles)

import AdminPage from './pages/AdminPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';
import ManagerValidationPage from './pages/ManagerValidationPage';
import ProfilePage from './pages/ProfilePage';
import HistoriquePage from './pages/HistoriquePage';
import CaisseHistoryPage from './pages/CaisseHistoryPage';
import RequestsPage from './pages/RequestsPage';
import NewRequestPage from './pages/NewRequestPage';
import ChefValidationPage from './pages/ChefValidationPage';
import MyTeamPage from './pages/MyTeamPage';
import WorkstationPage from './pages/WorkstationPage';
import CaissesLiveView from './components/CaissesLiveView';
import AuditPage from './pages/AuditPage';
import LandingPage from './pages/LandingPage';
import BonDeCaissePrint from './components/BonDeCaissePrint';
import HomePage from './pages/HomePage';

import type { UserData } from './types';
import MainLayout from './layouts/MainLayout';

// --- AUTH GUARD CORRIGÉ (Plus de boucle infinie !) ---
const AuthGuard = ({ 
    children, 
    user,
    setUser, 
    onLogout 
}: { 
    children: React.ReactNode, 
    user: UserData | null,
    setUser: (u: UserData) => void, 
    onLogout: () => void 
}) => {
    const location = useLocation();
    
    // On vérifie juste si les infos sont là.
    // Si le token est expiré, les requêtes API dans les pages échoueront (401) 
    // et c'est là qu'on gérera la déconnexion, pas ici brutalement.
    const token = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('user');

    if (!token || !storedUserString) {
        // Pas connecté -> Hop, dehors
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // --- SÉCURITÉ MOT DE PASSE ---
    if (user?.password_must_be_changed) {
        if (location.pathname !== '/change-password-required') {
            return <Navigate to="/change-password-required" replace />;
        }
        return <>{children}</>; 
    }

    if (!user?.password_must_be_changed && location.pathname === '/change-password-required') {
        return <Navigate to="/dashboard" replace />;
    }

    // --- AFFICHAGE STANDARD ---
    return <MainLayout user={user!} onLogout={onLogout}>{children}</MainLayout>;
};

// --- APP ---
function App() {
    // Initialisation simple
    const [user, setUser] = useState<UserData | null>(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    // Vérification basique de présence du token
    const isAuthenticated = !!user && !!localStorage.getItem('token');

    const handleLoginSuccess = (token: string, userData: UserData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        // Optionnel : Forcer un reload ou redirection vers login via le router
        window.location.href = '/login';
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                
                {/* LOGIN */}
                <Route 
                    path="/login" 
                    element={!isAuthenticated ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} 
                />

                {/* CHANGEMENT MDP OBLIGATOIRE */}
                <Route 
                    path="/change-password-required" 
                    element={
                        isAuthenticated ? (
                            <AuthGuard user={user} setUser={setUser} onLogout={handleLogout}>
                                <ForceChangePasswordPage />
                            </AuthGuard>
                        ) : <Navigate to="/login" replace />
                    } 
                />

                {isAuthenticated && (
                    <Route path="/print/bon-caisse/:id" element={<BonDeCaissePrint />} />
                )}

                {/* ROUTES PROTÉGÉES */}
                {isAuthenticated ? (
                    <Route path="*" element={
                        <AuthGuard user={user} setUser={setUser} onLogout={handleLogout}>
                            <Routes>
                                {/* --- ICI : ON UTILISE LE DASHBOARD MULTI-ROLE --- */}
                                <Route path="/dashboard" element={<HomePage user={user!} />} />
                                
                                {/* COMMUNS */}
                                <Route path="/requests" element={<RequestsPage />} />
                                <Route path="/requests/new" element={<NewRequestPage />} />
                                <Route path="/profile" element={<ProfilePage />} />

                                {/* CAISSIER */}
                                <Route path="/workstation" element={<WorkstationPage user={user!} />} />
                                <Route path="/caisse/history" element={<CaisseHistoryPage />} />

                                {/* CHEF */}
                                <Route path="/chef/validations" element={<ChefValidationPage />} />
                                <Route path="/chef/team" element={<MyTeamPage />} />

                                {/* MANAGER */}
                                <Route path="/manager/supervision" element={<CaissesLiveView />} />
                                <Route path="/manager/validations" element={<ManagerValidationPage />} />
                                <Route path="/manager/history" element={<HistoriquePage />} />
                                <Route path="/manager/audit" element={<AuditPage />} />

                                {/* ADMIN */}
                                <Route path="/admin/*" element={<AdminPage user={user!} onLogout={handleLogout} />} />

                                {/* DÉFAUT */}
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </AuthGuard>
                    } />
                ) : (
                    <Route path="*" element={<Navigate to="/login" />} />
                )}
            </Routes>
        </Router>
    );
}

export default App;