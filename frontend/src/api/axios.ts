import axios from 'axios';

// TODO: Configure axios instance with base URL, interceptors, and error handling
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export default api;