import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Printer } from 'lucide-react';

export default function BonDeCaissePrint() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`https://127.0.0.1:8000/api/operations/${id}/print-data`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        // Lance l'impression auto quand les données sont là
        if (data) {
            setTimeout(() => window.print(), 500);
        }
    }, [data]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8"/></div>;
    if (!data) return <div className="p-10 text-center text-red-500">Document introuvable</div>;

    const { operation, societe, demande } = data;

    return (
        <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white flex justify-center">
            
            {/* Bouton retour (Masqué à l'impression) */}
            <div className="fixed top-4 left-4 print:hidden">
                <button 
                    onClick={() => window.close()} 
                    className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-700"
                >
                    Fermer
                </button>
            </div>

            {/* LA FEUILLE A4/A5 */}
            <div className="bg-white w-[210mm] min-h-[148mm] shadow-xl print:shadow-none p-10 border border-gray-200 print:border-none relative">
                
                {/* 1. EN-TÊTE SOCIÉTÉ */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-8">
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-widest">{societe?.nom || 'MA SOCIÉTÉ'}</h1>
                        <p className="text-xs text-gray-500 max-w-xs">{societe?.adresse}</p>
                        <p className="text-xs text-gray-500">{societe?.telephone}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black text-gray-900 uppercase">BON DE CAISSE</h2>
                        <p className="text-sm font-mono text-gray-600 mt-1">N° {operation.numero}</p>
                    </div>
                </div>

                {/* 2. DÉTAILS DE L'OPÉRATION */}
                <div className="mb-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-gray-50 p-4 rounded border border-gray-100">
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Bénéficiaire</span>
                            <span className="block text-lg font-bold text-gray-800">{operation.beneficiaire}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded border border-gray-100 text-right">
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Montant Net</span>
                            <span className="block text-2xl font-black text-gray-900">{parseFloat(operation.montant).toLocaleString()} FCFA</span>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 text-gray-500 w-1/4">Date de l'opération</td>
                                <td className="py-2 font-medium">{operation.date}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 text-gray-500">Motif du règlement</td>
                                <td className="py-2 font-medium italic">"{operation.motif}"</td>
                            </tr>
                            {demande && (
                                <tr className="border-b border-gray-100">
                                    <td className="py-2 text-gray-500">Référence Demande</td>
                                    <td className="py-2 font-mono text-blue-600">{demande.reference}</td>
                                </tr>
                            )}
                            <tr>
                                <td className="py-2 text-gray-500">Mode de paiement</td>
                                <td className="py-2 font-medium">{operation.mode}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 3. ZONE DE SIGNATURES (CRUCIAL) */}
                <div className="grid grid-cols-2 gap-10 mt-12 border-t border-dashed border-gray-300 pt-8">
                    
                    {/* CAISSIER */}
                    <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-4">Pour la Caisse (Cachet & Signature)</p>
                        <div className="h-32 border-2 border-gray-200 rounded-lg bg-gray-50 flex flex-col justify-end p-2">
                            <span className="text-xs text-gray-500">Caissier: {operation.caissier}</span>
                        </div>
                    </div>

                    {/* BENEFICIAIRE */}
                    <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-4">Pour Acquit, Le Bénéficiaire</p>
                        <div className="h-32 border-2 border-gray-200 rounded-lg bg-white relative">
                            <p className="absolute top-2 left-2 text-[10px] text-gray-300">Lu et approuvé</p>
                            {/* Espace vide pour signature physique */}
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="absolute bottom-4 left-0 w-full text-center">
                    <p className="text-[10px] text-gray-400">Ce document doit être signé pour valoir justificatif comptable. - Généré le {new Date().toLocaleDateString()}</p>
                </div>

            </div>
        </div>
    );
}