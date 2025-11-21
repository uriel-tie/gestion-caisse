import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, AlertCircle } from 'lucide-react';
import InputField from '../components/InputField';
import type { LoginResponse, UserData } from '../types';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: UserData) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('admin@cashflow.com');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login_check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (!response.ok) {
        throw new Error(data.message || 'Identifiants invalides');
      }

      onLoginSuccess(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError('Impossible de se connecter au serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-primary-50 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 text-center border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">CashFlow</h2>
            <p className="text-gray-500 mt-1 text-sm">Accès sécurisé</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <InputField
                icon={UserIcon}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <InputField
                icon={Lock}
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-primary-700 transition-colors"
              >
                Mot de passe oublié ?
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Caisse. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
