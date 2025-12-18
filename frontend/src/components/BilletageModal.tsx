import React, { useState, useMemo } from 'react';
import { X, Coins, Save, Calculator } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (billetage: Record<string, number>, total: number) => void;
}

// Coupures XOF (CFA)
const COUPURES = [
    { val: 10000, type: 'billet' },
    { val: 5000, type: 'billet' },
    { val: 2000, type: 'billet' },
    { val: 1000, type: 'billet' },
    { val: 500, type: 'piece' },
    { val: 250, type: 'piece' }, // Rare mais existe
    { val: 200, type: 'piece' },
    { val: 100, type: 'piece' },
    { val: 50, type: 'piece' },
    { val: 25, type: 'piece' },
    { val: 10, type: 'piece' },
    { val: 5, type: 'piece' },
];

export default function BilletageModal({ isOpen, onClose, onSubmit }: Props) {
    const [counts, setCounts] = useState<Record<number, string>>({});

    const handleChange = (valeur: number, qte: string) => {
        setCounts(prev => ({ ...prev, [valeur]: qte }));
    };

    const totalCalcul = useMemo(() => {
        return COUPURES.reduce((acc, curr) => {
            const qte = parseInt(counts[curr.val] || '0', 10);
            return acc + (isNaN(qte) ? 0 : qte * curr.val);
        }, 0);
    }, [counts]);

    const handleValidate = (e: React.FormEvent) => {
        e.preventDefault();
        // Nettoyage des données pour l'envoi
        const cleanBilletage: Record<string, number> = {};
        COUPURES.forEach(c => {
            const qte = parseInt(counts[c.val] || '0', 10);
            if (qte > 0) cleanBilletage[c.val.toString()] = qte;
        });
        
        onSubmit(cleanBilletage, totalCalcul);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Coins className="text-yellow-600" /> Billetage (Clôture)
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                </div>

                {/* Body Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/50">
                    <form id="billetage-form" onSubmit={handleValidate}>
                        <div className="grid grid-cols-2 gap-4">
                            {COUPURES.map((c) => (
                                <div key={c.val} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700">{c.val.toLocaleString()} F</span>
                                        <span className="text-[10px] text-gray-400 uppercase">{c.type}</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        className="w-20 p-2 text-right border rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                        value={counts[c.val] || ''}
                                        onChange={(e) => handleChange(c.val, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </form>
                </div>

                {/* Footer Totaux */}
                <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-xl">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-sm font-medium text-gray-500 uppercase">Total Compté</span>
                        <span className="text-3xl font-black text-blue-700">{totalCalcul.toLocaleString()} <span className="text-sm text-gray-400 font-normal">FCFA</span></span>
                    </div>
                    
                    <button 
                        type="submit" 
                        form="billetage-form"
                        className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <Save size={18}/> VALIDER ET FERMER LA CAISSE
                    </button>
                </div>
            </div>
        </div>
    );
}