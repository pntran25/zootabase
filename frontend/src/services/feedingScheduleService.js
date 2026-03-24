import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllFeedingSchedules = () => apiGet('/api/feeding-schedules');
export const getFeedingSchedulesByAnimal = (animalId) => apiGet(`/api/feeding-schedules/animal/${animalId}`);
export const createFeedingSchedule = (data) => apiPost('/api/feeding-schedules', data);
export const updateFeedingSchedule = (id, data) => apiPut(`/api/feeding-schedules/${id}`, data);
export const deleteFeedingSchedule = (id) => apiDelete(`/api/feeding-schedules/${id}`);
