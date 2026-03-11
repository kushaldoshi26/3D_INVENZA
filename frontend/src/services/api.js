// src/services/api.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Core upload with analysis
  async uploadFile(file, category = 'normal', userId = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (userId) formData.append('user_id', userId);

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  // Create order
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
  }

  // Get order
  async getOrder(orderId) {
    return this.request(`/orders/${orderId}`);
  }

  // Admin endpoints
  async getAdminOrders() {
    return this.request('/admin/orders');
  }
}

export default new ApiService();