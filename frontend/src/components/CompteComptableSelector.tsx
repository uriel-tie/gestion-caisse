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
                // selectedNatureId peut être soit un UUID, soit un numéro (pour compatibilité)
                // Si c'est un UUID, on l'utilise directement, sinon on cherche d'abord la nature par numéro
                let natureId = selectedNatureId;
                
                // Si ce n'est pas un UUID (format UUID), c'est probablement un numéro
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedNatureId);
                
                if (!isUUID) {
                    // Trouver la nature par numéro
                    const nature = natures.find(n => n.numero === selectedNatureId);
                    if (nature) {
                        natureId = nature.id;
                        console.log('Nature trouvée par numéro:', nature);
                    } else {
                        console.warn('Nature non trouvée pour numéro:', selectedNatureId);
                        setTypes([]);
                        setLoadingTypes(false);
                        return;
                    }
                }

                console.log('Chargement des types pour nature_id:', natureId);
                const res = await fetch(`https://127.0.0.1:8000/api/comptes/types?nature_id=${natureId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const typesData = await res.json();
                    console.log('Types reçus:', typesData);
                    setTypes(typesData);
                } else {
                    const errorData = await res.json().catch(() => null);
                    console.error('Erreur API types:', res.status, errorData);
                    setTypes([]);
                }
            } catch (err) {
                console.error('Erreur chargement types', err);
                setTypes([]);
            } finally {
                setLoadingTypes(false);
            }
        };

        // Attendre que les natures soient chargées si nécessaire
        if (natures.length === 0 && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedNatureId)) {
            // Si on a besoin des natures mais qu'elles ne sont pas encore chargées, on attend
            return;
        }

        loadTypes();
    }, [selectedNatureId, token, natures]);

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
                        <option key={n.id} value={n.id}>
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
                        disabled={loadingTypes}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">
                            {loadingTypes ? 'Chargement...' : types.length === 0 ? 'Aucun type disponible pour cette nature' : '-- Sélectionner un type --'}
                        </option>
                        {types.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.numero} — {t.libelle}
                            </option>
                        ))}
                    </select>
                    {!loadingTypes && types.length === 0 && selectedNatureId && (
                        <p className="text-xs text-amber-600 mt-1">
                            ⚠️ Aucun compte de type "type" n'est lié à cette nature. Créez d'abord un compte de type "type" et associez-le à cette nature.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
