import api from './axios';

export const getMembres = (params) => api.get('/membres/', { params });
export const getMembre = (id) => api.get(`/membres/${id}/`);
export const createMembre = (data) => api.post('/membres/', data);
export const updateMembre = (id, data) => api.put(`/membres/${id}/`, data);
export const validerAdhesion = (id) => api.post(`/membres/${id}/valider_adhesion/`);
export const suspendreMembre = (id) => api.post(`/membres/${id}/suspendre/`);
