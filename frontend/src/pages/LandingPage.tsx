import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, Users, ArrowRight, CheckCircle, Lock } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        // Utilise une route protégée simple (ici /api/users/profile, à adapter si besoin)
        const res = await fetch('https://127.0.0.1:8000/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    };
    checkToken();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="text-white h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">ORBIS CAISSE</span>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition">Fonctionnalités</a>
            <a href="#security" className="hover:text-blue-600 transition">Sécurité</a>
            <a href="#contact" className="hover:text-blue-600 transition">Support</a>
          </nav>

          <button 
            onClick={() => navigate(isAuthenticated ? '/home' : '/login')}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-lg hover:shadow-gray-900/20 flex items-center gap-2"
          >
            {isAuthenticated ? 'Mon Espace' : 'Se connecter'}
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
          
          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
              La gestion de caisse <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">réinventée pour vous.</span>
            </h1>
            
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Centralisez vos opérations, sécurisez vos décaissements et simplifiez la vie de vos équipes avec une plateforme unique, fluide et auditable.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/Register')}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/30 transition-transform hover:-translate-y-1"
              >
                Commencer maintenant
              </button>
              <button className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition">
                En savoir plus
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Tout ce dont vous avez besoin</h2>
              <p className="text-gray-500 mt-2">Une suite d'outils complète pour chaque rôle de l'entreprise.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Interface Caissier</h3>
                <p className="text-gray-500 leading-relaxed">
                  Une interface dédiée pour des encaissements et décaissements rapides. Contrôle de solde en temps réel et journal automatisé.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Workflow de Validation</h3>
                <p className="text-gray-500 leading-relaxed">
                  Fini le papier. Les demandes suivent un circuit d'approbation numérique : Employé ➝ Chef de service ➝ Manager ➝ Caisse.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Audit & Sécurité</h3>
                <p className="text-gray-500 leading-relaxed">
                  Traçabilité totale des actions. Gestion des rôles stricte et historique inaltérable (contre-passation uniquement).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section id="security" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Sécurité</h2>
                    <div className="space-y-4">
                        {[
                            "Chiffrement des données sensibles",
                            "Authentification forte et gestion de session",
                            "Journal d'audit immuable",
                            "Protection contre les erreurs de caisse"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                                <span className="text-gray-700 font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-100 rounded-2xl p-8 border border-gray-200 flex items-center justify-center">
                    <Lock className="text-gray-300 w-32 h-32" />
                </div>
            </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-white font-bold text-lg">ORBIS CAISSE</span>
            <span className="ml-4 text-sm">© 2025 Tous droits réservés.</span>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition">Mentions légales</a>
            <a href="#" className="hover:text-white transition">Politique de confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
}