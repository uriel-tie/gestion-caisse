
import { type Societe } from '../types';

// Adapte cette URL si ton backend n'est pas sur localhost:8000
const API_URL = 'https://localhost:8000/api/societe'; 

export const societeService = {
    /**
     * Récupère la configuration unique de l'entreprise
     */
    get: async (): Promise<Societe> => {
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Erreur lors du chargement de la société');
        return response.json();
    },

    /**
     * Met à jour les infos et le mode de validation
     */
    update: async (data: Partial<Societe>): Promise<Societe> => {
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL, {
            method: 'POST', // ou PATCH selon ton Controller
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        return response.json();
    }
};