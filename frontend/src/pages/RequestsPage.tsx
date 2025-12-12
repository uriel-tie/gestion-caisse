import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Clock, CheckCircle, XCircle, FileText, ChevronRight } from 'lucide-react';
import { RequestBonViewer } from '../components/RequestBonViewer';

export default function RequestsPage() {
    const navigate = useNavigate();
    const [demandes, setDemandes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDemande, setSelectedDemande] = useState<any>(null); // Pour la modale
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Fetch initial
    const fetchDemandes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://127.0.0.1:8000/api/demandes/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setDemandes(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDemandes(); }, []);

    // Charger le détail pour la modale
    const openDetail = async (id: string) => {
        setLoadingDetail(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://127.0.0.1:8000/api/demandes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSelectedDemande(await res.json());
            }
        } catch (e) {
            alert("Erreur chargement détail");
        } finally {
            setLoadingDetail(false);
        }
    };

    // Helper Statut Badge
    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            'BROUILLON': 'bg-gray-100 text-gray-600',
            'ATTENTE_CHEF': 'bg-blue-100 text-blue-700',
            'ATTENTE_MANAGER': 'bg-purple-100 text-purple-700',
            'VALIDEE_A_PAYER': 'bg-green-100 text-green-700',
            'PAYEE': 'bg-green-200 text-green-900 border-green-300',
            'REFUSEE': 'bg-red-100 text-red-700',
        };
        
        const labels: any = {
            'ATTENTE_CHEF': 'Validation Chef',
            'ATTENTE_MANAGER': 'Validation Manager',
            'VALIDEE_A_PAYER': 'À Payer (Caisse)',
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border border-transparent ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header Page */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mes Demandes</h1>
                    <p className="text-gray-500">Suivez l'état de vos bons de caisse et ordres de mission.</p>
                </div>
                <button 
                    onClick={() => navigate('/requests/new')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all font-medium"
                >
                    <Plus size={20} /> Nouvelle Demande
                </button>
            </div>

            {/* Liste */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar Filtres (Visuel seulement pour l'instant) */}
                <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                        <input type="text" placeholder="Rechercher par n° ou titre..." className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-600 hover:bg-gray-50">
                        <Filter size={16}/> Filtres
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-400">Chargement...</div>
                ) : demandes.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Aucune demande</h3>
                        <p className="text-gray-500 mb-6">Vous n'avez pas encore créé de demande de fonds.</p>
                        <button onClick={() => navigate('/requests/new')} className="text-blue-600 font-medium hover:underline">Créer ma première demande</button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Référence</th>
                                <th className="px-6 py-4">Titre / Objet</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Montant</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {demandes.map((d) => (
                                <tr key={d.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer" onClick={() => openDetail(d.id)}>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600 font-medium">
                                        {d.numeroReference || '---'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{d.titre}</div>
                                        <div className="text-xs text-gray-500">{d.type}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {d.date}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800">
                                        {Number(d.montant).toLocaleString()} FCFA
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={d.statut} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-100 transition">
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modale Viewer */}
            {selectedDemande && (
                <RequestBonViewer demande={selectedDemande} onClose={() => setSelectedDemande(null)} />
            )}
            
            {loadingDetail && (
                <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            )}
        </div>
    );
}