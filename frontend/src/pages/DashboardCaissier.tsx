import React, { useEffect, useState } from 'react';
import { LogOut, Activity, Search, ArrowRight } from 'lucide-react';
import type { UserData } from '../types';
import SoldeCard from '../components/SoldeCard';
import JournalTable from '../components/JournalTable';
import EncaissementModal from '../components/EncaissementModal';
import DecaissementModal from '../components/DecaissementModal';
import MyRequestsWidget from '../components/MyRequestsWidget';

interface DashboardProps {
  user: UserData;
  onLogout: () => void;
}

export default function DashboardCaissier({ user, onLogout }: DashboardProps) {
  const [showEncaissement, setShowEncaissement] = useState(false);
  const [showDecaissement, setShowDecaissement] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [assignedCaisse, setAssignedCaisse] = useState<any | null>(null);
  const [fondCaisse, setFondCaisse] = useState('0');
  const [openError, setOpenError] = useState<string | null>(null);
  const [openSuccess, setOpenSuccess] = useState<string | null>(null);
  const [openLoading, setOpenLoading] = useState(false);

  const handleSuccess = () => window.location.reload();

  const fetchSession = async () => {
    setSessionLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/sessions/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSessionStatus(data.statut);
          setSessionInfo(data);
        } else {
          setSessionStatus('AUCUNE');
          setSessionInfo(null);
        }
      } else {
        setSessionStatus('AUCUNE');
        setSessionInfo(null);
      }
    } catch (error) {
      console.error('Erreur récupération session', error);
      setSessionStatus('AUCUNE');
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchAssignedCaisse = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/caisses/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignedCaisse(data);
      } else {
        setAssignedCaisse(null);
      }
    } catch (error) {
      console.error('Erreur récupération caisse assignée', error);
      setAssignedCaisse(null);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchAssignedCaisse();
  }, []);

  const handleOpenSession = async () => {
    if (!assignedCaisse) {
      setOpenError("Aucune caisse assignée.");
      return;
    }
    setOpenError(null);
    setOpenSuccess(null);
    setOpenLoading(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/sessions/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ montant_ouverture: parseFloat(fondCaisse) || 0 }),
      });

      const data = await res.json();

      if (res.ok) {
        setOpenSuccess('Session ouverte ! Bon travail.');
        setFondCaisse('0');
        fetchSession();
      } else {
        setOpenError(data.error || "Impossible d'ouvrir la session.");
      }
    } catch (error) {
      setOpenError('Erreur technique. Merci de réessayer.');
    } finally {
      setOpenLoading(false);
    }
  };

  const renderStationContent = () => {
    if (sessionLoading) {
      return (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      );
    }

    if (sessionStatus === 'OUVERTE') {
      return (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">Poste actif</p>
              <p className="text-xl font-semibold text-gray-900">
                Caisse {sessionInfo?.caisse || '—'}
              </p>
              <p className="text-xs text-gray-400">
                Ouverte depuis {sessionInfo?.date_ouverture ? new Date(sessionInfo.date_ouverture).toLocaleString('fr-FR') : '—'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchSession}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Rafraîchir
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                Se déconnecter
              </button>
            </div>
          </div>

          <div className="mt-6">
            <SoldeCard />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div
              onClick={() => setShowEncaissement(true)}
              className="p-6 bg-green-50 border border-green-100 rounded-xl hover:border-green-400 hover:shadow-lg transition-all cursor-pointer"
            >
              <h3 className="text-lg font-bold text-green-800">Encaissement</h3>
              <p className="text-sm text-green-700 mt-2">Recevoir un paiement</p>
            </div>
            <div
              onClick={() => setShowDecaissement(true)}
              className="p-6 bg-red-50 border border-red-100 rounded-xl hover:border-red-400 hover:shadow-lg transition-all cursor-pointer"
            >
              <h3 className="text-lg font-bold text-red-800">Décaissement</h3>
              <p className="text-sm text-red-700 mt-2">Sortie d'espèces</p>
            </div>
          </div>
        </>
      );
    }

    if (sessionStatus === 'EN_ATTENTE') {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-orange-800 space-y-4">
          <h3 className="text-lg font-semibold">Session en cours de validation...</h3>
          <p className="text-sm">Merci de patienter pendant la validation par votre manager.</p>
          <button
            onClick={fetchSession}
            className="px-4 py-2 bg-white text-orange-700 rounded-lg font-semibold hover:bg-orange-100"
          >
            Rafraîchir le statut
          </button>
        </div>
      );
    }

    if (!assignedCaisse) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800 space-y-4">
          <h3 className="text-lg font-semibold">Aucune caisse assignée</h3>
          <p className="text-sm">Contactez votre manager pour qu'il vous affecte un poste de travail.</p>
          <button
            onClick={fetchAssignedCaisse}
            className="px-4 py-2 bg-white text-yellow-700 rounded-lg font-semibold hover:bg-yellow-100"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-500">Votre poste affecté</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{assignedCaisse.nom}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fond de caisse initial (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={fondCaisse}
            onChange={(e) => setFondCaisse(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Ex: 150.00"
          />
        </div>

        {openError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{openError}</div>}
        {openSuccess && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm animate-pulse">{openSuccess}</div>
        )}

        <button
          onClick={handleOpenSession}
          disabled={openLoading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {openLoading ? 'Ouverture...' : 'Ouvrir ma session'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR CAISSIER (Couleur différente pour distinguer ?) */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-xl font-bold text-gray-800">CashFlow Caisse</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user.nom || user.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              CAISSIER
            </span>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EncaissementModal isOpen={showEncaissement} onClose={() => setShowEncaissement(false)} onSuccess={handleSuccess} />
        <DecaissementModal isOpen={showDecaissement} onClose={() => setShowDecaissement(false)} onSuccess={handleSuccess} />

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Station de Travail</h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                {renderStationContent()}
            </div>
        </div>

        {sessionStatus === 'OUVERTE' && (
          <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Historique des Mouvements</h3>
              <JournalTable />

              {/* LIEN AJOUTÉ POUR LE CAISSIER AUSSI */}
              <div className="mt-4 text-center">
                  <button 
                      onClick={() => alert("Accès au journal complet - Page à venir")}
                      className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                  >
                      <Search className="h-4 w-4 mr-1"/> Rechercher une ancienne opération <ArrowRight className="ml-1 h-4 w-4"/>
                  </button>
              </div>
          </div>
        )}

        <div className="mt-8">
            <MyRequestsWidget />
        </div>
        
      </main>
    </div>
  );
}