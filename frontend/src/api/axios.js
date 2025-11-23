import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export const productsAPI = {
  // Get all products
  getAll: () => api.get('/products'),

  // Search products
  search: (name) => api.get('/products/search', { params: { name } }),

  // Create product
  create: (productData) => api.post('/products', productData),

  // Update product
  update: (id, productData) => api.put(`/products/${id}`, productData),

  // Delete product
  delete: (id) => api.delete(`/products/${id}`),

  // Import CSV
  importCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Export CSV
  exportCSV: () => api.get('/products/export', { responseType: 'blob' }),

  // Get product history
  getHistory: (id) => api.get(`/products/${id}/history`),
};

export default api;
