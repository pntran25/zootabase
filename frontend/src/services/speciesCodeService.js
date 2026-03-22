import { apiGet, apiPost, API_BASE_URL } from './apiClient';

export const getAllSpeciesCodes = () => apiGet('/api/species-codes');
export const createSpeciesCode  = (data) => apiPost('/api/species-codes', data);

export const getNextAnimalCode = async (species) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/species-codes/next?species=${encodeURIComponent(species)}`);
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
};
