import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL, humanizeError, getAuthHeaders } from './apiClient';

export const getAllAttractions = () => apiGet('/api/attractions');
export const createAttraction = (data) => apiPost('/api/attractions', data);
export const updateAttraction = (id, data) => apiPut(`/api/attractions/${id}`, data);
export const deleteAttraction = (id) => apiDelete(`/api/attractions/${id}`);

export const uploadAttractionImage = async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    let response;
    try {
        const authHeaders = await getAuthHeaders();
        response = await fetch(`${API_BASE_URL}/api/attractions/${id}/image`, {
            method: 'POST',
            headers: { ...authHeaders },
            body: formData,
        });
    } catch {
        throw new Error(humanizeError(0));
    }
    if (!response.ok) {
        let serverMsg = '';
        try { const body = await response.json(); serverMsg = body.error || ''; } catch {}
        throw new Error(humanizeError(response.status, serverMsg));
    }
    return response.json();
};

export default {
    getAllAttractions,
    createAttraction,
    updateAttraction,
    deleteAttraction,
    uploadAttractionImage,
};
