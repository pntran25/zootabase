import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

// ── Health Records ──────────────────────────────────────────────────
export const getAllHealthRecords = () => apiGet('/api/animal-health/records');
export const getHealthRecordsByAnimal = (animalId) => apiGet(`/api/animal-health/records/animal/${animalId}`);
export const createHealthRecord = (data) => apiPost('/api/animal-health/records', data);
export const updateHealthRecord = (id, data) => apiPut(`/api/animal-health/records/${id}`, data);
export const deleteHealthRecord = (id) => apiDelete(`/api/animal-health/records/${id}`);

// ── Health Metrics ──────────────────────────────────────────────────
export const getAllHealthMetrics = () => apiGet('/api/animal-health/metrics');
export const getHealthMetricsByAnimal = (animalId) => apiGet(`/api/animal-health/metrics/animal/${animalId}`);
export const createHealthMetric = (data) => apiPost('/api/animal-health/metrics', data);
export const updateHealthMetric = (id, data) => apiPut(`/api/animal-health/metrics/${id}`, data);
export const deleteHealthMetric = (id) => apiDelete(`/api/animal-health/metrics/${id}`);

// ── Alerts ──────────────────────────────────────────────────────────
export const getHealthAlerts = () => apiGet('/api/animal-health/alerts');
export const resolveHealthAlert = (id) => apiPut(`/api/animal-health/alerts/${id}/resolve`);

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
