import { useState, useEffect, useRef } from 'react';
import { Bell, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationWidget() {
    const [alerts, setAlerts] = useState<any>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const fetchAlerts = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('https://127.0.0.1:8000/api/alerts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
                
                // Calcul du total des notifs (Badge rouge)
                let count = 0;
                if (data.manager) count += (data.manager.validations + data.manager.operations + data.manager.cancellations);
                if (data.chef) count += data.chef.team_validations;
                if (data.caisse) count += (data.caisse.incoming_transfers + data.caisse.transfer_updates.length);
                // On compte aussi les demandes persos actives comme des notifs ?
                // Souvent non, c'est juste informatif. Je ne l'ajoute pas au badge rouge pour ne pas spammer, sauf si tu veux.
                
                setTotalCount(count);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 15000); // Check toutes les 15s
        return () => clearInterval(interval);
    }, []);

    // Fermeture au clic extérieur
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-100 relative text-gray-600 transition-colors"
            >
                <Bell className="h-6 w-6" />
                {totalCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white animate-pulse">
                        {totalCount}
                    </span>
                )}
            </button>

            {isOpen && alerts && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden text-sm">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                        Tableau de bord (Live)
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        
                        {/* --- MANAGER --- */}
                        {alerts.manager && (alerts.manager.validations > 0 || alerts.manager.operations > 0) && (
                            <div className="p-2 border-b border-gray-100 bg-purple-50">
                                <p className="text-xs font-bold text-purple-700 mb-2 uppercase">Manager - À traiter</p>
                                {alerts.manager.validations > 0 && (
                                    <div onClick={() => navigate('/manager/validations')} className="flex justify-between items-center p-2 bg-white rounded mb-1 cursor-pointer hover:bg-purple-100">
                                        <span>Demandes à valider</span>
                                        <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs">{alerts.manager.validations}</span>
                                    </div>
                                )}
                                {alerts.manager.operations > 0 && (
                                    <div onClick={() => navigate('/manager/operations')} className="flex justify-between items-center p-2 bg-white rounded cursor-pointer hover:bg-purple-100">
                                        <span>Opérations à valider</span>
                                        <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs">{alerts.manager.operations}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- CHEF DE SERVICE --- */}
                        {alerts.chef && alerts.chef.team_validations > 0 && (
                            <div className="p-2 border-b border-gray-100 bg-blue-50">
                                <p className="text-xs font-bold text-blue-700 mb-2 uppercase">Validation Équipe</p>
                                <div onClick={() => navigate('/chef/validations')} className="flex justify-between items-center p-2 bg-white rounded cursor-pointer hover:bg-blue-100">
                                    <span>Demandes en attente</span>
                                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs">{alerts.chef.team_validations}</span>
                                </div>
                            </div>
                        )}

                        {/* --- CAISSIER --- */}
                        {alerts.caisse && (
                            <div className="p-2 border-b border-gray-100 bg-orange-50">
                                <p className="text-xs font-bold text-orange-700 mb-2 uppercase">Trésorerie</p>
                                
                                {/* Transferts Entrants */}
                                {alerts.caisse.incoming_transfers > 0 ? (
                                    <div onClick={() => navigate('/caisse/transferts')} className="flex justify-between items-center p-2 bg-white rounded mb-1 cursor-pointer hover:bg-orange-100 animate-pulse border border-orange-200">
                                        <span className="flex items-center gap-2"><ArrowRightLeft size={14}/> Réception Fonds</span>
                                        <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full text-xs">{alerts.caisse.incoming_transfers}</span>
                                    </div>
                                ) : null}

                                {/* Mises à jour Transferts (Acceptés/Refusés) */}
                                {alerts.caisse.transfer_updates.map((t: any) => (
                                    <div key={t.id} className="p-2 bg-white rounded mb-1 text-xs border border-gray-100">
                                        <div className="flex justify-between font-semibold">
                                            <span>Vers : {t.destinataire}</span>
                                            <span className={t.statut === 'ACCEPTE' ? 'text-green-600' : 'text-red-600'}>{t.statut}</span>
                                        </div>
                                        <div className="text-gray-500 mt-1">Montant: {t.montant} FCFA ({t.date})</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* --- MES DEMANDES (EMPLOYE) --- */}
                        {alerts.my_requests && alerts.my_requests.length > 0 && (
                            <div className="p-2">
                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Mes Demandes en cours</p>
                                {alerts.my_requests.map((req: any) => (
                                    <div key={req.id} className="p-2 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-700">#{req.id}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                req.statut.includes('VALID') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {req.statut}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{req.motif}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {totalCount === 0 && (!alerts.my_requests || alerts.my_requests.length === 0) && (
                            <div className="p-8 text-center text-gray-400">
                                <CheckCircle size={32} className="mx-auto mb-2 opacity-20"/>
                                <p>Tout est à jour !</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Petit helper pour l'icone "Tout est à jour"
function CheckCircle({size, className}: {size:number, className?:string}) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}