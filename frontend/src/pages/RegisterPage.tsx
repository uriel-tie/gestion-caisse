import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  Building2,
  FileText
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
  const [nomSociete, setNomSociete] = useState('');
  const [ncc, setNcc] = useState('');

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
      const response = await fetch('https://localhost:8000/api/register', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          nom, 
          nomSociete, 
          numeroCompteContribuable: ncc // Assure-toi que le backend attend bien cette clé
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      navigate('/login', { state: { message: 'Compte créé ! En attente de validation.' } });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Changement ici: max-w-4xl au lieu de max-w-md pour élargir la carte */}
      <div className="max-w-4xl w-full">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

          {/* HEADER */}
          <div className="px-8 py-6 text-center bg-slate-900 border-b border-slate-800">
            <h2 className="text-2xl font-extrabold text-white tracking-wide">
              ORBIS CAISSE
            </h2>
            <p className="text-slate-400 mt-1 text-sm">
              Création de l'espace entreprise
            </p>
          </div>

          {/* FORM */}
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              
              {/* Messages d'erreur/succès globaux */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-3 mt-0.5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm text-yellow-800">
                  {success}
                </div>
              )}

              {/* GRILLE 2 COLONNES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                
                {/* COLONNE GAUCHE : ENTREPRISE */}
                <div className="space-y-5">
                  <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 mb-4">
                    <Building2 className="text-slate-700" size={20} />
                    <h3 className="text-lg font-semibold text-slate-800">Entreprise</h3>
                  </div>
                  
                  <InputField
                    id="nomSociete"
                    label="Nom de l'entreprise"
                    icon={Building2}
                    type="text"
                    value={nomSociete}
                    onChange={(e) => setNomSociete(e.target.value)}
                    required
                    placeholder="Ex: Ma Boutique SARL"
                  />
                  
                  <InputField
                    id="ncc"
                    label="N° Compte Contribuable (NCC)"
                    icon={FileText}
                    type="text"
                    value={ncc}
                    onChange={(e) => setNcc(e.target.value)}
                    placeholder="Optionnel"
                  />
                  
                  {/* Tu peux ajouter ici Adresse ou Téléphone société plus tard */}
                </div>

                {/* COLONNE DROITE : MANAGER */}
                <div className="space-y-5">
                  <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 mb-4">
                    <User className="text-slate-700" size={20} />
                    <h3 className="text-lg font-semibold text-slate-800">Manager</h3>
                  </div>

                  <InputField
                    label="Nom complet"
                    icon={User}
                    type="text"
                    placeholder="Votre nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                  />

                  <InputField
                    label="Email professionnel"
                    icon={Mail}
                    type="email"
                    placeholder="email@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Mot de passe"
                      icon={Lock}
                      type="password"
                      placeholder="******"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />

                    <InputField
                      label="Confirmation"
                      icon={Lock}
                      type="password"
                      placeholder="******"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* BOUTON ACTION (LARGEUR TOTALE) */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full md:w-1/2 md:mx-auto flex justify-center items-center py-3 px-4 rounded-xl
                    text-base font-bold text-white bg-slate-900
                    hover:bg-yellow-400 hover:text-slate-900
                    transition-all disabled:opacity-50 shadow-lg transform hover:-translate-y-0.5"
                >
                  {isLoading ? 'Configuration en cours...' : 'Créer mon espace entreprise'}
                  {!isLoading && <ArrowRight size={18} className="ml-2" />}
                </button>
              </div>

            </form>

            {/* LIEN LOGIN */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-slate-500 hover:text-yellow-500 font-medium transition-colors"
              >
                Vous avez déjà un espace ? Se connecter
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