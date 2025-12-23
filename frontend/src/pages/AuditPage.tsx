import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  RefreshCw, 
  User, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Monitor, 
  ArrowRight, 
  Wallet, 
  FileText, 
  Layers 
} from 'lucide-react';

// Mise à jour de l'interface pour correspondre au nouveau JSON du backend
interface AuditLog {
  id: string;
  action: string;
  target_type: string;  // Ex: "Caisse", "Utilisateur"
  target_label: string; // Ex: "Caisse Principale", "Doe John"
  actor: string;
  ip: string;
  date: string;
  changes: Record<string, { old: any, new: any }> | null;
  color: string;
}

export default function AuditTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Gestion de l'ouverture des lignes
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const fetchAudits = async () => {
    setLoading(true);
    const token = localStorage.getItem('token'); // Assurez-vous que la clé est la bonne
    try {
      const response = await fetch('https://127.0.0.1:8000/api/audits', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Erreur chargement audit", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Filtrage mis à jour pour chercher dans le target_label
  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('UPDATE')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Nouvelle fonction pour styliser le type de cible
  const getTargetBadge = (type: string) => {
    // Normalisation au cas où le backend renvoie le namespace complet (ex: App\Entity\Caisse)
    const normalizedType = type.split('\\').pop() || type;

    switch (normalizedType) {
      case 'Utilisateur':
        return { 
            icon: <User size={12} />, 
            style: 'bg-blue-50 text-blue-700 border-blue-100' 
        };
      case 'Caisse':
        return { 
            icon: <Wallet size={12} />, 
            style: 'bg-purple-50 text-purple-700 border-purple-100' 
        };
      case 'Demande':
      case 'Operation':
        return { 
            icon: <FileText size={12} />, 
            style: 'bg-amber-50 text-amber-700 border-amber-100' 
        };
      default:
        return { 
            icon: <Layers size={12} />, 
            style: 'bg-gray-50 text-gray-600 border-gray-100' 
        };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-700 flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2 text-indigo-600" />
          Journal d'Audit & Sécurité
        </h3>
        <button onClick={fetchAudits} className="p-2 hover:bg-gray-200 rounded-full transition" title="Actualiser">
          <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Recherche */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="Rechercher par acteur, action ou cible..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Tableau Scrollable */}
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="w-10"></th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & IP</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Acteur</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cible (Entité)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Chargement des données de sécurité...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Aucun événement trouvé.</td></tr>
            ) : (
              filteredLogs.map((log) => {
                const targetStyle = getTargetBadge(log.target_type);

                return (
                <React.Fragment key={log.id}>
                  {/* Ligne Principale */}
                  <tr 
                    onClick={() => toggleRow(log.id)} 
                    className={`cursor-pointer transition-colors ${expandedRows.includes(log.id) ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-3 text-gray-400">
                        {expandedRows.includes(log.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                    </td>
                    
                    {/* Date & IP */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.date}</div>
                        <div className="text-xs text-gray-400 flex items-center mt-1">
                            <Monitor size={10} className="mr-1"/> {log.ip || 'N/A'}
                        </div>
                    </td>
                    
                    {/* Acteur */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 text-gray-500 border border-gray-200">
                          <User size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{log.actor}</span>
                      </div>
                    </td>
                    
                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    
                    {/* Cible (Nouveau Design) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start space-y-1">
                        {/* Badge du Type */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${targetStyle.style}`}>
                           <span className="mr-1.5">{targetStyle.icon}</span>
                           {log.target_type}
                        </span>
                        {/* Nom de l'entité */}
                        <span className="text-sm text-gray-700 font-medium pl-0.5">
                           {log.target_label}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Ligne Détail (Expandable) */}
                  {expandedRows.includes(log.id) && (
                    <tr className="bg-indigo-50/30">
                        <td colSpan={5} className="px-6 py-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 border-b border-gray-100 pb-2">
                                    Détails des modifications
                                </h4>
                                {log.changes ? (
                                    <div className="space-y-2">
                                        {Object.entries(log.changes).map(([field, diff], idx) => (
                                            <div key={idx} className="grid grid-cols-12 text-sm gap-4 items-center p-2 hover:bg-gray-50 rounded">
                                                <div className="col-span-3 font-medium text-gray-600 capitalize">
                                                    {field.replace('_', ' ')}
                                                </div>
                                                <div className="col-span-4 text-red-600 bg-red-50 px-2 py-1 rounded break-all border border-red-100 text-xs font-mono">
                                                    {String(diff.old)}
                                                </div>
                                                <div className="col-span-1 flex justify-center text-gray-300">
                                                    <ArrowRight size={14}/>
                                                </div>
                                                <div className="col-span-4 text-green-600 bg-green-50 px-2 py-1 rounded break-all border border-green-100 text-xs font-mono font-medium">
                                                    {String(diff.new)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic flex items-center">
                                        <Layers size={14} className="mr-2"/>
                                        Aucun détail technique disponible pour cette action.
                                    </p>
                                )}
                            </div>
                        </td>
                    </tr>
                  )}
                </React.Fragment>
              )})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}