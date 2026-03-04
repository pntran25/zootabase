// Service for Ticket entity API calls
import { apiGet } from './apiClient';

export const getTickets = async () => apiGet('/api/tickets');
