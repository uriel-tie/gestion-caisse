import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { CompteComptableSelector } from './CompteComptableSelector';

export interface RequestLine {
    id: number;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
    compte_id?: string | null; // ID du compte comptable (Type)
    nature_numero?: string | null; // Numéro de la nature (3 chiffres)
}

interface EditorProps {
    lines: RequestLine[];
    onChange: (lines: RequestLine[]) => void;
}

export const RequestLinesEditor: React.FC<EditorProps> = ({ lines, onChange }) => {

    const addLine = () => {
        const newLine: RequestLine = {
            id: Date.now(),
            designation: '',
            quantite: 1,
            prixUnitaire: 0,
            total: 0
        };
        onChange([...lines, newLine]);
    };

    const removeLine = (id: number) => {
        if (lines.length === 1) return; // Garder au moins une ligne
        onChange(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: number, field: keyof RequestLine, value: string | number) => {
        const newLines = lines.map(line => {
            if (line.id === id) {
                const updated = { ...line, [field]: value };
                // Recalcul du total de la ligne
                if (field === 'quantite' || field === 'prixUnitaire') {
                    updated.total = Number(updated.quantite) * Number(updated.prixUnitaire);
                }
                return updated;
            }
            return line;
        });
        onChange(newLines);
    };

    return (
        <div className="border border-gray-300 rounded-sm mb-4 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase border-b border-gray-300">
                    <tr>
                        <th className="px-4 py-2 w-1/3">Désignation</th>
                        <th className="px-4 py-2 w-20 text-center">Qté</th>
                        <th className="px-4 py-2 w-24 text-right">P.U.</th>
                        <th className="px-4 py-2 w-24 text-right">Total</th>
                        <th className="px-4 py-2 w-32">Compte</th>
                        <th className="px-4 py-2 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {lines.map((line) => (
                        <tr key={line.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-2">
                                <input 
                                    type="text" 
                                    className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none px-2 py-1 placeholder-gray-300"
                                    placeholder="Description de l'article..."
                                    value={line.designation}
                                    onChange={(e) => updateLine(line.id, 'designation', e.target.value)}
                                    required
                                />
                            </td>
                            <td className="p-2">
                                <input 
                                    type="number" min="1"
                                    className="w-full text-center bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none py-1"
                                    value={line.quantite}
                                    onChange={(e) => updateLine(line.id, 'quantite', parseFloat(e.target.value) || 0)}
                                />
                            </td>
                            <td className="p-2">
                                <input 
                                    type="number" min="0"
                                    className="w-full text-right bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none py-1"
                                    value={line.prixUnitaire}
                                    onChange={(e) => updateLine(line.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                                />
                            </td>
                            <td className="p-2 text-right font-mono font-medium text-gray-700">
                                {line.total.toLocaleString()} 
                            </td>
                            <td className="p-2">
                                <CompteComptableSelector
                                    selectedNatureId={line.nature_numero}
                                    selectedTypeId={line.compte_id}
                                    onNatureChange={(nature) => {
                                        const newLines = lines.map(l => 
                                            l.id === line.id 
                                                ? { ...l, nature_numero: nature, compte_id: null }
                                                : l
                                        );
                                        onChange(newLines);
                                    }}
                                    onTypeChange={(typeId) => {
                                        const newLines = lines.map(l => 
                                            l.id === line.id 
                                                ? { ...l, compte_id: typeId }
                                                : l
                                        );
                                        onChange(newLines);
                                    }}
                                    showLabel={false}
                                    className="text-xs"
                                />
                            </td>
                            <td className="p-2 text-center">
                                <button 
                                    type="button"
                                    onClick={() => removeLine(line.id)}
                                    className="text-gray-400 hover:text-red-500 transition p-1"
                                    title="Supprimer la ligne"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <button 
                type="button"
                onClick={addLine}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium text-xs uppercase tracking-wider transition border-t border-gray-200 flex items-center justify-center gap-2"
            >
                <Plus size={14} /> Ajouter une ligne
            </button>
        </div>
    );
};