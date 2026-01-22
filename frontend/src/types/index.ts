// Ce fichier permet de partager tes définitions TypeScript entre toutes les pages

export interface UserData {
  id: string;
  nom: string;
  email: string;
  roles: string[];
  passwordMustBeChanged: boolean;
  isEmailVerified: boolean;
  societe?: {
    id: string;
    nom: string;
  };
  customRole?: {
    id: string;
    nom: string;
    baseRole: string;
    restrictions: string[];
    adminRestrictions: string[];
  };
}

export interface LoginResponse {
  token: string;
  user: UserData;
  message?: string;
}

export interface AuditLog {
  id: number;
  action: string;   
  details: string;  
  date: string;     
  utilisateur: {
    nom: string;
    email: string;
    service: string;
  };
}

export interface Societe {
    id: string;
    nom: string;
    forme?: string;
    adresse?: string;
    telephone?: string;
    registreCommerce?: string;
    numeroCompteContribuable?: string;
    siegeSocial?: string;
    capitalSocial?: string;
    modeValidation: 'STANDARD' | 'DELEGATION' | 'AUTONOMIE'; 
}

export interface Transfert {
    id: string;
    montant: number;
    date: string;
    source: string;
    emetteur: string;
    motif: string;
}

export interface CaisseSimple {
    id: string;
    nom: string;
}