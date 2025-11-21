import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Monitor, Layers } from 'lucide-react';

export default function AdminStructure() {
    const [services, setServices] = useState<any[]>([]);
    const [caisses, setCaisses] = useState<any[]>([]);
    const [newService, setNewService] = useState('');
    const [newCaisse, setNewCaisse] = useState('');
    const token = localStorage.getItem('token');

    // Chargement initial
    useEffect(() => {
        fetchData('services', setServices);
        fetchData('caisses', setCaisses);
    }, []);

    const fetchData = async (endpoint: string, setter: Function) => {
        const res = await fetch(`http://127.0.0.1:8000/api/${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setter(await res.json());
    };

    const handleCreate = async (endpoint: string, payload: object, refreshEndpoint: string, refreshSetter: Function, resetSetter: Function) => {
        const res = await fetch(`http://127.0.0.1:8000/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            fetchData(refreshEndpoint, refreshSetter);
            resetSetter('');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* GESTION DES SERVICES */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center mb-4 text-blue-600">
                    <Layers className="mr-2" />
                    <h3 className="text-lg font-bold">Services / Départements</h3>
                </div>
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        placeholder="Nom du service (ex: RH)"
                        className="flex-1 border rounded-lg px-3 py-2"
                    />
                    <button 
                        onClick={() => handleCreate('services', { nom: newService }, 'services', setServices, setNewService)}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus />
                    </button>
                </div>
                <ul className="space-y-2">
                    {services.map((s) => (
                        <li key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <span>{s.nom}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* GESTION DES CAISSES */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center mb-4 text-green-600">
                    <Monitor className="mr-2" />
                    <h3 className="text-lg font-bold">Caisses Physiques</h3>
                </div>
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newCaisse}
                        onChange={(e) => setNewCaisse(e.target.value)}
                        placeholder="Nom de la caisse (ex: Caisse 01)"
                        className="flex-1 border rounded-lg px-3 py-2"
                    />
                    <button 
                        onClick={() => handleCreate('caisses', { nom: newCaisse }, 'caisses', setCaisses, setNewCaisse)}
                        className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
                    >
                        <Plus />
                    </button>
                </div>
                <ul className="space-y-2">
                    {caisses.map((c) => (
                        <li key={c.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">{c.nom}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${c.estOuverte ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {c.estOuverte ? 'OCCUPÉE' : 'DISPONIBLE'}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}