import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllTickets = () => apiGet('/api/tickets');
export const createTicket = (data) => apiPost('/api/tickets', data);
export const updateTicket = (id, data) => apiPut(`/api/tickets/${id}`, data);
export const deleteTicket = (id) => apiDelete(`/api/tickets/${id}`);

// Ticket Packages
export const getTicketPackages   = () => apiGet('/api/ticket-packages');
export const createTicketPackage = (data) => apiPost('/api/ticket-packages', data);
export const updateTicketPackage = (id, data) => apiPut(`/api/ticket-packages/${id}`, data);
export const deleteTicketPackage = (id) => apiDelete(`/api/ticket-packages/${id}`);

// Ticket Add-ons
export const getTicketAddons   = () => apiGet('/api/ticket-addons');
export const createTicketAddon = (data) => apiPost('/api/ticket-addons', data);
export const updateTicketAddon = (id, data) => apiPut(`/api/ticket-addons/${id}`, data);
export const deleteTicketAddon = (id) => apiDelete(`/api/ticket-addons/${id}`);

export default {
    getAllTickets, createTicket, updateTicket, deleteTicket,
    getTicketPackages, createTicketPackage, updateTicketPackage, deleteTicketPackage,
    getTicketAddons, createTicketAddon, updateTicketAddon, deleteTicketAddon,
};
