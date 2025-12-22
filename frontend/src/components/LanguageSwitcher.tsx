import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button 
        onClick={() => changeLanguage('fr')}
        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
            i18n.language.startsWith('fr') ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        FR
      </button>
      <button 
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
            i18n.language.startsWith('en') ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </button>
    </div>
  );
}