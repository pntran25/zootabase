import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllEvents = () => apiGet('/api/events');
export const createEvent = (data) => apiPost('/api/events', data);
export const updateEvent = (id, data) => apiPut(`/api/events/${id}`, data);
export const deleteEvent = (id) => apiDelete(`/api/events/${id}`);

export default {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent
};
