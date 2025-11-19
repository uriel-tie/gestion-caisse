// Ce fichier permet de partager tes définitions TypeScript entre toutes les pages

export interface UserData {
  id: string;
  nom: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: UserData;
  message?: string;
}