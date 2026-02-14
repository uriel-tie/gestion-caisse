import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface BonDeCaissePrintProps {
    operation?: any;
    onClose?: () => void;
}

export default function BonDeCaissePrint({ operation, onClose }: BonDeCaissePrintProps) {
    const { t } = useTranslation();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (operation) {
             // Si on a passé l'opération directement (depuis le terminal)
             // On simule la structure de données attendue
             setData({
                 operation: {
                     numero: operation.id.substring(0, 8).toUpperCase(),
                     beneficiaire: operation.demandeur || 'Inconnu',
                     date: new Date(operation.date).toLocaleDateString(),
                     motif: operation.motif,
                     montant: operation.montant,
                     caissier: operation.utilisateur || 'Moi'
                 },
                 societe: {
                     nom: 'ORBIS CAISSE',
                     adresse: 'Siège Social, Abidjan',
                     telephone: '+225 07 00 00 00 00'
                 },
                 lignes: operation.lignes,
                 demande_ref: operation.motif.split('-')[1]?.trim() || 'N/A'
             });
             setLoading(false);
             return;
        }

        const fetchData = async () => {
            if (!id || id === 'undefined') {
                setError("ID invalide.");
                setLoading(false);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`https://127.0.0.1:8000/api/operations/${id}/print-data`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setData(await res.json());
                else setError("Document introuvable.");
            } catch (err) { setError("Erreur réseau."); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [id, operation]);

    useEffect(() => {
        if (data) setTimeout(() => window.print(), 500);
    }, [data]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;
    if (error) return <div className="p-10 text-red-600 text-center">{error}</div>;

    const { operation: opData, societe, lignes, demande_ref } = data; // On récupère 'lignes'

    return (
        <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white flex justify-center items-start">
            <div className="bg-white w-[210mm] min-h-[148mm] shadow-2xl print:shadow-none p-12 border border-gray-200 print:border-none relative mx-auto">
                
                {/* HEADER */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-widest text-gray-900">{societe?.nom || t('components.bon_de_caisse.company_name')}</h1>
                        <p className="text-xs text-gray-500 mt-1 max-w-[250px]">{societe?.adresse}</p>
                        <p className="text-xs text-gray-500">{societe?.telephone}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black text-gray-900 uppercase">{t('components.bon_de_caisse.title')}</h2>
                        <div className="inline-block bg-gray-100 px-3 py-1 rounded mt-2">
                            <p className="text-sm font-mono font-bold text-gray-700">N° {opData.numero}</p>
                        </div>
                    </div>
                </div>

                {/* INFO BENEFICIAIRE */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between">
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">{t('components.bon_de_caisse.beneficiary')}</span>
                            <span className="block text-lg font-bold text-gray-900">{opData.beneficiaire}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs font-bold text-gray-400 uppercase">{t('components.bon_de_caisse.date')}</span>
                            <span className="block text-lg font-medium text-gray-900">{opData.date}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <span className="block text-xs font-bold text-gray-400 uppercase">{t('components.bon_de_caisse.global_reason')}</span>
                        <span className="block text-sm text-gray-800 italic">{opData.motif}</span>
                        {demande_ref && <span className="text-xs text-blue-600 font-mono ml-2">{t('components.bon_de_caisse.ref_request', { ref: demande_ref })}</span>}
                    </div>
                </div>

                {/* TABLEAU DES LIGNES (FACTURE) */}
                <div className="mb-8">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-800 text-left">
                                <th className="py-2 font-bold text-gray-600 uppercase w-1/2">{t('components.bon_de_caisse.table_designation')}</th>
                                <th className="py-2 font-bold text-gray-600 uppercase text-center">{t('components.bon_de_caisse.table_qty')}</th>
                                <th className="py-2 font-bold text-gray-600 uppercase text-right">{t('components.bon_de_caisse.table_unit_price')}</th>
                                <th className="py-2 font-bold text-gray-600 uppercase text-right">{t('components.bon_de_caisse.table_total')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lignes && lignes.map((ligne: any, index: number) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="py-3 text-gray-800">{ligne.designation}</td>
                                    <td className="py-3 text-center text-gray-600">{ligne.quantite}</td>
                                    <td className="py-3 text-right text-gray-600">{parseFloat(ligne.prix).toLocaleString()}</td>
                                    <td className="py-3 text-right font-medium text-gray-900">
                                        {(ligne.total ? parseFloat(ligne.total) : (ligne.quantite * parseFloat(ligne.prix))).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="pt-4 text-right text-sm font-bold text-gray-500 uppercase">{t('components.bon_de_caisse.total_net_pay')}</td>
                                <td className="pt-4 text-right text-2xl font-black text-gray-900">
                                    {parseFloat(opData.montant).toLocaleString()} {t('common.currency')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* SIGNATURES */}
                <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t-2 border-dashed border-gray-200">
                    <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-4">{t('components.bon_de_caisse.signature_cashier')}</p>
                        <div className="h-28 border-2 border-gray-200 rounded-lg bg-gray-50 flex flex-col justify-end p-2">
                            <span className="text-xs text-gray-500">{opData.caissier}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-4">{t('components.bon_de_caisse.signature_beneficiary')}</p>
                        <div className="h-28 border-2 border-gray-200 rounded-lg bg-white"></div>
                    </div>
                </div>

                <div className="absolute bottom-4 left-0 w-full text-center">
                    <p className="text-[10px] text-gray-400">{t('components.bon_de_caisse.footer_text', { amount: parseFloat(opData.montant).toLocaleString() })}</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="print:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                        {t('components.bon_de_caisse.close')}
                    </button>
                )}
            </div>
        </div>
    );
}