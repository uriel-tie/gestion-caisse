// Ce fichier permet de partager tes définitions TypeScript entre toutes les pages

export interface UserData {
  id: string;
  nom: string;
  email: string;
  roles: string[];
  password_must_be_changed: boolean;
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
    siegeSocial?: string;
    capitalSocial?: string;
    // LE CHAMP CRITIQUE
    modeValidation: 'STANDARD' | 'DELEGATION' | 'AUTONOMIE'; 
}