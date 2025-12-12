import React from 'react';
import { Shield, FileText } from 'lucide-react';
import AuditTable from '../components/AuditTable'; // Ton composant existant

export default function AuditPage() {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Shield className="text-indigo-600" size={32} />
                        Audit & Sécurité
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Traçabilité des actions sensibles et connexions utilisateurs.
                    </p>
                </div>
                
                {/* Petit rappel informatif */}
                <div className="hidden md:flex bg-indigo-50 border border-indigo-100 rounded-lg p-3 items-center gap-3 text-sm text-indigo-800">
                    <FileText size={20} />
                    <span>Les logs sont conservés indéfiniment pour des raisons légales.</span>
                </div>
            </div>

            {/* Le tableau d'audit */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <AuditTable />
            </div>
        </div>
    );
}