import api from './axios';
import axios from 'axios';

export const login = async (username, password) => {
  const res = await axios.post('/api/auth/login/', { username, password });
  localStorage.setItem('access_token', res.data.access);
  localStorage.setItem('refresh_token', res.data.refresh);
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
};

export const getProfil = () => api.get('/core/utilisateurs/profil/');
