import React, { useEffect, useState } from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function MiniJournal() {
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLastOperations = async () => {
        try {
            const token = localStorage.getItem('token');
            // On suppose que l'API supporte un paramètre ?limit=5 ou on coupe côté front
            const res = await fetch('https://127.0.0.1:8000/api/operations/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // On garde les 5 derniers
                setOperations(data.slice(0, 5));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLastOperations();
        // Rafraichir toutes les 30 sec ou écouter un événement
        const interval = setInterval(fetchLastOperations, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 text-sm flex items-center">
                    <Clock size={16} className="mr-2 text-gray-400"/> Dernières transactions
                </h3>
            </div>
            <div className="divide-y divide-gray-100">
                {operations.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-400">Aucune opération récente.</p>
                ) : (
                    operations.map((op: any) => (
                        <div key={op.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full ${op.type === 'ENCAISSEMENT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {op.type === 'ENCAISSEMENT' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{op.motif || "Opération diverse"}</p>
                                    <p className="text-xs text-gray-400">{new Date(op.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                            </div>
                            <span className={`text-sm font-bold ${op.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-600'}`}>
                                {Number(op.montant).toLocaleString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}