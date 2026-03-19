import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllAttractions = () => apiGet('/api/attractions');
export const createAttraction = (data) => apiPost('/api/attractions', data);
export const updateAttraction = (id, data) => apiPut(`/api/attractions/${id}`, data);
export const deleteAttraction = (id) => apiDelete(`/api/attractions/${id}`);

export default {
    getAllAttractions,
    createAttraction,
    updateAttraction,
    deleteAttraction
};
