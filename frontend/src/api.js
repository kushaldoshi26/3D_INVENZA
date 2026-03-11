import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

// Mock data for development (legacy)
const mockOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
const mockPricing = { materialRate: 2, timeRate: 50, labour: 50, profit: 150 };

export const auth = {
  signup: (data) => Promise.resolve({
    data: {
      token: 'mock_token_' + Date.now(),
      user: { id: '1', email: data.email, name: data.name }
    }
  }),
  login: (data) => Promise.resolve({
    data: {
      token: 'mock_token_' + Date.now(),
      user: { id: '1', email: data.email, name: 'User' }
    }
  })
};

export const orders = {
  create: (data) => axios.post(`${API_URL}/orders/`, data),
  getById: (id) => axios.get(`${API_URL}/orders/${id}`),
  getMy: () => axios.get(`${API_URL}/orders/`) // Fetches all for now (demo users share DB)
};

export const upload = {
  model: (formData) => axios.post(`${API_URL}/uploads/`, formData)
};

export const admin = {
  // Fetch real print queue from backend
  getPrintQueue: () => axios.get(`${API_URL}/admin/print-queue`),

  // Real printers list (Enhanced)
  getPrinters: () => axios.get(`${API_URL}/printers/`),

  // Assign job
  assignPrinter: (assignmentData) => axios.post(`${API_URL}/admin/assign-printer`, assignmentData),

  // Log result
  // Log result
  logResult: (resultData) => axios.post(`${API_URL}/admin/log-result`, resultData),

  // Legacy support for dashboard stats
  getOrders: () => Promise.resolve({ data: mockOrders }),
  updateOrder: (id, data) => {
    const order = mockOrders.find(o => o.orderId === id);
    if (order) Object.assign(order, data);
    localStorage.setItem('mockOrders', JSON.stringify(mockOrders));
    return Promise.resolve({ data: order });
  },
  getPricing: () => Promise.resolve({ data: mockPricing }),
  updatePricing: (data) => {
    Object.assign(mockPricing, data);
    return Promise.resolve({ data: mockPricing });
  }
};

export const printers = {
  add: (config) => axios.post(`${API_URL}/printers/`, config),
  startJob: (printerId, jobId) => axios.post(`${API_URL}/printers/${printerId}/print-job/${jobId}`),
  control: (printerId, action) => axios.post(`${API_URL}/printers/${printerId}/control/${action}`)
};

export const slicer = {
  start: (uploadId) => axios.post(`${API_URL}/slicer/slice/${uploadId}`),
  getStatus: (jobId) => axios.get(`${API_URL}/slicer/slice/${jobId}`),
  getData: (jobId) => axios.get(`${API_URL}/slicer/slice/${jobId}/data`)
};

export const shipping = {
  getRate: () => Promise.resolve({ data: null })
};

export default { auth, orders, upload, admin, shipping };