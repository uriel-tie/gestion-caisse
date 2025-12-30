import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';

// Nouvelle interface pour les props
interface BonDeCaissePrintProps {
    operationId?: string; // L'ID passé par le parent (PaymentTerminal)
    onClose?: () => void; // La fonction pour fermer la modale
}

export default function BonDeCaissePrint({ operationId, onClose }: BonDeCaissePrintProps) {
    const { id: paramId } = useParams(); // L'ID venant de l'URL (si accès direct)
    
    // On priorise l'ID passé en prop, sinon on prend celui de l'URL
    const id = operationId || paramId;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            // Vérification de l'ID valide
            if (!id || id === 'undefined') {
                setError("ID invalide.");
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                // On récupère les données complètes (avec infos société, numéro formaté, etc.)
                const res = await fetch(`https://127.0.0.1:8000/api/operations/${id}/print-data`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setData(await res.json());
                } else {
                    setError("Document introuvable.");
                }
            } catch (err) { 
                setError("Erreur réseau."); 
            } finally { 
                setLoading(false); 
            }
        };

        fetchData();
    }, [id]);

    // Lancer l'impression automatiquement une fois les données chargées
    useEffect(() => {
        if (data) {
            setTimeout(() => window.print(), 500);
        }
    }, [data]);

    // --- RENDU ---

    // Wrapper pour le mode "Modale" (fond grisé)
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        if (onClose) {
            return (
                <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-start overflow-y-auto p-4 animate-in fade-in">
                    <div className="relative w-full max-w-[210mm]">
                        {/* Bouton de fermeture visible uniquement à l'écran */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 print:hidden shadow-lg"
                        >
                            <X size={24} />
                        </button>
                        {children}
                    </div>
                </div>
            );
        }
        return <>{children}</>;
    };

    if (loading) return <Wrapper><div className="h-screen flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Chargement du bon...</div></Wrapper>;
    if (error) return <Wrapper><div className="p-10 bg-white text-red-600 text-center rounded-lg my-10">{error}</div></Wrapper>;
    if (!data) return null;

    const { operation, societe, lignes, demande_ref } = data;

    return (
        <Wrapper>
            <div className="min-h-screen bg-gray-100 print:bg-white flex justify-center items-start">
                <div className="bg-white w-[210mm] min-h-[148mm] shadow-2xl print:shadow-none p-12 border border-gray-200 print:border-none relative mx-auto my-8 print:my-0">
                    
                    {/* HEADER */}
                    <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                        <div>
                            <h1 className="text-xl font-bold uppercase tracking-widest text-gray-900">{societe?.nom || 'SOCIÉTÉ'}</h1>
                            <p className="text-xs text-gray-500 mt-1 max-w-[250px]">{societe?.adresse}</p>
                            <p className="text-xs text-gray-500">{societe?.telephone}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-black text-gray-900 uppercase">BON DE CAISSE</h2>
                            <div className="inline-block bg-gray-100 px-3 py-1 rounded mt-2">
                                <p className="text-sm font-mono font-bold text-gray-700">N° {operation.numero}</p>
                            </div>
                        </div>
                    </div>

                    {/* INFO BENEFICIAIRE */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between">
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Bénéficiaire</span>
                                <span className="block text-lg font-bold text-gray-900">{operation.beneficiaire}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs font-bold text-gray-400 uppercase">Date</span>
                                <span className="block text-lg font-medium text-gray-900">{operation.date}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="block text-xs font-bold text-gray-400 uppercase">Motif Global</span>
                            <span className="block text-sm text-gray-800 italic">{operation.motif}</span>
                            {demande_ref && <span className="text-xs text-blue-600 font-mono ml-2">(Réf. Demande: {demande_ref})</span>}
                        </div>
                    </div>

                    {/* TABLEAU DES LIGNES */}
                    <div className="mb-8">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-800 text-left">
                                    <th className="py-2 font-bold text-gray-600 uppercase w-1/2">Désignation</th>
                                    <th className="py-2 font-bold text-gray-600 uppercase text-center">Qté</th>
                                    <th className="py-2 font-bold text-gray-600 uppercase text-right">P.U.</th>
                                    <th className="py-2 font-bold text-gray-600 uppercase text-right">Total</th>
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
                                    <td colSpan={3} className="pt-4 text-right text-sm font-bold text-gray-500 uppercase">Total Net à Payer</td>
                                    <td className="pt-4 text-right text-2xl font-black text-gray-900">
                                        {parseFloat(operation.montant).toLocaleString()} F
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* SIGNATURES */}
                    <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t-2 border-dashed border-gray-200">
                        <div className="text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-4">Pour la Caisse</p>
                            <div className="h-28 border-2 border-gray-200 rounded-lg bg-gray-50 flex flex-col justify-end p-2">
                                <span className="text-xs text-gray-500">{operation.caissier}</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-4">Le Bénéficiaire (Signature)</p>
                            <div className="h-28 border-2 border-gray-200 rounded-lg bg-white"></div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-0 w-full text-center">
                        <p className="text-[10px] text-gray-400">Arrêté la présente pièce à la somme de {parseFloat(operation.montant).toLocaleString()} Francs CFA.</p>
                    </div>
                </div>
            </div>
        </Wrapper>
    );
}