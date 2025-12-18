import React, { useState, useEffect } from 'react';
import { Send, X, Loader2, ArrowRight } from 'lucide-react';
import { transfertService } from '../services/transfert.service';
import { type CaisseSimple } from '../types';

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export default function TransfertSendModal({ isOpen, onClose, onSuccess }: Props) {
    const [caisses, setCaisses] = useState<CaisseSimple[]>([]);
    const [target, setTarget] = useState('');
    const [montant, setMontant] = useState('');
    const [motif, setMotif] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Charger les caisses dispos
            // Note: Idéalement utilise un service existant pour lister les caisses
            const fetchCaisses = async () => {
                const token = localStorage.getItem('token');
                const res = await fetch('https://127.0.0.1:8000/api/caisses', { headers: { 'Authorization': `Bearer ${token}` }});
                if(res.ok) setCaisses(await res.json());
            };
            fetchCaisses();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await transfertService.create({
                target_caisse_id: target,
                montant: parseFloat(montant),
                motif
            });
            alert("Transfert envoyé !");
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600"/> Transfert de Fonds
                    </h2>
                    <button onClick={onClose}><X size={20}/></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Caisse de Destination</label>
                        <select 
                            required 
                            className="w-full p-2 border rounded"
                            value={target}
                            onChange={e => setTarget(e.target.value)}
                        >
                            <option value="">Sélectionner...</option>
                            {caisses.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                        <input 
                            type="number" required min="1"
                            className="w-full p-2 border rounded font-bold text-right"
                            value={montant} onChange={e => setMontant(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                        <input 
                            type="text" required
                            className="w-full p-2 border rounded"
                            value={motif} onChange={e => setMotif(e.target.value)}
                            placeholder="Ex: Approvisionnement"
                        />
                    </div>

                    <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <><ArrowRight size={16}/> Envoyer les fonds</>}
                    </button>
                </form>
            </div>
        </div>
    );
}