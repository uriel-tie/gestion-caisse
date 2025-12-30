import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Shield, Users, TrendingUp, Settings } from 'lucide-react'; 
import type { UserData } from '../types';
import CaissesLiveView from '../components/CaissesLiveView';
import NotificationWidget from '../components/NotificationWidget';

interface DashboardProps {
  user: UserData;
  onLogout: () => void;
}

export default function DashboardManager({ user }: DashboardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto">
        
        {/* Header simple avec Bienvenue */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('pages.dashboardManager.title')}</h1>
                <p className="text-gray-500 mt-1">{t('pages.dashboardManager.subtitle')}</p>
            </div>
            {/* Widget KPI rapide (Optionnel) */}
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp size={20} className="text-green-600"/>
                </div>
                <div>
                    <span className="block text-xs text-gray-500 uppercase font-bold">{t('pages.dashboardManager.kpi.state_label')}</span>
                    <span className="block text-sm font-bold text-green-600">{t('pages.dashboardManager.kpi.operational')}</span> 
                </div>
            </div>
        </div>
   
        {/* VUE EN DIRECT DES CAISSES */}
        {/* On laisse ce composant gérer son propre affichage (polling) */}
        <section className="mb-10">
            <CaissesLiveView />
        </section>

        {/* ACTIONS RAPIDES (Cartes) */}
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t('pages.dashboardManager.actions_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Carte Validations */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-pointer"
                 onClick={() => navigate('/manager/validations')}>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition">
                        <FileText className="h-6 w-6 text-blue-600"/> 
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition"/>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{t('pages.dashboardManager.cards.validations.title')}</h3>
                <p className="text-sm text-gray-500">
                    {t('pages.dashboardManager.cards.validations.desc')}
                </p>
            </div>

            {/* Carte Historique Financier */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-pointer"
                 onClick={() => navigate('/manager/history')}>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-50 p-3 rounded-lg group-hover:bg-purple-100 transition">
                        <TrendingUp className="h-6 w-6 text-purple-600"/> 
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-purple-600 transition"/>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{t('pages.dashboardManager.cards.history.title')}</h3>
                <p className="text-sm text-gray-500">
                    {t('pages.dashboardManager.cards.history.desc')}
                </p>
            </div>

            {/* Carte Administration */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-pointer"
                 onClick={() => navigate('/admin')}>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg group-hover:bg-gray-100 transition">
                        <Settings className="h-6 w-6 text-gray-600"/> 
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-gray-600 transition"/>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{t('pages.dashboardManager.cards.admin.title')}</h3>
                <p className="text-sm text-gray-500">
                    {t('pages.dashboardManager.cards.admin.desc')}
                </p>
            </div>
        </div>
    </div>
  );
}