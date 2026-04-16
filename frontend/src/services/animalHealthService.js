import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

// ── Health Records ──────────────────────────────────────────────────
export const getAllHealthRecords = () => apiGet('/api/animal-health/records');
export const getHealthRecordsByAnimal = (animalId) => apiGet(`/api/animal-health/records/animal/${animalId}`);
export const createHealthRecord = (data) => apiPost('/api/animal-health/records', data);
export const updateHealthRecord = (id, data) => apiPut(`/api/animal-health/records/${id}`, data);
export const deleteHealthRecord = (id) => apiDelete(`/api/animal-health/records/${id}`);

// ── Alerts ──────────────────────────────────────────────────────────
export const getHealthAlerts = () => apiGet('/api/animal-health/alerts');
export const resolveHealthAlert = (id, data) => apiPut(`/api/animal-health/alerts/${id}/resolve`, data);

// ── Comprehensive Report ────────────────────────────────────────────
export const getAnimalReport = (animalId) => apiGet(`/api/animal-health/report/${animalId}`);

// ── Aggregate Health Report (all animals) ───────────────────────────
export const getHealthReport = () => apiGet('/api/animal-health/health-report');

// ── Dropdown helpers ────────────────────────────────────────────────
export const getAnimalsForDropdown = () => apiGet('/api/animal-health/animals-list');
export const getStaffForDropdown = () => apiGet('/api/animal-health/staff-list');

// ── Meal time config ─────────────────────────────────────────────────
export const getMealTimes = () => apiGet('/api/animal-health/meal-times');
export const updateMealTimes = (meals) => apiPut('/api/animal-health/meal-times', meals);
