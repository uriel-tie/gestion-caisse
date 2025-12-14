import React from 'react';
import { X, Printer, FileText } from 'lucide-react';

interface BonProps {
    operation: any; // L'objet opération complet (avec détails demande si dispo)
    onClose: () => void;
}

export default function BonDeCaissePrint({ operation, onClose }: BonProps) {
    if (!operation) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
                
                {/* Header Action (Caché à l'impression) */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center print:hidden">
                    <h3 className="font-bold flex items-center gap-2">
                        <FileText size={18}/> Bon de Caisse (À Imprimer & Signer)
                    </h3>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => window.print()} 
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition shadow-lg"
                        >
                            <Printer size={18}/> IMPRIMER
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* LE DOCUMENT A4 */}
                <div className="p-10 md:p-16 text-gray-900 font-serif relative">
                    
                    {/* En-tête Société */}
                    <div className="flex justify-between items-start border-b-4 border-gray-900 pb-6 mb-8">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900">ORBIS CAISSE</h1>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Justificatif de Décaissement</p>
                        </div>
                        <div className="text-right">
                            <div className="border-2 border-gray-900 px-4 py-2 font-mono font-bold text-xl">
                                N° {operation.id.substring(0, 8).toUpperCase()}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">Date: {new Date(operation.date).toLocaleDateString('fr-FR')}</p>
                        </div>
                    </div>

                    {/* Montant & Bénéficiaire */}
                    <div className="mb-10">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold uppercase text-gray-500">Montant Payé</span>
                            <span className="text-4xl font-black">{Number(operation.montant).toLocaleString()} FCFA</span>
                        </div>
                        <div className="w-full h-px bg-gray-300 mb-6"></div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Bénéficiaire / Demandeur</span>
                                {/* On essaie de récupérer le demandeur de la demande liée, sinon on met un champ vide à remplir */}
                                <p className="text-lg font-bold border-b border-dotted border-gray-400 pb-1">
                                    {operation.demandeur || operation.beneficiaire || "______________________"}
                                </p>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Caissier</span>
                                <p className="text-lg font-bold border-b border-dotted border-gray-400 pb-1">
                                    {operation.utilisateur || "______________________"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Détails Opération */}
                    <div className="bg-gray-50 border border-gray-200 p-6 mb-10">
                        <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Motif du décaissement</span>
                        <p className="text-xl font-medium italic">"{operation.motif}"</p>
                        
                        {/* Si détails lignes (Cas d'une demande) */}
                        {operation.lignes && operation.lignes.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Détails</span>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    {operation.lignes.map((l:any, i:number) => (
                                        <li key={i}>{l.designation} (x{l.quantite}) : {Number(l.total).toLocaleString()} F</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Zone Signatures (Le plus important) */}
                    <div className="grid grid-cols-2 gap-12 mt-16">
                        <div className="border-2 border-gray-300 h-40 relative">
                            <span className="absolute top-0 left-0 bg-gray-300 text-white text-xs font-bold px-3 py-1">POUR ACQUIT (Bénéficiaire)</span>
                            <div className="absolute bottom-2 left-0 w-full text-center text-xs text-gray-400">Date et Signature</div>
                        </div>
                        <div className="border-2 border-gray-300 h-40 relative">
                            <span className="absolute top-0 left-0 bg-gray-300 text-white text-xs font-bold px-3 py-1">LE CAISSIER</span>
                            <div className="absolute bottom-2 left-0 w-full text-center text-xs text-gray-400">Cachet et Signature</div>
                        </div>
                    </div>

                    <div className="mt-12 text-center text-xs text-gray-400 uppercase">
                        Document généré par ORBIS CAISSE - {new Date().toLocaleString()} - ID: {operation.id}
                    </div>

                </div>
            </div>
        </div>
    );
}