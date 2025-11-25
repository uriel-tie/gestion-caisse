import React from 'react';
import { PlusCircle, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const mockRequests = [
    { date: '12/11/2025', objet: 'Avance sur salaire', montant: '150,00 €', statut: 'EN_ATTENTE' },
    { date: '03/11/2025', objet: 'Note de frais déplacement', montant: '82,40 €', statut: 'VALIDEE' },
    { date: '24/10/2025', objet: 'Carte carburant', montant: '120,00 €', statut: 'REJETEE' },
];

const statusConfig: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
    EN_ATTENTE: {
        icon: <Clock className="h-4 w-4" />,
        className: 'bg-orange-50 text-orange-700',
        label: 'En attente',
    },
    VALIDEE: {
        icon: <CheckCircle className="h-4 w-4" />,
        className: 'bg-green-50 text-green-700',
        label: 'Validée',
    },
    REJETEE: {
        icon: <AlertCircle className="h-4 w-4" />,
        className: 'bg-red-50 text-red-600',
        label: 'Rejetée',
    },
};

export default function MyRequestsWidget() {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3">
                    <div className="bg-violet-100 p-2 rounded-xl">
                        <FileText className="text-violet-600 h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Mes Demandes RH</h3>
                        <p className="text-sm text-gray-500">Historique personnel</p>
                    </div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors">
                    <PlusCircle className="h-4 w-4" />
                    Nouvelle Demande
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objet</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {mockRequests.map((req, index) => {
                            const status = statusConfig[req.statut];
                            return (
                                <tr key={`${req.date}-${index}`} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{req.date}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.objet}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{req.montant}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                                            {status.icon}
                                            {status.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

