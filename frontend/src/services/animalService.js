import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL } from './apiClient';

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

const deleteAnimal = async (id) => {
    try {
        const response = await apiDelete(`/api/animals/${id}`);
        return response;
    } catch (error) {
        console.error('Error deleting animal:', error);
        throw error;
    }
};

const uploadAnimalImage = async (id, file) => {
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${API_BASE_URL}/api/animals/${id}/image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload Failed with status ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error uploading animal image:', error);
        throw error;
    }
};

export default {
    getAllAnimals,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    uploadAnimalImage
};
