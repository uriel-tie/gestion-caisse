import React, { useEffect, useState } from 'react';

interface Operation {
    id: string;
    type: string;
    montant: number;
    date: string;
    statut: string;
    mode: string;
    utilisateur: string;
}

export default function JournalTable() {
    const [operations, setOperations] = useState<Operation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOperations = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://127.0.0.1:8000/api/operations', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setOperations(data);
                }
            } catch (error) {
                console.error("Erreur chargement journal", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOperations();
    }, []);

    if (loading) return <div className="text-center py-4">Chargement du journal...</div>;

    return (
        <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Dernières Opérations
                </h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {operations.map((op) => (
                        <tr key={op.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {op.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${op.type === 'ENCAISSEMENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {op.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {op.mode}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {op.utilisateur}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold 
                                ${op.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-600'}`}>
                                {op.type === 'DECAISSEMENT' ? '-' : '+'}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(op.montant)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}