import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllProducts = () => apiGet('/api/products');
export const createProduct = (data) => apiPost('/api/products', data);
export const updateProduct = (id, data) => apiPut(`/api/products/${id}`, data);
export const deleteProduct = (id) => apiDelete(`/api/products/${id}`);

export default {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
