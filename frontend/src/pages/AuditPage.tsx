import { useEffect, useState, Fragment, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldAlert, RefreshCw, User, Search, ChevronDown, ChevronRight, Monitor, ArrowRight, Wallet, FileText, Layers, Calendar, XCircle,
  ChevronLeft, ChevronRight as ChevronRightIcon 
} from 'lucide-react';

// --- Types ---
interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_label: string;
  actor: string;
  ip: string;
  date: string;
  changes: Record<string, { old: any, new: any }> | null;
  color: string;
}

export default function AuditPage() {
  // --- États ---
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // UI
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const { t } = useTranslation();

  // --- Chargement des données ---
  const fetchAudits = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Construction de l'URL avec les paramètres pour le backend
    const params = new URLSearchParams({
        page: page.toString(),
        limit: '20', 
    });

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (searchTerm) params.append('search', searchTerm);

    try {
      const response = await fetch(`https://127.0.0.1:8000/api/audits?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        // On met à jour les données ET la pagination
        setLogs(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.totalItems);
      } else {
        console.error("Erreur serveur:", response.status);
      }
    } catch (error) {
      console.error("Erreur chargement audit", error);
    } finally {
      setLoading(false);
    }
  };

  // Recharger quand la page ou les dates changent (debounce sur search recommandé en prod)
  useEffect(() => {
    fetchAudits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, startDate, endDate]); 

  // Gestion de la recherche manuelle (touche Entrée)
  const handleSearchSubmit = (e: FormEvent) => {
      e.preventDefault();
      setPage(1); // Retour page 1
      fetchAudits();
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // --- Helpers Visuels ---
  const getActionLabel = (action: string) => {
    if (action.includes('CREATE')) return 'Création';
    if (action.includes('UPDATE')) return 'Modification';
    if (action.includes('DELETE')) return 'Suppression';
    return action;
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('UPDATE')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Mapping des noms de champs techniques vers labels lisibles
  const getFieldLabel = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'id': 'Identifiant',
      'nom': 'Nom',
      'prenom': 'Prénom',
      'email': 'Email',
      'username': 'Nom d\'utilisateur',
      'password': 'Mot de passe',
      'role': 'Rôle',
      'status': 'Statut',
      'solde': 'Solde',
      'montant': 'Montant',
      'montant_total': 'Montant total',
      'description': 'Description',
      'type': 'Type',
      'date': 'Date',
      'created_at': 'Date de création',
      'updated_at': 'Date de modification',
      'deleted_at': 'Date de suppression',
      'active': 'Actif',
      'enabled': 'Activé',
      'deleted': 'Supprimé',
      'numero': 'Numéro',
      'code': 'Code',
      'raison_sociale': 'Raison sociale',
      'numero_compte': 'Numéro de compte',
      'solde_initial': 'Solde initial',
      'solde_actuel': 'Solde actuel',
      'devise': 'Devise',
      'adresse': 'Adresse',
      'telephone': 'Téléphone',
      'fax': 'Fax',
      'contact': 'Contact',
      'responsable': 'Responsable',
      'is_active': 'Est actif',
      'is_deleted': 'Est supprimé',
      'first_name': 'Prénom',
      'last_name': 'Nom',
      'phone': 'Téléphone',
      'city': 'Ville',
      'country': 'Pays',
      'postal_code': 'Code postal',
      'state': 'État',
      'user_id': 'ID Utilisateur',
      'user_nom': 'Nom Utilisateur',
      'user_prenom': 'Prénom Utilisateur',
      'caisse_id': 'ID Caisse',
      'caisse_nom': 'Nom Caisse',
      'operation_id': 'ID Opération',
      'operation_type': 'Type Opération',
      'transaction_id': 'ID Transaction',
      'date_debut': 'Date de début',
      'date_fin': 'Date de fin',
      'motif': 'Motif',
      'commentaire': 'Commentaire',
      'reference': 'Référence',
      'numero_cheque': 'Numéro chèque',
      'montant_cheque': 'Montant chèque',
      'devise_montant': 'Devise',
      'taux': 'Taux',
      'frais': 'Frais',
      'justification': 'Justification',
      'piecejointe': 'Pièce jointe',
      'approuve': 'Approuvé',
      'rejeté': 'Rejeté',
      'en_attente': 'En attente',
      'validé': 'Validé',
      'confirmé': 'Confirmé',
      'libellé': 'Libellé',
      'objet': 'Objet',
      // Cas camelCase courants
      'passwordmustbechanged': 'Changement du mot de passe requis',
      'passwordchangedat': 'Date du dernier changement du mot de passe',
      'estouverte': 'Est ouvert(e)',
      'estfermee': 'Est fermé(e)',
      'estactive': 'Est actif/active',
      'estvalidee': 'Est validé(e)',
      'estapprouvee': 'Est approuvé(e)',
      'estarchivee': 'Est archivé(e)',
      'soldeouverture': 'Solde d\'ouverture',
      'soldedetotaljournal': 'Solde du total journal',
      'soldedecloturemanuelle': 'Solde de clôture manuel',
      'montantversemanuel': 'Montant versé manuellement',
      'montantrendumanuel': 'Montant rendu manuellement',
      'datefinale': 'Date finale',
      'dateouverture': 'Date d\'ouverture',
      'datefermetur': 'Date de fermeture',
      'datefermé': 'Date de fermeture',
      'utilisateurcaissierId': 'Caissier',
      'utilisateurvalidateurId': 'Validateur',
      'utilisateurapprovateurId': 'Approbateur',
      'heureouverture': 'Heure d\'ouverture',
      'herefermetur': 'Heure de fermeture',
      'estencours': 'Est en cours',
      'estfinalisee': 'Est finalisée',
    };

    const lowerField = field.toLowerCase();
    return fieldMap[lowerField] || convertCamelCaseToFrench(field);
  };

  // Convertir camelCase en français lisible
  const convertCamelCaseToFrench = (field: string): string => {
    // D'abord convertir camelCase -> snake_case
    const snakeCase = field
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
    
    // Ensuite convertir en texte lisible
    return snakeCase
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Formatter les valeurs pour plus de lisibilité
  const formatFieldValue = (value: any, field?: string): string => {
    if (value === null || value === undefined) return 'N/A';
    if (value === true) return '✓ Oui';
    if (value === false) return '✗ Non';
    if (typeof value === 'boolean') return value ? '✓ Oui' : '✗ Non';
    
    // Gérer les valeurs textuelles vides
    if (typeof value === 'string' && value.trim() === '') return '(vide)';
    
    // Formater les dates
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch {
        return value;
      }
    }

    // Formater les montants/nombres avec séparateurs
    if (typeof value === 'number') {
      // Si c'est probablement un montant (contient "montant" ou "solde" dans le nom du champ)
      if (field && /montant|solde|frais|prix|cout|tarif|taux/.test(field?.toLowerCase())) {
        return new Intl.NumberFormat('fr-FR', { 
          style: 'decimal', 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }).format(value);
      }
      return value.toString();
    }

    // Gérer les objets/arrays
    if (typeof value === 'object') return JSON.stringify(value);
    
    return String(value);
  };

  const getTargetBadge = (type: string) => {
    const normalizedType = type.split('\\').pop() || type;
    switch (normalizedType) {
      case 'Utilisateur': return { icon: <User size={12} />, style: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'Caisse': return { icon: <Wallet size={12} />, style: 'bg-purple-50 text-purple-700 border-purple-100' };
      case 'Demande':
      case 'Operation': return { icon: <FileText size={12} />, style: 'bg-amber-50 text-amber-700 border-amber-100' };
      default: return { icon: <Layers size={12} />, style: 'bg-gray-50 text-gray-600 border-gray-100' };
    }
  };

  // --- Rendu ---
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-500">
      
      {/* 1. Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-700 flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2 text-indigo-600" />
          {t('pages.audit.title')}
        </h3>
        <button onClick={() => fetchAudits()} className="p-2 hover:bg-gray-200 rounded-full transition" title="Rafraîchir">
          <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. Barre d'outils (Filtres) */}
      <div className="p-4 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-4 items-center">
        {/* Recherche */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="Rechercher action, acteur... (Entrée)" 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </form>

        {/* Dates */}
        <div className="flex items-center gap-2 w-full md:w-auto bg-gray-50 p-1 rounded-lg border border-gray-200">
            <Calendar size={16} className="text-gray-400 ml-2" />
            <input 
                type="date" 
                value={startDate} 
                onChange={(e) => {setStartDate(e.target.value); setPage(1);}} 
                className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 p-1 outline-none" 
            />
            <span className="text-gray-400">-</span>
            <input 
                type="date" 
                value={endDate} 
                onChange={(e) => {setEndDate(e.target.value); setPage(1);}} 
                className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 p-1 outline-none" 
            />
            {(startDate || endDate) && (
                <button onClick={() => {setStartDate(''); setEndDate(''); setPage(1);}} className="text-gray-400 hover:text-red-500 px-1">
                    <XCircle size={16} />
                </button>
            )}
        </div>
      </div>

      {/* 3. Tableau des Logs (C'est cette partie qui manquait !) */}
      <div className="overflow-auto flex-1 relative">
        {loading && (
           <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="w-10"></th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & IP</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Utilisateur</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Élément modifié</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 && !loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">{t('pages.audit.empty')}</td></tr>
            ) : (
              logs.map((log) => {
                const targetStyle = getTargetBadge(log.target_type);
                return (
                <Fragment key={log.id}>
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
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    
                    {/* Cible */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${targetStyle.style}`}>
                           <span className="mr-1.5">{targetStyle.icon}</span>
                           {log.target_type}
                        </span>
                        <span className="text-sm text-gray-700 font-medium pl-0.5">
                           {log.target_label}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Ligne Détail Expandable */}
                  {expandedRows.includes(log.id) && (
                    <tr className="bg-indigo-50/30">
                        <td colSpan={5} className="px-6 py-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-in zoom-in-95 duration-200">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 border-b border-gray-100 pb-2">
                                    {t('pages.audit.details_title')}
                                </h4>
                                {log.changes ? (
                                    <div className="space-y-2">
                                        {Object.entries(log.changes).map(([field, diff], idx) => (
                                            <div key={idx} className="grid grid-cols-12 text-sm gap-4 items-center p-2 hover:bg-gray-50 rounded">
                                                <div className="col-span-3 font-semibold text-gray-700">
                                                    {getFieldLabel(field)}
                                                </div>
                                                <div className="col-span-4 text-red-700 bg-red-50 px-3 py-2 rounded break-all border border-red-200 text-xs font-medium">
                                                    {formatFieldValue(diff.old)}
                                                </div>
                                                <div className="col-span-1 flex justify-center text-gray-400">
                                                    <ArrowRight size={16}/>
                                                </div>
                                                <div className="col-span-4 text-green-700 bg-green-50 px-3 py-2 rounded break-all border border-green-200 text-xs font-medium">
                                                    {formatFieldValue(diff.new)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic flex items-center">
                                        <Layers size={14} className="mr-2"/>
                                        {t('pages.audit.no_details')}
                                    </p>
                                )}
                            </div>
                        </td>
                    </tr>
                  )}
                </Fragment>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Footer Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <p className="text-sm text-gray-500">
            Total : <span className="font-bold text-gray-800">{totalItems}</span> entrées
        </p>

        <div className="flex items-center gap-2">
            <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
                <ChevronLeft size={16} />
            </button>
            
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                Page {page} / {totalPages || 1}
            </span>

            <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
                <ChevronRightIcon size={16} />
            </button>
        </div>
      </div>
    </div>
  );
}