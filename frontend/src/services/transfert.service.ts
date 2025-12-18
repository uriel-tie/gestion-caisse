import { type Transfert, type CaisseSimple } from '../types';

const API_URL = 'https://127.0.0.1:8000/api';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
});

export const transfertService = {
    // Liste des caisses cibles possibles (exclure la mienne)
    getCaissesCibles: async (): Promise<CaisseSimple[]> => {
        const res = await fetch(`${API_URL}/caisses/list-active`, { headers: getAuthHeaders() }); // Faudra créer cette route ou filtrer coté front
        return res.json();
    },

    create: async (data: { target_caisse_id: string, montant: number, motif: string }) => {
        const res = await fetch(`${API_URL}/transferts/create`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Erreur transfert');
        }
        return res.json();
    },

    getIncoming: async (): Promise<Transfert[]> => {
        const res = await fetch(`${API_URL}/transferts/incoming`, { headers: getAuthHeaders() });
        if (!res.ok) return [];
        return res.json();
    },

    accept: async (id: string) => {
        const res = await fetch(`${API_URL}/transferts/${id}/accept`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error("Erreur acceptation");
        return res.json();
    },

    reject: async (id: string, motif: string) => {
        const res = await fetch(`${API_URL}/transferts/${id}/reject`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ motif })
        });
        if (!res.ok) throw new Error("Erreur lors du rejet");
        return res.json();
    }
};