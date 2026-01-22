import React, { useState } from 'react';
import { User, Lock, Save, Mail, Briefcase, ShieldCheck, Smartphone, QrCode, XCircle, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ProfilePage() {
    // Récupération user + gestion état local de la 2FA (on suppose que le backend renvoie is2faEnabled dans le user, sinon false par défaut)
    const [user, setUser] = useState<any>(() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); } 
        catch { return {}; }
    });

    // --- ÉTATS POUR MOT DE PASSE ---
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    // --- ÉTATS POUR LA 2FA ---
    const [is2faEnabled, setIs2faEnabled] = useState<boolean>(user.is2faEnabled || false);
    const [qrCode, setQrCode] = useState<string | null>(null); // L'image base64 du QR
    const [twoFactorCode, setTwoFactorCode] = useState(''); // Le code 6 chiffres saisi
    const [isSetupMode, setIsSetupMode] = useState(false); // Si on est en train de configurer

    // --- ÉTATS POUR VÉRIFICATION EMAIL (SI NÉCESSAIRE) ---
    const [verifying, setVerifying] = useState(false);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    // 1. CHANGEMENT MOT DE PASSE
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            Swal.fire('Erreur', 'Les mots de passe ne correspondent pas', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        try {
            // 1. Vérifier d'abord le mot de passe actuel
            const verifyRes = await fetch('https://127.0.0.1:8000/api/users/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: passwords.current })
            });

            if (!verifyRes.ok) {
                Swal.fire('Erreur', 'Le mot de passe actuel est incorrect.', 'error');
                return;
            }

            // 2. Si ok, procéder au changement
            const res = await fetch('https://127.0.0.1:8000/api/users/change-password', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    current_password: passwords.current, 
                    new_password: passwords.new 
                })
            });

            if (res.ok) {
                Swal.fire('Succès', 'Mot de passe mis à jour', 'success');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                const err = await res.json();
                Swal.fire('Erreur', err.message || 'Erreur lors de la mise à jour', 'error');
            }
        } catch (error) {
            Swal.fire('Erreur', 'Erreur serveur', 'error');
        }
    };

    // 2. DÉMARRER LA CONFIGURATION 2FA (Récupérer QR Code)
    const start2FASetup = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('https://127.0.0.1:8000/api/2fa/setup', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setQrCode(data.qr_code); // On stocke l'image
                setIsSetupMode(true);
            } else {
                Swal.fire('Erreur', 'Impossible de générer le QR Code', 'error');
            }
        } catch (e) {
            console.error(e);
        }
    };

    // 3. VALIDER L'ACTIVATION (Envoyer le code)
   const confirm2FA = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('https://127.0.0.1:8000/api/2fa/enable', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: twoFactorCode })
            });

            if (res.ok) {
                Swal.fire('Sécurisé !', 'Double authentification activée avec succès.', 'success');
                
                // 1. Mise à jour des états visuels
                setIs2faEnabled(true);
                setIsSetupMode(false);
                setTwoFactorCode('');

                // 2. MISE À JOUR CRITIQUE DU LOCALSTORAGE
                // On prend l'objet user actuel et on force is2faEnabled à true
                const updatedUser = { ...user, is2faEnabled: true };
                
                // On met à jour l'état React
                setUser(updatedUser);
                
                // On sauvegarde dans le navigateur pour les prochaines visites
                localStorage.setItem('user', JSON.stringify(updatedUser)); 

            } else {
                Swal.fire('Code incorrect', 'Vérifiez le code généré par votre application.', 'error');
            }
        } catch (e) {
            console.error(e);
        }
    };

    // 4. DÉSACTIVER LA 2FA
    const disable2FA = async () => {
        const confirmation = await Swal.fire({
            title: 'Confirmer la désactivation',
            text: "Êtes-vous sûr de vouloir retirer cette sécurité ?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, désactiver',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#d33'
        });
        if (!confirmation.isConfirmed) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch('https://127.0.0.1:8000/api/2fa/disable', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setIs2faEnabled(false);
                const updatedUser = { ...user, is2faEnabled: false };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                Swal.fire('Désactivé', 'La double authentification a été retirée.', 'info');
            }
        } catch (e) {
            console.error(e);
        }
    };

    // 5. Fonction pour demander l'envoi du mail
        const handleRequestVerification = async () => {
            setVerifying(true);
            const res = await fetch('https://127.0.0.1:8000/api/security/request-email-verification', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setVerifying(false);
            if (res.ok) {
                setShowCodeInput(true);
                Swal.fire('Envoyé !', 'Vérifiez votre boîte mail pour obtenir le code.', 'success');
            } else {
                Swal.fire('Erreur', 'Impossible d\'envoyer le mail.', 'error');
            }
        };

        // 6. Fonction pour soumettre le code reçu
    const handleConfirmCode = async () => {
        const res = await fetch('https://127.0.0.1:8000/api/security/verify-email-code', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ code: verificationCode })
        });

        if (res.ok) {
            const updatedUser = { ...user, isEmailVerified: true };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setShowCodeInput(false);
            Swal.fire('Succès', 'Votre email est désormais vérifié !', 'success');
        } else {
            Swal.fire('Erreur', 'Code invalide ou expiré.', 'error');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <User className="mr-3 text-blue-600" /> Mon Profil
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* --- COLONNE GAUCHE : INFO UTILISATEUR --- */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mx-auto mb-4 border-4 border-white shadow-sm">
                            {user.nom ? user.nom.charAt(0) : 'U'}
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">{user.nom}</h2>
                        <div className="flex items-center justify-center text-gray-500 mt-2 text-sm">
                            <Mail size={14} className="mr-1"/> {user.email}
                        </div>
                        <div className="mt-4 inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">
                            <Briefcase size={12} className="mr-2"/>
                            {user.roles ? user.roles[0].replace('ROLE_', '') : 'EMPLOYE'}
                        </div>
                    </div>
                </div>

                {/* --- COLONNE DROITE : SECURITE --- */}
                <div className="md:col-span-2 space-y-8">
                    
                    {/* 1. Bloc Double Authentification (A2F) */}
                    <div className={`p-8 rounded-xl shadow-sm border transition-all ${is2faEnabled ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className={`text-lg font-bold flex items-center ${is2faEnabled ? 'text-green-800' : 'text-gray-800'}`}>
                                    <ShieldCheck size={20} className={`mr-2 ${is2faEnabled ? 'text-green-600' : 'text-gray-400'}`}/> 
                                    Double Authentification (A2F)
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Protégez votre compte avec Google Authenticator ou Microsoft Authenticator.
                                </p>
                            </div>
                            {is2faEnabled && (
                                <span className="bg-green-200 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    Activé
                                </span>
                            )}
                        </div>

                        {!is2faEnabled && !isSetupMode && (
                            <button 
                                onClick={start2FASetup}
                                className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg font-medium flex items-center transition shadow-lg"
                            >
                                <QrCode size={18} className="mr-2"/> Configurer maintenant
                            </button>
                        )}

                        {/* MODE CONFIGURATION (QR CODE) */}
                        {isSetupMode && !is2faEnabled && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-inner animate-in zoom-in duration-300">
                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                        {qrCode ? (
                                            <img src={qrCode} alt="QR Code 2FA" className="w-40 h-40 object-contain" />
                                        ) : (
                                            <div className="w-40 h-40 flex items-center justify-center bg-gray-50 text-gray-400 text-xs">Chargement...</div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                                            <li>Ouvrez votre application <strong>Google Authenticator</strong>.</li>
                                            <li>Scannez le QR Code ci-contre.</li>
                                            <li>Entrez le code à 6 chiffres généré.</li>
                                        </ol>
                                        
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Ex: 123456" 
                                                maxLength={6}
                                                className="border-2 border-gray-300 rounded-lg px-4 py-2 w-32 text-center font-bold tracking-widest focus:border-blue-500 outline-none text-lg"
                                                value={twoFactorCode}
                                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g,''))}
                                            />
                                            <button 
                                                onClick={confirm2FA}
                                                disabled={twoFactorCode.length < 6}
                                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-bold transition"
                                            >
                                                Activer
                                            </button>
                                            <button onClick={() => setIsSetupMode(false)} className="text-gray-400 hover:text-gray-600 p-2">
                                                <XCircle size={24}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODE ACTIVÉ */}
                        {is2faEnabled && (
                            <div className="flex items-center justify-between bg-white/60 p-4 rounded-lg border border-green-100">
                                <div className="flex items-center text-green-800 text-sm font-medium">
                                    <Smartphone size={18} className="mr-2"/> Votre compte est sécurisé.
                                </div>
                                <button onClick={disable2FA} className="text-red-500 hover:text-red-700 text-sm font-medium underline">
                                    Désactiver
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 2. Bloc Vérification Email */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800 text-lg">Sécurité du compte</h2>
                                    <p className="text-sm text-gray-500">Gérez la vérification de votre identité</p>
                                </div>
                            </div>
                            
                            {user.isEmailVerified ? (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                    <ShieldCheck size={14} /> Email vérifié
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                    <AlertTriangle size={14} /> Non vérifié
                                </span>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50/50">
                            {!user.isEmailVerified ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600">
                                        L'adresse <strong>{user.email}</strong> n'est pas encore vérifiée. 
                                        La vérification est nécessaire pour réinitialiser votre mot de passe en cas d'oubli.
                                    </p>
                                    
                                    {!showCodeInput ? (
                                        <button 
                                            onClick={handleRequestVerification}
                                            disabled={verifying}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
                                        >
                                            {verifying ? 'Envoi...' : 'Vérifier mon adresse email'}
                                        </button>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code de vérification</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Ex: 123456"
                                                    value={verificationCode}
                                                    onChange={e => setVerificationCode(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <button 
                                                onClick={handleConfirmCode}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition"
                                            >
                                                Confirmer le code
                                            </button>
                                            <button 
                                                onClick={() => setShowCodeInput(false)}
                                                className="text-gray-500 text-sm hover:underline"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-green-700">
                                    Votre adresse email est vérifiée. Votre compte est sécurisé.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 2. Bloc Changement de Mot de Passe */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <Lock size={18} className="mr-2 text-gray-400"/> Mot de passe
                        </h3>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                                    <input 
                                        type="password" required minLength={6}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition bg-gray-50 focus:bg-white"
                                        value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                                    <input 
                                        type="password" required minLength={6}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition bg-gray-50 focus:bg-white"
                                        value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                                    <input 
                                        type="password" required minLength={6}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition bg-gray-50 focus:bg-white"
                                        value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg font-bold flex items-center shadow-sm transition">
                                    <Save size={18} className="mr-2" /> Mettre à jour le mot de passe
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}