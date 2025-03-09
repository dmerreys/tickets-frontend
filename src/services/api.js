import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://tickets-backend-production.up.railway.app/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token; // Coincide con authMiddleware
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('Headers de respuesta:', response.headers);
    return response;
  },
  (error) => {
    console.error('Error en la solicitud:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;