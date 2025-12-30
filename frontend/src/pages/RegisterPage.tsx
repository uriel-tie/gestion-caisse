import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import InputField from '../components/InputField';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('https://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la création du compte');
      }

      setSuccess('Compte créé avec succès. Vous pouvez maintenant vous connecter.');
      setTimeout(() => navigate('/login'), 1500);

    } catch (err: any) {
      setError(err.message || 'Impossible de créer le compte.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

          {/* HEADER */}
          <div className="px-8 py-7 text-center bg-slate-900 border-b border-slate-800">
            <h2 className="text-2xl font-extrabold text-white tracking-wide">
              ORBIS CAISSE
            </h2>
            <p className="text-slate-400 mt-1 text-sm">
              Création d’un compte sécurisé
            </p>
          </div>

          {/* FORM */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-3 mt-0.5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm text-yellow-800">
                  {success}
                </div>
              )}

              <InputField
                icon={User}
                type="text"
                placeholder="Nom complet"
                value={nom}
                onChange={(e: any) => setNom(e.target.value)}
              />

              <InputField
                icon={Mail}
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

              <InputField
                icon={Lock}
                type="password"
                placeholder="Confirmer le mot de passe"
                value={passwordConfirm}
                onChange={(e: any) => setPasswordConfirm(e.target.value)}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl
                  text-sm font-bold text-white bg-slate-900
                  hover:bg-yellow-400 hover:text-slate-900
                  transition-all disabled:opacity-50 shadow-lg"
              >
                {isLoading ? 'Création...' : 'Créer le compte'}
                {!isLoading && <ArrowRight size={18} className="ml-2" />}
              </button>
            </form>

            {/* LIEN LOGIN */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-slate-500 hover:text-yellow-500 font-medium transition-colors"
              >
                Déjà un compte ? Se connecter
              </button>
            </div>
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

export default RegisterPage;
