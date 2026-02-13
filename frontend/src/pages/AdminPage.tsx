import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Users, BookOpen, CreditCard, Building2, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import type { UserData } from '../types';

// On garde tes composants existants
import AdminStructure from '../components/AdminStructure';
import AdminUsers from '../components/AdminUsers';
import AdminCompta from '../components/AdminCompta'; 
import AdminModes from '../components/AdminModes';
import AdminSoc from '../components/AdminSoc';
import AdminCaisse from '../components/AdminCaisse';
import AdminRoles from '../components/AdminRoles';

interface AdminPageProps {
    user: UserData;
    onLogout: () => void;
}

const AdminPage = ({ user }: AdminPageProps) => {
    const [activeTab, setActiveTab] = useState<'personnel' | 'services' | 'caisses' | 'plan_comptable' | 'mode_paiement' | 'societe' | 'roles'>('personnel');
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Définir la liste des onglets et leur clé d'accès pour adminRestrictions
    const TABS = [
        { key: 'societe', label: t('pages.admin.tabs.soc'), icon: <Building2 size={18} />, color: 'text-green-600', component: <AdminSoc /> },
        { key: 'personnel', label: t('pages.admin.tabs.users'), icon: <Users size={18} />, color: 'text-purple-600', component: <AdminUsers /> },
        { key: 'roles', label: t('pages.admin.tabs.roles'), icon: <Settings size={18} />, color: 'text-pink-600', component: <AdminRoles user={user} /> },
        { key: 'services', label: t('pages.admin.tabs.structure'), icon: <Settings size={18} />, color: 'text-blue-600', component: <AdminStructure /> },
        { key: 'caisses', label: t('pages.admin.tabs.caisse'), icon: <Monitor size={18} />, color: 'text-red-600', component: <AdminCaisse /> },
        { key: 'plan_comptable', label: t('pages.admin.tabs.compta'), icon: <BookOpen size={18} />, color: 'text-orange-600', component: <AdminCompta /> },
        { key: 'mode_paiement', label: t('pages.admin.tabs.modes'), icon: <CreditCard size={18} />, color: 'text-indigo-600', component: <AdminModes /> },
    ];

    // Si l'utilisateur a un customRole avec adminRestrictions, on filtre les onglets
    const adminRestrictions = user?.customRole?.adminRestrictions || [];
    const visibleTabs = TABS.filter(tab => !adminRestrictions.includes(tab.key));

    // Redirection si aucun onglet n'est visible ou actif
    useEffect(() => {
        if (visibleTabs.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Accès refusé',
                text: "Vous n'avez pas accès à cette page. Vous serez redirigé dans quelques instants...",
                showConfirmButton: false,
                timer: 2200,
                timerProgressBar: true
            }).then(() => {
                navigate('/home');
            });
        } else if (!visibleTabs.some(tab => tab.key === activeTab)) {
            setActiveTab((visibleTabs[0]?.key as typeof activeTab) || 'personnel');
        }
    }, [visibleTabs, activeTab, navigate]);

    const getTabClass = (tabName: string, colorClass: string) => {
        const isActive = activeTab === tabName;
        return `pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            isActive ? `${colorClass} border-current` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Nouvel En-tête simplifié */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Settings className="text-gray-400" size={32} />
                    {t('pages.admin.title')}
                </h1>
                <p className="text-gray-500 mt-2">
                    {t('pages.admin.subtitle')}
                </p>
            </div>

            {/* Navigation par Onglets (Style épuré) */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={getTabClass(tab.key, tab.color)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Zone de Contenu */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                {visibleTabs.map(tab => (
                    activeTab === tab.key && <div key={tab.key}>{tab.component}</div>
                ))}
            </div>
        </div>
    );
};

export default AdminPage;