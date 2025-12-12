import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// IMPORTS DES PAGES
import LoginPage from './pages/LoginPage';
import DashboardEmploye from './pages/DashboardEmploye'; // Page d'accueil par défaut
import AdminPage from './pages/AdminPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';
import ManagerValidationPage from './pages/ManagerValidationPage';
import ProfilePage from './pages/ProfilePage';
import HistoriquePage from './pages/HistoriquePage';
import CaisseHistoryPage from './pages/CaisseHistoryPage';
import AuditPage from './pages/AuditPage';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';

// IMPORTS NOUVEAUX
import RequestsPage from './pages/RequestsPage';
import NewRequestPage from './pages/NewRequestPage';
import ChefValidationPage from './pages/ChefValidationPage';
import MyTeamPage from './pages/MyTeamPage';
import WorkstationPage from './pages/WorkstationPage'; // On va le créer juste après
import CaissesLiveView from './components/CaissesLiveView';

// TYPES & LAYOUT
import type { UserData } from './types';
import MainLayout from './layouts/MainLayout';

// --- AUTH GUARD ---
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

            if (!token || !storedUserString) {
                onLogout();
                return;
            }

            try {
                const storedUser = JSON.parse(storedUserString);
                const userId = storedUser.id; 

                const response = await fetch(`https://127.0.0.1:8000/api/users/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json' 
                    }
                });

                if (!response.ok) throw new Error("Session expirée");

                const freshUserData: UserData = await response.json();
                setUser(freshUserData);
                localStorage.setItem('user', JSON.stringify(freshUserData));
                setIsValidating(false);

            } catch (error) {
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
                {/* --- ROUTE PUBLIQUE (ACCUEIL) --- */}
                <Route path="/" element={<LandingPage />} />
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

                {/* ROUTES PROTÉGÉES AVEC LAYOUT */}
                {isAuthenticated ? (
                    <Route element={<AuthGuard setUser={setUser} onLogout={handleLogout}><MainLayout user={user} onLogout={handleLogout} /></AuthGuard>}>

                        <Route path="/dashboard" element={<HomePage user={user} />} />
                        
                        {/* DISPATCHER */}
                        <Route path="/dashboard" element={<DashboardDispatcher user={user} />} />

                        {/* COMMUNS */}
                        <Route path="/requests" element={<RequestsPage />} />
                        <Route path="/requests/new" element={<NewRequestPage />} />
                        <Route path="/profile" element={<ProfilePage />} />

                        {/* EMPLOYÉ / CHEF */}
                        <Route path="/chef/validations" element={<ChefValidationPage />} />
                        <Route path="/chef/team" element={<MyTeamPage />} />

                        {/* CAISSIER */}
                        <Route path="/workstation" element={<WorkstationPage user={user} />} />
                        <Route path="/caisse/history" element={<CaisseHistoryPage />} />

                        {/* MANAGER */}
                        <Route path="/manager/supervision" element={<CaissesLiveView />} />
                        <Route path="/manager/validations" element={<ManagerValidationPage user={user} onLogout={handleLogout} />} />
                        <Route path="/manager/history" element={<HistoriquePage />} />
                        <Route path="/manager/audit" element={<AuditPage />} />
                        
                        {/* ADMIN */}
                        <Route path="/admin/*" element={<AdminPage user={user} onLogout={handleLogout} />} />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                ) : (
                    <Route path="*" element={<Navigate to="/login" />} />
                )}
            </Routes>
        </Router>
    );
}

const DashboardDispatcher = ({ user }: { user: UserData }) => {
    if (user.roles.includes('ROLE_CAISSIER')) return <Navigate to="/workstation" replace />;
    if (user.roles.includes('ROLE_MANAGER')) return <Navigate to="/manager/supervision" replace />;
    if (user.roles.includes('ROLE_CHEF_SERVICE')) return <Navigate to="/chef/validations" replace />;
    
    // Par défaut (Employé)
    return <DashboardEmploye user={user} onLogout={() => {}} />;
};

export default App;