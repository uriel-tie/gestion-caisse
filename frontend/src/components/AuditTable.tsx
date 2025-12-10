import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, User, Search } from 'lucide-react';
import {type AuditLog } from '../types';

export default function AuditTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAudits = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
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

  // Filtrage simple (Recherche)
  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.utilisateur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes('CREATION')) return 'bg-green-100 text-green-800';
    if (action.includes('MODIFICATION')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('SUPPRESSION')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header du Tableau */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-700 flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2 text-indigo-600" />
          Journal d'Audit & Sécurité
        </h3>
        <button onClick={fetchAudits} className="p-2 hover:bg-gray-200 rounded-full transition">
          <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="Rechercher une action, un utilisateur..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Le Tableau */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Chargement de l'audit...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Aucun log trouvé.</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{log.utilisateur?.nom || 'Système'}</div>
                        <div className="text-xs text-gray-500">{log.utilisateur?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}