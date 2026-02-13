import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';

// IMPORTS PAGES
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import BonDeCaissePrint from './components/BonDeCaissePrint';

// Pages Protégées
import AdminPage from './pages/AdminPage';
import SuperAdminPage from './pages/SuperAdminPage';
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
import HomePage from './pages/HomePage';

import type { UserData } from './types';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// --- AUTH GUARD (Layout Version) ---
const AuthLayout = ({ user }: { user: UserData | null }) => {
    const location = useLocation();

    // 1. Pas d'utilisateur -> Login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Tout est OK -> On rend les routes enfants
    return <Outlet />;
};

function App() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Erreur parsing user", e);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData: UserData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Chargement...</div>;

    return (
        <Router>
            <Routes>
                {/* --- ROUTES PUBLIQUES --- */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/print/bon/:id" element={<BonDeCaissePrint />} />

                {/* --- ROUTES PROTÉGÉES --- */}
                <Route element={<AuthLayout user={user} />}>
                    
                    {/* Force Change Password */}
                    <Route path="/force-change-password" element={<ForceChangePasswordPage />} />

                    {/* Layout Super Admin (Dédiée) */}
                    <Route 
                        element={
                            user?.roles?.includes('ROLE_SUPER_ADMIN') 
                                ? <AdminLayout user={user!} onLogout={handleLogout} />
                                : <Navigate to="/dashboard" />
                        }
                    >
                        <Route 
                            path="/super-admin" 
                            element={<SuperAdminPage user={user!} onLogout={handleLogout} />} 
                        />
                    </Route>

                    {/* Layout Principal */}
                    <Route element={<MainLayout user={user!} onLogout={handleLogout} />}>
                        
                        {/* Correction : Ajout de onLogout manquant */}
                        <Route path="/dashboard" element={<DashboardPage user={user!} onLogout={handleLogout} />} />
                        
                        {/* Correction : Ajout de user manquant */}
                        <Route path="/home" element={<HomePage user={user!} />} />
                        
                        {/* Correction : Ajout de user manquant (si demandé par ProfilePage) */}
                        <Route path="/profile" element={<ProfilePage />} />
                        
                        {/* Modules */}
                        <Route path="/requests" element={<RequestsPage />} />
                        <Route path="/requests/new" element={<NewRequestPage />} />
                        
                        {/* Caissier - Correction : Ajout de user manquant */}
                        <Route path="/caisse/workstation" element={<WorkstationPage user={user!} />} />
                        <Route path="/caisse/history" element={<CaisseHistoryPage />} />

                        {/* Chef */}
                        <Route path="/chef/validations" element={<ChefValidationPage />} />
                        <Route path="/chef/team" element={<MyTeamPage />} />

                        {/* Manager */}
                        <Route path="/manager/supervision" element={<CaissesLiveView />} />
                        <Route path="/manager/validations" element={<ManagerValidationPage />} />
                        <Route path="/manager/history" element={<HistoriquePage />} />
                        <Route path="/manager/audit" element={<AuditPage />} />

                        {/* Admin Société (Note le /* pour les sous-routes) */}
                        <Route path="/admin/*" element={<AdminPage user={user!} onLogout={handleLogout} />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;