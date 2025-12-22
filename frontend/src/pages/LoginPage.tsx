import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import InputField from '../components/InputField';
import type { LoginResponse, UserData } from '../types';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: UserData) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  // Tes états existants
  const [email, setEmail] = useState<string>('manager@app.com');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // --- NOUVEAU : Juste les 2 états pour gérer le code ---
  const [show2FAInput, setShow2FAInput] = useState<boolean>(false);
  const [code2FA, setCode2FA] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. CHANGEMENT D'URL : On tape sur notre controleur custom (/api/login)
      const response = await fetch('https://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // On ajoute code_2fa au payload (il sera vide au premier envoi, rempli au second)
        body: JSON.stringify({ email, password, code_2fa: code2FA }),
      });

      const data = await response.json(); // On enlève le typage strict ici temporairement pour lire '2fa_required'

      if (!response.ok) {
        throw new Error(data.message || 'Identifiants invalides');
      }

      // --- NOUVEAU : Interception pour la 2FA ---
      if (data['2fa_required']) {
          setShow2FAInput(true);
          setError('Veuillez entrer le code de validation.');
          setIsLoading(false);
          return; // On s'arrête là, on attend le code
      }

      // 2. Sauvegarde (Ton code original)
      // On s'assure qu'on a bien reçu le token avant de stocker
      if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // 3. Mise à jour état App (Ton code original)
          onLoginSuccess(data.token, data.user);

          // 4. Redirection Intelligente (Ton code original)
          if (data.user.password_must_be_changed) {
              navigate('/change-password-required');
          } else {
              navigate('/dashboard');
          }
      }

    } catch (err: any) {
      setError(err.message || 'Impossible de se connecter au serveur.');
    } finally {
      // On ne coupe le chargement que si on n'attend pas de code
      if (!show2FAInput) setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl border border-purple-100 overflow-hidden">
          {/* Header (Légèrement adapté pour afficher l'icone Shield si 2FA) */}
          <div className="px-8 py-6 text-center border-b border-gray-100 bg-purple-600">
            <h2 className="text-2xl font-bold text-white flex justify-center items-center gap-2">
                {show2FAInput ? <ShieldCheck className="text-purple-200" /> : null}
                ORBIS CAISSE
            </h2>
            <p className="text-purple-200 mt-1 text-sm">
                {show2FAInput ? 'Double Authentification' : 'Accès sécurisé'}
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className={`border rounded-lg p-4 flex items-start ${show2FAInput ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                  <AlertCircle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${show2FAInput ? 'text-blue-500' : 'text-red-500'}`} />
                  <p className={`text-sm ${show2FAInput ? 'text-blue-700' : 'text-red-700'}`}>{error}</p>
                </div>
              )}

              {/* --- CAS 1 : LOGIN STANDARD (Ton affichage original) --- */}
              {!show2FAInput && (
                  <>
                    <div>
                        <InputField
                            icon={UserIcon}
                            type="email"
                            placeholder="Email professionnel"
                            value={email}
                            onChange={(e: any) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <InputField
                            icon={Lock}
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e: any) => setPassword(e.target.value)}
                        />
                    </div>
                  </>
              )}

              {/* --- CAS 2 : SAISIE DU CODE (Nouveau) --- */}
              {show2FAInput && (
                <div className="animate-in fade-in slide-in-from-right duration-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                        Code Google Authenticator
                    </label>
                    <input
                        type="text"
                        autoFocus
                        maxLength={6}
                        className="w-full text-center text-3xl tracking-[0.5em] font-bold py-3 border-2 border-purple-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 text-gray-800 transition-all"
                        placeholder="000000"
                        value={code2FA} 
                        onChange={(e) => setCode2FA(e.target.value.replace(/\D/g,''))}
                    />
                    <button 
                        type="button" 
                        onClick={() => { setShow2FAInput(false); setError(''); setIsLoading(false); }}
                        className="text-xs text-gray-500 mt-4 hover:text-purple-600 hover:underline w-full text-center block"
                    >
                        Revenir à la connexion
                    </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? 'Vérification...' : (show2FAInput ? 'Valider le code' : 'Se connecter')}
                {!isLoading && !show2FAInput && <ArrowRight size={18} className="ml-2" />}
              </button>
            </form>

            {!show2FAInput && (
                <div className="mt-6 text-center">
                <a href="#" className="text-sm text-gray-400 hover:text-purple-600 transition-colors">
                    Mot de passe oublié ?
                </a>
                </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          © 2025 ORBIS CAISSE Manager. Sécurisé par Symfony & React.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;