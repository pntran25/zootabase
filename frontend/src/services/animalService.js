import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL, humanizeError } from './apiClient';

const getAllAnimals = async () => {
    try {
        const response = await apiGet('/api/animals');
        return response;
    } catch (error) {
        console.error('Error fetching animals:', error);
        throw error;
    }
};

const createAnimal = async (animalData) => {
    try {
        const response = await apiPost('/api/animals', animalData);
        return response;
    } catch (error) {
        console.error('Error creating animal:', error);
        throw error;
    }
};

const updateAnimal = async (id, animalData) => {
    try {
        const response = await apiPut(`/api/animals/${id}`, animalData);
        return response;
    } catch (error) {
        console.error('Error updating animal:', error);
        throw error;
    }
};

const deleteAnimal = async (id, reason) => {
    try {
        const response = await apiDelete(`/api/animals/${id}`, { reason });
        return response;
    } catch (error) {
        console.error('Error deleting animal:', error);
        throw error;
    }
};

const setEndangered = async (id, isEndangered) => {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}/api/animals/${id}/endangered`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isEndangered }),
        });
    } catch {
        throw new Error(humanizeError(0));
    }
    if (!response.ok) {
        let serverMsg = '';
        try { const body = await response.json(); serverMsg = body.error || ''; } catch {}
        throw new Error(humanizeError(response.status, serverMsg));
    }
    return response.json();
};

const uploadAnimalImage = async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    let response;
    try {
        response = await fetch(`${API_BASE_URL}/api/animals/${id}/image`, {
            method: 'POST',
            body: formData,
        });
    } catch {
        throw new Error(humanizeError(0));
    }
    if (!response.ok) {
        let serverMsg = '';
        try { const body = await response.json(); serverMsg = body.error || ''; } catch {}
        throw new Error(humanizeError(response.status, serverMsg));
    }
    return response.json();
};

export default {
    getAllAnimals,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    uploadAnimalImage,
    setEndangered,
};
