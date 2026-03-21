import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL } from './apiClient';

export const getAllEvents = () => apiGet('/api/events');
export const createEvent = (data) => apiPost('/api/events', data);
export const updateEvent = (id, data) => apiPut(`/api/events/${id}`, data);
export const deleteEvent = (id) => apiDelete(`/api/events/${id}`);

export const uploadEventImage = async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_BASE_URL}/api/events/${id}/image`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to upload image.');
    }
    return response.json();
};

export default {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    uploadEventImage,
};
