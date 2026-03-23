import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL, getAuthHeaders } from './apiClient';

export const getAllProducts = () => apiGet('/api/products');
export const createProduct = (data) => apiPost('/api/products', data);
export const updateProduct = (id, data) => apiPut(`/api/products/${id}`, data);
export const deleteProduct = (id) => apiDelete(`/api/products/${id}`);
export const getLowStockProducts = () => apiGet('/api/products/low-stock');

export const uploadProductImage = async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/products/${id}/image`, {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to upload image.');
    }
    return response.json();
};

export default {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    uploadProductImage,
};
