import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL, humanizeError, getAuthHeaders } from './apiClient';

export const getExhibits = async () => {
  try {
    return await apiGet('/api/exhibits');
  } catch (error) {
    console.error('Error fetching exhibits from backend:', error);
    throw error;
  }
};

export const createExhibit = async (exhibitData) => {
  try {
    return await apiPost('/api/exhibits', exhibitData);
  } catch (error) {
    console.error('Error creating exhibit:', error);
    throw error;
  }
};

export const updateExhibit = async (id, exhibitData) => {
  try {
    return await apiPut(`/api/exhibits/${id}`, exhibitData);
  } catch (error) {
    console.error(`Error updating exhibit ${id}:`, error);
    throw error;
  }
};

export const deleteExhibit = async (id) => {
  try {
    return await apiDelete(`/api/exhibits/${id}`);
  } catch (error) {
    console.error(`Error deleting exhibit ${id}:`, error);
    throw error;
  }
};

export const setExhibitFeatured = async (id, isFeatured) => {
  let response;
  try {
    const authHeaders = await getAuthHeaders();
    response = await fetch(`${API_BASE_URL}/api/exhibits/${id}/featured`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ isFeatured }),
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

export const uploadExhibitImage = async (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  let response;
  try {
    const authHeaders = await getAuthHeaders();
    response = await fetch(`${API_BASE_URL}/api/exhibits/${id}/image`, {
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
