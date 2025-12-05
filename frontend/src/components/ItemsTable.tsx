import React, { useEffect } from 'react';

// Types pour tes articles
export interface ItemDetail {
    designation: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
}

interface ItemsTableProps {
    items: ItemDetail[];
    setItems: (items: ItemDetail[]) => void;
    onTotalChange: (total: number) => void;
}

const ItemsTable: React.FC<ItemsTableProps> = ({ items, setItems, onTotalChange }) => {

    // Ajout d'une ligne vide
    const addItem = () => {
        setItems([...items, { designation: '', quantite: 1, prix_unitaire: 0, total: 0 }]);
    };

    // Suppression d'une ligne
    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    // Mise à jour d'un champ
    const updateItem = (index: number, field: keyof ItemDetail, value: string | number) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'designation') {
            item.designation = value as string;
        } else {
            // Gestion des nombres
            const val = parseFloat(value as string) || 0;
            if (field === 'quantite') item.quantite = val;
            if (field === 'prix_unitaire') item.prix_unitaire = val;
        }

        // Recalcul du total de la ligne
        item.total = item.quantite * item.prix_unitaire;
        setItems(newItems);
    };

    // Recalcul du Total Général à chaque changement
    useEffect(() => {
        const grandTotal = items.reduce((acc, curr) => acc + curr.total, 0);
        onTotalChange(grandTotal);
    }, [items, onTotalChange]);

    return (
        <div className="border rounded-md p-2 bg-gray-50 mb-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-700">Détails des achats</h4>
                <button 
                    type="button"
                    onClick={addItem}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                    + Ajouter ligne
                </button>
            </div>

            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                    <tr>
                        <th className="px-2 py-1">Désignation</th>
                        <th className="px-2 py-1 w-16">Qté</th>
                        <th className="px-2 py-1 w-24">Prix U.</th>
                        <th className="px-2 py-1 w-24">Total</th>
                        <th className="w-8"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className="border-b">
                            <td className="p-1">
                                <input 
                                    type="text" 
                                    className="w-full border rounded px-1 py-1"
                                    placeholder="Ex: Balais"
                                    value={item.designation}
                                    onChange={(e) => updateItem(index, 'designation', e.target.value)}
                                />
                            </td>
                            <td className="p-1">
                                <input 
                                    type="number" 
                                    className="w-full border rounded px-1 py-1 text-center"
                                    value={item.quantite}
                                    onChange={(e) => updateItem(index, 'quantite', e.target.value)}
                                />
                            </td>
                            <td className="p-1">
                                <input 
                                    type="number" 
                                    className="w-full border rounded px-1 py-1 text-right"
                                    value={item.prix_unitaire}
                                    onChange={(e) => updateItem(index, 'prix_unitaire', e.target.value)}
                                />
                            </td>
                            <td className="p-1 text-right font-medium text-gray-700">
                                {item.total.toLocaleString()}
                            </td>
                            <td className="p-1 text-center">
                                <button 
                                    type="button" 
                                    onClick={() => removeItem(index)}
                                    className="text-red-500 hover:text-red-700 font-bold"
                                >
                                    &times;
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {items.length === 0 && <p className="text-xs text-gray-400 text-center mt-2">Aucun article.</p>}
        </div>
    );
};

export default ItemsTable;