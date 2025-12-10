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