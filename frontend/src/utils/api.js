import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

// Add request interceptor for debugging
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  // If a token exists, keep sending it for backward compatibility, but
  // always attach x-user-id when user data is present so backend that
  // expects the header (no-JWT mode) can authenticate requests.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user && user.id) {
        config.headers['x-user-id'] = user.id;
      }
    } catch (err) {
      // ignore parse errors
    }
  }
  console.log('🔄 API Request:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    data: config.data
  });
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Export both named exports
export const authAPI = axios.create({
  baseURL: BASE_URL,
});

export { api };