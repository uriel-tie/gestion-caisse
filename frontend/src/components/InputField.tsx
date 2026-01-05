import React, { type InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

// On étend les attributs HTML standards pour accepter id, required, etc.
interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon; // L'icône devient optionnelle
  label?: string;    // Nouveau champ label optionnel
}

const InputField: React.FC<InputFieldProps> = ({ 
  icon: Icon, 
  label, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Affichage du label si fourni */}
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Affichage de l'icône si fournie */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        {/* L'input s'adapte s'il y a une icône ou non */}
        <input
          className={`
            w-full py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 
            bg-slate-50 border border-slate-200 
            rounded-xl text-slate-900 placeholder-slate-400 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          {...props} // On passe toutes les autres props (value, onChange, required, id...)
        />
      </div>
    </div>
  );
};

export default InputField;