import React, { ChangeEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  icon: LucideIcon;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ icon: Icon, type, placeholder, value, onChange }) => (
  <div className="relative mb-4">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type={type}
      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out shadow-sm"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
    />
  </div>
);

export default InputField;