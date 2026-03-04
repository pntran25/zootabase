import { apiGet, apiPost } from './apiClient';

export const getMaintenanceRequests = async () => apiGet('/api/maintenance');

export const createMaintenanceRequest = async (requestPayload) =>
  apiPost('/api/maintenance', requestPayload);
