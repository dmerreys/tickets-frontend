import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://tickets-backend-production.up.railway.app/api', //backend propio
  //baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api', //backend propio
});

// Variable global para almacenar la función de logout
let logoutHandler = null;

// Método para establecer el handler de logout desde App.js
export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

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
    const status = error.response?.status;
    const message = error.response?.data?.msg || 'Error desconocido';

    // Manejar 401 token inválido/expirado y 404 usuario no encontrado
    if ((status === 401 || status === 404) && logoutHandler) {
      console.log(`Cerrando sesión debido a error ${status}: ${message}`);
      logoutHandler({ status, message }); // Pasar el motivo del logout
    }
    return Promise.reject(error);
  }
);

export default api;
