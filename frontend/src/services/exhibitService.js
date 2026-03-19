import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL } from './apiClient';

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

export const uploadExhibitImage = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/api/exhibits/${id}/image`, {
      method: 'POST',
      body: formData,
      // No Content-Type header needed for FormData; browser sets it with boundary
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error uploading image for exhibit ${id}:`, error);
    throw error;
  }
};
