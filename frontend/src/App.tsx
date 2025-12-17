import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// IMPORTS PAGES
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage'; // Ta nouvelle page d'accueil
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

import type { UserData } from './types';
import MainLayout from './layouts/MainLayout';

// --- AUTH GUARD INTELLIGENT ---
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
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        const checkUserStatus = async () => {
            const token = localStorage.getItem('token');
            const storedUserString = localStorage.getItem('user');

            if (!token || !storedUserString) {
                onLogout();
                setIsValidating(false);
                return;
            }

            try {
                const storedUser = JSON.parse(storedUserString);
                
                // On vérifie la session via l'API
                const response = await fetch(`https://127.0.0.1:8000/api/users/${storedUser.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json' 
                    }
                });

                if (!response.ok) throw new Error("Session invalide");

                const freshUserData: UserData = await response.json();
                
                // Mise à jour critique du state
                setUser(freshUserData);
                localStorage.setItem('user', JSON.stringify(freshUserData));
                
            } catch (error) {
                console.error("Session expirée:", error);
                onLogout();
            } finally {
                setIsValidating(false);
            }
        };

        checkUserStatus();
    }, [location.pathname]); 

    if (isValidating) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // --- SÉCURITÉ MOT DE PASSE (C'est ici que la magie opère) ---
    if (user?.password_must_be_changed) {
        // Si l'utilisateur doit changer son mot de passe et n'est pas sur la bonne page => Redirection
        if (location.pathname !== '/change-password-required') {
            return <Navigate to="/change-password-required" replace />;
        }
        // S'il est sur la bonne page, on affiche le contenu (le formulaire) sans Layout
        return <>{children}</>; 
    }

    // Si l'utilisateur n'a PAS besoin de changer son mot de passe mais essaie d'accéder à la page => Dashboard
    if (!user?.password_must_be_changed && location.pathname === '/change-password-required') {
        return <Navigate to="/dashboard" replace />;
    }

    // --- AFFICHAGE STANDARD AVEC LAYOUT ---
    // On n'enveloppe dans MainLayout que si on n'est pas sur la page de changement forcé
    return <MainLayout user={user!} onLogout={onLogout}>{children}</MainLayout>;
};

// --- APP ---
function App() {
    const [user, setUser] = useState<UserData | null>(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const isAuthenticated = !!user && !!localStorage.getItem('token');

    const handleLoginSuccess = (token: string, userData: UserData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
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

                {/* PAGE CHANGEMENT MOT DE PASSE (Spéciale) */}
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

                {/* TOUTES LES AUTRES ROUTES PROTÉGÉES */}
                {isAuthenticated ? (
                    <Route path="*" element={
                        <AuthGuard user={user} setUser={setUser} onLogout={handleLogout}>
                            <Routes>
                                {/* ACCUEIL */}
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
                                <Route path="/manager/validations" element={<ManagerValidationPage user={user!} onLogout={handleLogout} />} />
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