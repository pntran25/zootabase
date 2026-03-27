import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllMaintenance = () => apiGet('/api/maintenance');
export const createMaintenance = (data) => apiPost('/api/maintenance', data);
export const updateMaintenance = (id, data) => apiPut(`/api/maintenance/${id}`, data);
export const deleteMaintenance = (id) => apiDelete(`/api/maintenance/${id}`);

export default {
    getAllMaintenance,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance
};
