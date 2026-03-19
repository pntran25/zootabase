import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllTickets = () => apiGet('/api/tickets');
export const createTicket = (data) => apiPost('/api/tickets', data);
export const updateTicket = (id, data) => apiPut(`/api/tickets/${id}`, data);
export const deleteTicket = (id) => apiDelete(`/api/tickets/${id}`);

export default {
    getAllTickets,
    createTicket,
    updateTicket,
    deleteTicket
};
