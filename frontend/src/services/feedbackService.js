import { apiGet, apiPost, apiDelete } from './apiClient';

export const getAllFeedback = () => apiGet('/api/feedback');
export const createFeedback = (data) => apiPost('/api/feedback', data);
export const deleteFeedback = (id) => apiDelete(`/api/feedback/${id}`);

export default {
    getAllFeedback,
    createFeedback,
    deleteFeedback
};
