import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Lock,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import InputField from '../components/InputField';
import type { UserData } from '../types';

interface LoginPageProps {
  onLogin: (user: UserData) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  // États standards (Gardés de ton fichier)
  const [email, setEmail] = useState<string>('admin@gestioncaisse.com');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 2FA
  const [show2FAInput, setShow2FAInput] = useState<boolean>(false);
  const [code2FA, setCode2FA] = useState<string>('');

  // Mot de passe oublié (Logique ajoutée sans changer le style)
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Email, 2: Code
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [tempCode, setTempCode] = useState<string>('');
  const [forgotStatus, setForgotStatus] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // 1. Connexion normale (Ton code original avec ajout du 403)
    const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code_2fa: code2FA }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Identifiants invalides');
      }

      // 2FA requis
      if (data['requires2fa']) {
        setShow2FAInput(true);
        setError('Veuillez entrer le code de validation.');
        setIsLoading(false);
        return;
      }

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);

        if (data.user.passwordMustBeChanged) {
          navigate('/force-change-password');
        } else if(data.user.roles.includes('ROLE_SUPER_ADMIN')) {
          navigate('/super-admin');
        } else {
          navigate('/home');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Impossible de se connecter au serveur.');
    } finally {
      if (!show2FAInput) setIsLoading(false);
    }
  };

  // 2. Étape 1 : Demande du code
  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setForgotStatus(null);
    
    try {
      const response = await fetch('https://127.0.0.1:8000/api/security/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setForgotStatus({ type: 'success', text: data.message });
        setForgotStep(2); // On passe à la saisie du code
      } else {
        setForgotStatus({ type: 'error', text: data.message });
      }
    } catch (err) {
      setForgotStatus({ type: 'error', text: 'Erreur serveur.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Étape 2 : Connexion avec le code (Ton idée)
  const handleLoginWithCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('https://127.0.0.1:8000/api/security/login-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: tempCode }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
        
        if (data.user.passwordMustBeChanged) {
          navigate('/force-change-password');
        } else if (data.user.roles.includes('ROLE_SUPER_ADMIN')) {
          navigate('/super-admin');
        } else {
          navigate('/home');
        }
      } else {
        setForgotStatus({ type: 'error', text: data.message || 'Code invalide' });
      }
    } catch (err) {
      setForgotStatus({ type: 'error', text: 'Erreur serveur.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl shadow-xl mb-4 transform -rotate-6">
            <ShieldCheck className="text-yellow-400 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">ORBIS CAISSE</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {isForgotMode ? 'Récupération de compte' : 'Gestion de trésorerie sécurisée'}
          </p>
        </div>

        <div className="bg-white py-8 px-10 shadow-2xl rounded-3xl border border-slate-100 relative">
          
          {!isForgotMode ? (
            /* FORMULAIRE DE LOGIN ORIGINAL */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
                  <AlertCircle className="text-red-500 mr-3 shrink-0" size={20} />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {!show2FAInput ? (
                <div className="space-y-4">
                  <InputField label="Adresse Email" icon={UserIcon} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <div>
                    <InputField label="Mot de passe" icon={Lock} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <div className="mt-2 flex justify-end">
                      <button type="button" onClick={() => { setIsForgotMode(true); setError(''); }} className="text-xs font-bold text-slate-500 hover:text-yellow-600 transition-colors">
                        Mot de passe oublié ?
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <InputField label="Code de sécurité" icon={Lock} type="text" value={code2FA} onChange={(e) => setCode2FA(e.target.value)} required />
              )}

              <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-yellow-400 hover:text-slate-900 transition-all shadow-lg">
                {isLoading ? 'Vérification...' : show2FAInput ? 'Valider' : 'Se connecter'}
                {!isLoading && !show2FAInput && <ArrowRight size={18} className="ml-2" />}
              </button>
              <div className="mt-3 text-center">
                <button type="button" onClick={() => navigate('/register')} className="text-sm font-semibold text-slate-600 hover:text-yellow-600 transition-colors">
                  Pas encore de compte ? Inscrivez-vous
                </button>
              </div>
            </form>
          ) : (
            /* FORMULAIRE MOT DE PASSE OUBLIÉ (CONSERVE TON DESIGN) */
            <form onSubmit={forgotStep === 1 ? handleRequestCode : handleLoginWithCode} className="space-y-6">
              {forgotStatus && (
                <div className={`p-4 rounded-xl flex items-start border-l-4 ${forgotStatus.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-amber-50 border-amber-500 text-amber-700'}`}>
                    <AlertCircle className="mr-3 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm font-medium">{forgotStatus.text}</p>
                </div>
              )}

              {forgotStep === 1 ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Saisissez votre email pour recevoir un code temporaire.</p>
                  <InputField label="Email du compte" icon={UserIcon} type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-3 rounded-xl flex items-center gap-2 text-indigo-700 text-xs font-bold">
                    <KeyRound size={16} /> Code envoyé à {forgotEmail}
                  </div>
                  <InputField label="Entrez le code reçu" icon={ShieldCheck} type="text" value={tempCode} onChange={(e) => setTempCode(e.target.value)} placeholder="Ex: 72afd517" required />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg">
                   {isLoading ? 'Chargement...' : forgotStep === 1 ? 'Recevoir le code' : 'Vérifier et se connecter'}
                </button>
                <button type="button" onClick={() => { setIsForgotMode(false); setForgotStep(1); setForgotStatus(null); }} className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 py-2 transition">
                    <ArrowLeft size={16} /> Retour
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-xs text-slate-400">© 2025 ORBIS CAISSE Manager.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;