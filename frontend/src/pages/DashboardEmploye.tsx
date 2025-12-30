import { useTranslation } from 'react-i18next';
import { AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MyRequestsWidget } from '../components/MyRequestsWidget';
import type { UserData } from '../types';

interface DashboardEmployeProps {
  user: UserData;
  onLogout: () => void; // On garde la prop même si inutilisée ici (compatibilité)
}

export default function DashboardEmploye({ user }: DashboardEmployeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* En-tête de bienvenue */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('pages.dashboardEmploye.greeting', { name: user.nom.split(' ')[0] })} 👋</h1>
          <p className="text-gray-500 mt-1">{t('pages.dashboardEmploye.subtitle')}</p>
        </div>
        <button 
            onClick={() => navigate('/requests/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all font-bold"
        >
            <Plus size={20} /> {t('pages.dashboardEmploye.actions.new_request')}
        </button>
      </div>

      {/* Grille de contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne Principale : Widget des demandes récentes */}
        <div className="lg:col-span-2 space-y-6">
           {/* On enveloppe le widget pour lui donner un style cohérent */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-lg font-bold text-gray-800">{t('pages.dashboardEmploye.recent_requests')}</h2>
                   <button 
                      onClick={() => navigate('/requests')} 
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                   >
                      {t('pages.dashboardEmploye.view_all')} <ArrowRight size={16} className="ml-1"/>
                   </button>
               </div>
               {/* Le widget existant s'intègre ici */}
               <MyRequestsWidget /> 
           </div>
        </div>

        {/* Colonne Latérale : Informations & Aide */}
        <div className="space-y-6">
          
          {/* Carte : Circuit de validation */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600 pointer-events-none">
                <AlertCircle size={100} />
             </div>
             
             <h3 className="font-bold text-blue-900 text-lg mb-4 relative z-10">{t('pages.dashboardEmploye.validation_flow.title')}</h3>
             <ul className="space-y-4 relative z-10">
                <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200 mt-0.5">1</span>
                    <p className="ml-3 text-sm text-blue-800">
                        <span className="font-bold block">{t('pages.dashboardEmploye.validation_flow.step1.title')}</span>
                        {t('pages.dashboardEmploye.validation_flow.step1.desc')}
                    </p>
                </li>
                <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200 mt-0.5">2</span>
                    <p className="ml-3 text-sm text-blue-800">
                        <span className="font-bold block">{t('pages.dashboardEmploye.validation_flow.step2.title')}</span>
                        {t('pages.dashboardEmploye.validation_flow.step2.desc')}
                    </p>
                </li>
                <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white font-bold text-xs flex items-center justify-center mt-0.5">3</span>
                    <p className="ml-3 text-sm text-blue-900">
                        <span className="font-bold block">{t('pages.dashboardEmploye.validation_flow.step3.title')}</span>
                        {t('pages.dashboardEmploye.validation_flow.step3.desc')}
                    </p>
                </li>
             </ul>
          </div>

          {/* Carte : Conseil rapide */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-gray-800 mb-2">{t('pages.dashboardEmploye.help.title')}</h4>
              <p className="text-sm text-gray-500 mb-4">
                  {t('pages.dashboardEmploye.help.text')}
              </p>
              <div className="text-xs font-mono bg-gray-100 p-2 rounded text-center text-gray-600">
                  {t('pages.dashboardEmploye.help.email')}
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}