import { useState, useEffect } from 'react';
import { Plus, Layers } from 'lucide-react'; // Ajout Trash2

export default function AdminStructure() {
    const [services, setServices] = useState<any[]>([]);
    
    // Champs de création
    const [newService, setNewService] = useState('');

    const token = localStorage.getItem('token');

    // Chargement initial
    useEffect(() => {
        fetchData('services', setServices);
    }, []);

    const fetchData = async (endpoint: string, setter: Function) => {
        const res = await fetch(`https://127.0.0.1:8000/api/${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setter(await res.json());
    };

    const handleCreate = async (endpoint: string, payload: object, refreshEndpoint: string, refreshSetter: Function, resetCallback: () => void) => {
        const res = await fetch(`https://127.0.0.1:8000/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            fetchData(refreshEndpoint, refreshSetter);
            resetCallback();
        }
    };


    return (
        <div className="space-y-8">
            
            {/* GESTION DES SERVICES (Inchangé) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
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
                        onClick={() => handleCreate('services', { nom: newService }, 'services', setServices, () => setNewService(''))}
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
        </div>
    );
}