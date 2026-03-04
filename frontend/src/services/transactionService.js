// Service for Transaction entity API calls
import { apiGet } from './apiClient';

export const getTransactions = async () => apiGet('/api/transactions');
