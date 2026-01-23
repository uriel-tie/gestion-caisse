import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';

export interface RequestLine {
    id: number;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
    compte_id?: string | null; // ID du compte comptable (Type)
    nature_id?: string | null; // UUID de la nature
}

interface EditorProps {
    lines: RequestLine[];
    onChange: (lines: RequestLine[]) => void;
}

interface Nature {
    id: string;
    numero: string;
    libelle: string;
    label_complet: string;
}

interface Type {
    id: string;
    numero: string;
    libelle: string;
    nature: string;
    label_complet: string;
}

export const RequestLinesEditor: React.FC<EditorProps> = ({ lines, onChange }) => {
    const [natures, setNatures] = useState<Nature[]>([]);
    const [typesByNature, setTypesByNature] = useState<Record<string, Type[]>>({});
    const [loadingNatures, setLoadingNatures] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState<Record<string, boolean>>({});
    const token = localStorage.getItem('token');

    // Charger les Types pour une nature donnée
    const loadTypesForNature = async (natureId: string) => {
        setLoadingTypes(prev => {
            if (prev[natureId]) return prev; // Déjà en cours
            return { ...prev, [natureId]: true };
        });

        try {
            const res = await fetch(`https://127.0.0.1:8000/api/comptes/types?nature_id=${natureId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const typesData = await res.json();
                setTypesByNature(prev => {
                    if (prev[natureId]) return prev; // Déjà chargé
                    return { ...prev, [natureId]: typesData };
                });
            }
        } catch (err) {
            console.error('Erreur chargement types', err);
        } finally {
            setLoadingTypes(prev => ({ ...prev, [natureId]: false }));
        }
    };

    // Charger les Natures au montage
    useEffect(() => {
        const loadNatures = async () => {
            setLoadingNatures(true);
            try {
                const res = await fetch('https://127.0.0.1:8000/api/comptes/natures', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setNatures(await res.json());
                }
            } catch (err) {
                console.error('Erreur chargement natures', err);
            } finally {
                setLoadingNatures(false);
            }
        };
        loadNatures();
    }, [token]);

    // Charger les types pour les natures existantes dans les lignes
    useEffect(() => {
        const natureIds = lines
            .filter(l => l.nature_id)
            .map(l => l.nature_id!)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Unique
        
        natureIds.forEach(natureId => {
            setTypesByNature(prev => {
                if (prev[natureId]) return prev; // Déjà chargé
                setLoadingTypes(loading => {
                    if (!loading[natureId]) {
                        loadTypesForNature(natureId);
                    }
                    return loading;
                });
                return prev;
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines.map(l => l.nature_id).filter(Boolean).join(',')]);

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
                // Si on change la nature, réinitialiser le type et charger les types
                if (field === 'nature_id') {
                    updated.compte_id = null;
                    if (value) {
                        loadTypesForNature(value as string);
                    }
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
                        <th className="px-4 py-2 w-1/4">Désignation</th>
                        <th className="px-4 py-2 w-32">Nature</th>
                        <th className="px-4 py-2 w-32">Type</th>
                        <th className="px-4 py-2 w-20 text-center">Qté</th>
                        <th className="px-4 py-2 w-24 text-right">P.U.</th>
                        <th className="px-4 py-2 w-24 text-right">Montant</th>
                        <th className="px-4 py-2 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {lines.map((line) => {
                        const availableTypes = line.nature_id ? (typesByNature[line.nature_id] || []) : [];
                        const isLoadingTypes = line.nature_id ? (loadingTypes[line.nature_id] || false) : false;

                        return (
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
                                    <select
                                        value={line.nature_id || ''}
                                        onChange={(e) => {
                                            const natureId = e.target.value || null;
                                            updateLine(line.id, 'nature_id', natureId || '');
                                        }}
                                        disabled={loadingNatures}
                                        className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none px-2 py-1 text-xs disabled:bg-gray-100"
                                    >
                                        <option value="">-- Nature --</option>
                                        {natures.map((n) => (
                                            <option key={n.id} value={n.id}>
                                                {n.numero} — {n.libelle}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2">
                                    <select
                                        value={line.compte_id || ''}
                                        onChange={(e) => {
                                            const typeId = e.target.value || null;
                                            updateLine(line.id, 'compte_id', typeId || '');
                                        }}
                                        disabled={!line.nature_id || isLoadingTypes}
                                        className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none px-2 py-1 text-xs disabled:bg-gray-100"
                                    >
                                        <option value="">
                                            {isLoadingTypes ? 'Chargement...' : !line.nature_id ? '-- Sélectionner d\'abord une nature --' : availableTypes.length === 0 ? 'Aucun type disponible' : '-- Type --'}
                                        </option>
                                        {availableTypes.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.numero} — {t.libelle}
                                            </option>
                                        ))}
                                    </select>
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
                        );
                    })}
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