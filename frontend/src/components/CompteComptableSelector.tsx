import React, { useState, useEffect } from 'react';

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

interface CompteComptableSelectorProps {
    selectedNatureId?: string;
    selectedTypeId?: string;
    onNatureChange: (natureId: string | null) => void;
    onTypeChange: (typeId: string | null) => void;
    required?: boolean;
    showLabel?: boolean;
    className?: string;
}

export const CompteComptableSelector: React.FC<CompteComptableSelectorProps> = ({
    selectedNatureId,
    selectedTypeId,
    onNatureChange,
    onTypeChange,
    required = false,
    showLabel = true,
    className = ''
}) => {
    const [natures, setNatures] = useState<Nature[]>([]);
    const [types, setTypes] = useState<Type[]>([]);
    const [loadingNatures, setLoadingNatures] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const token = localStorage.getItem('token');

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

    // Charger les Types quand la Nature change
    useEffect(() => {
        if (!selectedNatureId) {
            setTypes([]);
            onTypeChange(null);
            return;
        }

        const loadTypes = async () => {
            setLoadingTypes(true);
            try {
                const res = await fetch(`https://127.0.0.1:8000/api/comptes/types?nature=${selectedNatureId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setTypes(await res.json());
                }
            } catch (err) {
                console.error('Erreur chargement types', err);
            } finally {
                setLoadingTypes(false);
            }
        };

        loadTypes();
    }, [selectedNatureId, token]);

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Sélecteur Nature */}
            <div>
                {showLabel && (
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Nature {required && <span className="text-red-600">*</span>}
                    </label>
                )}
                <select
                    value={selectedNatureId || ''}
                    onChange={(e) => onNatureChange(e.target.value || null)}
                    disabled={loadingNatures}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                    <option value="">-- Sélectionner une nature --</option>
                    {natures.map((n) => (
                        <option key={n.id} value={n.numero}>
                            {n.numero} — {n.libelle}
                        </option>
                    ))}
                </select>
            </div>

            {/* Sélecteur Type (apparaît si Nature est sélectionnée) */}
            {selectedNatureId && (
                <div>
                    {showLabel && (
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                            Type {required && <span className="text-red-600">*</span>}
                        </label>
                    )}
                    <select
                        value={selectedTypeId || ''}
                        onChange={(e) => onTypeChange(e.target.value || null)}
                        disabled={loadingTypes || types.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">
                            {loadingTypes ? 'Chargement...' : types.length === 0 ? 'Aucun type disponible' : '-- Sélectionner un type --'}
                        </option>
                        {types.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.numero} — {t.libelle}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};
