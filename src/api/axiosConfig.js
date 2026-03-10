import axios from 'axios';
import config from '../config'; // Asegúrate que el archivo se llame config.js y esté en la misma carpeta

const api = axios.create({
    baseURL: `${config.API_URL}/api`, 
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: false
});

// Interceptor (Tu lógica está perfecta)
api.interceptors.request.use((configRequest) => {
    const token = localStorage.getItem('token');
    if (token) {
        configRequest.headers.Authorization = `Bearer ${token}`;
    }
    return configRequest;
}, (error) => {
    return Promise.reject(error);
});

// Cambiamos esto para que sea consistente
export const BASE_URL = config.API_URL; 
export default api;