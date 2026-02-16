/**
 * Configuration centralisée des URLs API
 * Utilise les variables d'environnement définies dans .env
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://127.0.0.1:8000';

// Fonction utilitaire pour construire les URLs d'API
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
