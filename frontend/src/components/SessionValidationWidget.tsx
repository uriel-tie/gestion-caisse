import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function SessionValidationWidget() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    const fetchPendingSessions = async () => {
        try {
            const res = await fetch('https://127.0.0.1:8000/api/sessions/pending', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) {
                setSessions(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Polling toutes les 10s pour voir les nouvelles demandes
    useEffect(() => {
        fetchPendingSessions();
        const interval = setInterval(fetchPendingSessions, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleValidate = async (sessionId: string) => {
        const fondCaisse = prompt("Montant du fond de caisse (ex: 150.00) :", "0.00");
        if (fondCaisse === null) return;

        const res = await fetch(`https://127.0.0.1:8000/api/sessions/${sessionId}/validate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ montant_ouverture: parseFloat(fondCaisse) })
        });

        if (res.ok) {
            alert("Session ouverte ! Le caissier peut travailler.");
            fetchPendingSessions(); // Rafraîchir la liste
        }
    };

    if (loading) return <div className="animate-pulse bg-gray-100 h-24 rounded-xl mb-8"></div>;
    if (sessions.length === 0) return null; // On n'affiche rien s'il n'y a pas de demande

    return (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8 animate-in slide-in-from-top-4 shadow-sm">
            <div className="flex items-center mb-4">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                    <Clock className="text-orange-600 h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-orange-800">Demandes d'ouverture en attente</h3>
                    <p className="text-orange-600 text-xs">Action requise pour débloquer les caissiers</p>
                </div>
            </div>
            
            <div className="space-y-3">
                {sessions.map((s) => (
                    <div key={s.id} className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                {s.caissier_nom ? s.caissier_nom.charAt(0) : '?'}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{s.caissier_nom}</p>
                                <p className="text-sm text-gray-500">Demande pour : <span className="font-medium text-gray-700">{s.caisse_nom}</span></p>
                            </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-400">
                            {new Date(s.date_demande).toLocaleTimeString()}
                        </div>

                        <button 
                            onClick={() => handleValidate(s.id)}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-bold shadow-md"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" /> Valider & Ouvrir
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}