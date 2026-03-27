import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllKeeperAssignments = () => apiGet('/api/keeper-assignments');
export const getKeeperAssignmentsByAnimal = (animalId) => apiGet(`/api/keeper-assignments/animal/${animalId}`);
export const createKeeperAssignment = (data) => apiPost('/api/keeper-assignments', data);
export const updateKeeperAssignment = (id, data) => apiPut(`/api/keeper-assignments/${id}`, data);
export const deleteKeeperAssignment = (id) => apiDelete(`/api/keeper-assignments/${id}`);
