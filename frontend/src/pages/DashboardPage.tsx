import React, { useEffect, useState } from 'react';
import type { UserData } from '../types';

// Import des pages
import DashboardManager from './DashboardManager';
import DashboardCaissier from './DashboardCaissier';
import ConstructionPage from './ConstructionPage';
import SessionOpeningPage from './SessionOpeningPage'; // <--- NOUVEAU

interface DashboardPageProps {
  user: UserData;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  // État pour stocker l'info de la session
  const [sessionStatus, setSessionStatus] = useState<string | null>(null); 
  const [loadingSession, setLoadingSession] = useState(true);

  // Fonction pour vérifier la session (appelée au montage et après une demande)
  const checkSession = async () => {
    // Si c'est un Manager, pas besoin de session (pour l'instant)
    if (user.roles.includes('ROLE_MANAGER')) {
      setLoadingSession(false);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/sessions/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // data peut être null (pas de session) ou un objet { statut: 'EN_ATTENTE' / 'OUVERTE' }
        setSessionStatus(data ? data.statut : 'AUCUNE');
      } else {
        setSessionStatus('AUCUNE');
      }
    } catch (err) {
      console.error("Erreur check session", err);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, [user]);

  // 1. Écran de chargement pendant qu'on vérifie
  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement de votre espace...</div>;
  }

  // 2. MANAGER (Passe-droit)
  if (user.roles.includes('ROLE_MANAGER')) {
    return <DashboardManager user={user} onLogout={onLogout} />;
  }

  // 3. CAISSIER : Logique de Session
  if (user.roles.includes('ROLE_CAISSIER')) {
    
    // Cas A : Aucune session -> Écran d'ouverture
    if (sessionStatus === 'AUCUNE' || sessionStatus === 'FERMEE') {
        return <SessionOpeningPage user={user} onLogout={onLogout} onSessionRequestSuccess={checkSession} />;
    }

    // Cas B : En attente -> Écran d'attente (on peut faire une page dédiée, mais ici un message suffit)
    if (sessionStatus === 'EN_ATTENTE') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-4">
                <div className="bg-white p-8 rounded-xl shadow max-w-md">
                    <h2 className="text-xl font-bold text-orange-600 mb-2">Demande en attente</h2>
                    <p className="text-gray-600 mb-6">Votre demande d'ouverture a été envoyée.<br/>En attente de validation par un responsable.</p>
                    <button onClick={checkSession} className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 mb-4 w-full">
                        Actualiser
                    </button>
                    <button onClick={onLogout} className="text-gray-400 hover:text-gray-600 text-sm">Se déconnecter</button>
                </div>
            </div>
        );
    }

    // Cas C : Ouverte -> Le vrai Dashboard !
    if (sessionStatus === 'OUVERTE') {
        return <DashboardCaissier user={user} onLogout={onLogout} />;
    }
  }

  // 4. AUTRES RÔLES
  return <ConstructionPage user={user} onLogout={onLogout} />;
};

export default DashboardPage;