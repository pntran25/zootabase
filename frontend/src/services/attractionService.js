// Service for Attraction entity API calls
import { apiGet } from './apiClient';

export const getAttractions = async () => apiGet('/api/attractions');
