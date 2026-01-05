import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Lock,
  AlertCircle,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import InputField from '../components/InputField';
import type { UserData } from '../types';

interface LoginPageProps {
  onLogin: (user: UserData) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('manager@app.com');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 2FA
  const [show2FAInput, setShow2FAInput] = useState<boolean>(false);
  const [code2FA, setCode2FA] = useState<string>('');

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
      if (data['2fa_required']) {
        setShow2FAInput(true);
        setError('Veuillez entrer le code de validation.');
        setIsLoading(false);
        return;
      }

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);

        if (data.user.password_must_be_changed) {
          navigate('/change-password-required');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Impossible de se connecter au serveur.');
    } finally {
      if (!show2FAInput) setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

          {/* HEADER */}
          <div className="px-8 py-7 text-center bg-slate-900 border-b border-slate-800">
            <h2 className="text-2xl font-extrabold text-white flex justify-center items-center gap-2 tracking-wide">
              {show2FAInput && <ShieldCheck className="text-yellow-400" />}
              ORBIS CAISSE
            </h2>
            <p className="text-slate-400 mt-1 text-sm">
              {show2FAInput
                ? 'Double authentification sécurisée'
                : 'Accès sécurisé à la plateforme'}
            </p>
          </div>

          {/* FORM */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {error && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-3 mt-0.5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{error}</p>
                </div>
              )}

              {/* LOGIN CLASSIQUE */}
              {!show2FAInput && (
                <>
                  <InputField
                    icon={UserIcon}
                    type="email"
                    placeholder="Email professionnel"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                  />

                  <InputField
                    icon={Lock}
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                  />
                </>
              )}

              {/* 2FA */}
              {show2FAInput && (
                <div className="animate-in fade-in slide-in-from-right duration-300">
                  <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
                    Code Google Authenticator
                  </label>
                  <input
                    type="text"
                    autoFocus
                    maxLength={6}
                    placeholder="000000"
                    value={code2FA}
                    onChange={(e) =>
                      setCode2FA(e.target.value.replace(/\D/g, ''))
                    }
                    className="w-full text-center text-3xl tracking-[0.5em] font-bold py-3
                      border-2 border-yellow-400 rounded-xl focus:outline-none
                      focus:ring-4 focus:ring-yellow-100 text-slate-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShow2FAInput(false);
                      setError('');
                      setIsLoading(false);
                    }}
                    className="text-xs text-slate-500 mt-4 hover:text-yellow-500 hover:underline w-full text-center block"
                  >
                    Revenir à la connexion
                  </button>
                </div>
              )}

              {/* BOUTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl
                  text-sm font-bold text-white bg-slate-900
                  hover:bg-yellow-400 hover:text-slate-900
                  transition-all disabled:opacity-50 shadow-lg"
              >
                {isLoading
                  ? 'Vérification...'
                  : show2FAInput
                  ? 'Valider le code'
                  : 'Se connecter'}
                {!isLoading && !show2FAInput && (
                  <ArrowRight size={18} className="ml-2" />
                )}
              </button>
            </form>

            {/* LIEN INSCRIPTION */}
            {!show2FAInput && (
              <div className="mt-6 text-center">
                <a
                  href="/register"
                  className="text-sm text-slate-500 hover:text-yellow-500 font-medium transition-colors"
                >
                  S’inscrire
                </a>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-center text-xs text-slate-500 mt-8">
          © 2025 ORBIS CAISSE Manager.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
