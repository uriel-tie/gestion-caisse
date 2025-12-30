import { useTranslation } from 'react-i18next';
import { HardHat, LogOut } from 'lucide-react';
import type { UserData } from '../types';

interface ConstructionPageProps {
  user: UserData;
  onLogout: () => void;
}

export default function ConstructionPage({ user, onLogout }: ConstructionPageProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        <div className="mx-auto bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <HardHat className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('pages.construction.title')}</h1>
        <p className="text-gray-500 mb-6">
          {t('pages.construction.hello')} <strong>{user.nom}</strong>. {t('pages.construction.dev_for', { roles: user.roles.join(', ') })}
        </p>
        <button
          onClick={onLogout}
          className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('pages.construction.logout')}
        </button>
      </div>
    </div>
  );
}