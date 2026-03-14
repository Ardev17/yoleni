/**
 * ============================================================
 * Yoleni Chemical AI - API Service
 * ============================================================
 */

import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 120000, // 2 min para IA processar
});

// Interceptor de erros
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Erro de conexão com o servidor.';
    return Promise.reject(new Error(message));
  }
);

export const analyzeSubstances = async (substancesInput, title) => {
  const { data } = await API.post('/analyze', {
    substances_input: substancesInput,
    title,
  });
  return data;
};

export const analyzeFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await API.post('/analyze/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getHistory = async () => {
  const { data } = await API.get('/history');
  return data;
};

export const getAnalysisById = async (id) => {
  const { data } = await API.get(`/analysis/${id}`);
  return data;
};

export default API;
