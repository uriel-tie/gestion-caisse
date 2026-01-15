import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Building2,
  FileText,
  Phone,
  MapPin,
  Coins,
  CheckCircle
} from 'lucide-react';
import InputField from '../components/InputField';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Gestion des étapes (1 = Manager, 2 = Société)
  const [step, setStep] = useState(1);

  // --- ÉTAPE 1 : MANAGER ---
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // --- ÉTAPE 2 : SOCIÉTÉ ---
  const [nomSociete, setNomSociete] = useState('');
  const [forme, setForme] = useState('SARL'); // Valeur par défaut
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [capital, setCapital] = useState('');
  const [ncc, setNcc] = useState('');
  const [registreCommerce, setRegistreCommerce] = useState('');

  // États globaux
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour passer à l'étape suivante
  const handleNextStep = () => {
    setError('');
    
    // Validation basique étape 1
    if (!nom || !email || !password || !passwordConfirm) {
      setError('Veuillez remplir tous les champs personnels.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
        setError('Le mot de passe doit faire au moins 6 caractères.');
        return;
    }

    setStep(2);
  };

  // Soumission finale
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Préparation du payload complet
    const payload = {
      nom,
      email,
      password,
      // Infos Société
      nomSociete,
      forme,
      adresse,
      telephone,
      capital,
      numeroCompteContribuable: ncc,
      registreCommerce: registreCommerce
    };

    try {
      const response = await fetch('https://localhost:8000/api/register', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      setSuccess('Compte créé avec succès ! Redirection...');
      setTimeout(() => navigate('/login'), 2000);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* PARTIE GAUCHE : IMAGE / BANNIÈRE */}
        <div className="hidden md:block w-1/3 bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-yellow-500 mb-2">ORBIS</h1>
            <p className="text-slate-400 text-sm">Gestion de Caisse Pro</p>
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === 1 ? 'bg-yellow-500 text-slate-900 border-yellow-500' : 'bg-green-500 border-green-500 text-white'}`}>
                {step > 1 ? <CheckCircle size={18}/> : '1'}
              </div>
              <div>
                <h3 className="font-bold">Manager</h3>
                <p className="text-xs text-slate-400">Vos informations personnelles</p>
              </div>
            </div>
            
            <div className="w-0.5 h-8 bg-slate-700 ml-4"></div>

            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === 2 ? 'bg-yellow-500 text-slate-900 border-yellow-500' : 'bg-transparent border-slate-600 text-slate-500'}`}>
                2
              </div>
              <div>
                <h3 className={`font-bold ${step === 2 ? 'text-white' : 'text-slate-500'}`}>Société</h3>
                <p className="text-xs text-slate-500">Informations de l'entreprise</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <p className="text-xs text-slate-500">© 2025 Orbis Finance.</p>
          </div>

          {/* Décoration arrière plan */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2"></div>
        </div>

        {/* PARTIE DROITE : FORMULAIRE */}
        <div className="flex-1 p-8 md:p-12">
          
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            {step === 1 ? 'Créer votre compte Manager' : 'Configurer votre Société'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center animate-pulse">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg text-sm flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* --- ÉTAPE 1 : FORMULAIRE MANAGER --- */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <InputField
                  icon={User}
                  label="Nom complet"
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
                <InputField
                  icon={Mail}
                  label="Email professionnel"
                  type="email"
                  placeholder="manager@societe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    icon={Lock}
                    label="Mot de passe"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <InputField
                    icon={Lock}
                    label="Confirmer"
                    type="password"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Suivant <ArrowRight size={18} className="ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* --- ÉTAPE 2 : FORMULAIRE SOCIETE --- */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <InputField
                        icon={Building2}
                        label="Nom de la Société"
                        type="text"
                        placeholder="Ex: Ma Super Entreprise"
                        value={nomSociete}
                        onChange={(e) => setNomSociete(e.target.value)}
                        required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forme Jur.</label>
                        <select 
                            value={forme} 
                            onChange={(e) => setForme(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all bg-white"
                        >
                            <option value="SARL">SARL</option>
                            <option value="SA">SA</option>
                            <option value="SAS">SAS</option>
                            <option value="SUARL">SUARL</option>
                            <option value="EI">EI</option>
                            <option value="AUTRE">Autre</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                    icon={Phone}
                    label="Téléphone"
                    type="tel"
                    placeholder="+225 07..."
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    />
                    <InputField
                    icon={Coins}
                    label="Capital Social (FCFA)"
                    type="number"
                    placeholder="1 000 000"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    />
                </div>

                <InputField
                  icon={MapPin}
                  label="Adresse / Siège Social"
                  type="text"
                  placeholder="Ex: Abidjan, Cocody, Rue K12"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    icon={FileText}
                    label="N° Compte Contribuable (NCC)"
                    type="text"
                    placeholder="Ex: 1234567 A"
                    value={ncc}
                    onChange={(e) => setNcc(e.target.value)}
                  />

                  <InputField
                    icon={FileText}
                    label="N° Registre de Commerce"
                    type="text"
                    placeholder="Ex: RC CI ABJ 123456"
                    value={registreCommerce}
                    onChange={(e) => setRegistreCommerce(e.target.value)}
                  />
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl text-slate-700 bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    <ArrowLeft size={18} className="mr-2" /> Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] flex justify-center items-center py-3 px-4 rounded-xl text-white bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold transition-all shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? 'Création...' : 'Finaliser l\'inscription'}
                    {!isLoading && <ArrowRight size={18} className="ml-2" />}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* LIEN LOGIN */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-slate-500 hover:text-yellow-600 font-medium transition-colors"
            >
              Vous avez déjà un espace ? <span className="underline">Se connecter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;