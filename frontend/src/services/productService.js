// Service for Product entity API calls
import { apiGet } from './apiClient';

export const getProducts = async () => apiGet('/api/products');
