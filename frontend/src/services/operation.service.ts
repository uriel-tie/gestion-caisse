const API_URL = 'https://127.0.0.1:8000/api';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
});

export const operationService = {
    /**
     * Création d'un encaissement de retour de fond lié à un bon de caisse.
     * On peut cibler le bon soit par ID, soit par référence.
     */
    createRetourFond: async (params: {
        bonId?: string;
        bonRef?: string;
        montant: number;
        mode?: string;
        motif?: string;
    }) => {
        const payload: any = {
            montant: params.montant,
            mode: params.mode ?? 'Espèces',
        };

        if (params.motif) payload.motif = params.motif;
        if (params.bonId) payload.bon_id = params.bonId;
        if (params.bonRef) payload.bon_ref = params.bonRef;

        const res = await fetch(`${API_URL}/operations/retour-fond`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Erreur lors du retour de fond');
        }

        return data;
    },
};


