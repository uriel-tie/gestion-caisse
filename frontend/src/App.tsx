import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// IMPORTS DES PAGES
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';
import ManagerValidationPage from './pages/ManagerValidationPage';
import type { UserData } from './types';

// --- AUTH GUARD CORRIGÉ ---
const AuthGuard = ({ 
    children, 
    setUser, 
    onLogout 
}: { 
    children: React.ReactNode, 
    setUser: (u: UserData) => void, 
    onLogout: () => void 
}) => {
    const location = useLocation();
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        const checkUserStatus = async () => {
            const token = localStorage.getItem('token');
            const storedUserString = localStorage.getItem('user');

            // 1. Vérif basique : Token + User local requis
            if (!token || !storedUserString) {
                onLogout();
                return;
            }

            try {
                const storedUser = JSON.parse(storedUserString);
                
                // --- CORRECTION ICI ---
                // On ne ping plus /sessions/me (caisse), mais l'utilisateur lui-même via son ID
                // Assure-toi que storedUser.id existe bien (stocké au login)
                const userId = storedUser.id; 

                const response = await fetch(`https://127.0.0.1:8000/api/users/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json' // Important pour Symfony
                    }
                });

                if (!response.ok) {
                    throw new Error(`Utilisateur introuvable ou token invalide (${response.status})`);
                }

                const freshUserData: UserData = await response.json();

                // On met à jour le state et le storage avec les rôles/mdp à jour
                setUser(freshUserData);
                localStorage.setItem('user', JSON.stringify(freshUserData));
                
                setIsValidating(false);

            } catch (error) {
                console.error("Erreur validation utilisateur :", error);
                onLogout();
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

    return children;
};

// --- APP ---
function App() {
    // État initial
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
                {/* LOGIN */}
                <Route 
                    path="/login" 
                    element={!isAuthenticated ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} 
                />

                {/* CHANGE PASSWORD */}
                <Route 
                    path="/change-password-required" 
                    element={
                        isAuthenticated ? (
                            <AuthGuard setUser={setUser} onLogout={handleLogout}>
                                {user?.password_must_be_changed ? <ForceChangePasswordPage /> : <Navigate to="/dashboard" replace />}
                            </AuthGuard>
                        ) : <Navigate to="/login" replace />
                    } 
                />

                {/* DASHBOARD */}
                <Route 
                    path="/dashboard" 
                    element={
                        isAuthenticated ? (
                            <AuthGuard setUser={setUser} onLogout={handleLogout}>
                                {user?.password_must_be_changed 
                                    ? <Navigate to="/change-password-required" replace /> 
                                    : <DashboardPage user={user} onLogout={handleLogout} />
                                }
                            </AuthGuard>
                        ) : <Navigate to="/login" replace />
                    } 
                />

                {/* ADMIN */}
                <Route 
                    path="/admin" 
                    element={
                        isAuthenticated ? (
                            <AuthGuard setUser={setUser} onLogout={handleLogout}>
                                {user?.password_must_be_changed 
                                    ? <Navigate to="/change-password-required" replace /> 
                                    : <AdminPage user={user} onLogout={handleLogout} />
                                }
                            </AuthGuard>
                        ) : <Navigate to="/login" replace />
                    } 
                />

                {/* MANAGER */}
                <Route 
                    path="/manager/validations" 
                    element={
                        isAuthenticated ? (
                            <AuthGuard setUser={setUser} onLogout={handleLogout}>
                                {user?.password_must_be_changed 
                                    ? <Navigate to="/change-password-required" replace /> 
                                    : <ManagerValidationPage user={user} onLogout={handleLogout} />
                                }
                            </AuthGuard>
                        ) : <Navigate to="/login" replace />
                    } 
                />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;