import api from './axios';

export const getCredits = (params) => api.get('/credits/', { params });
export const getCredit = (id) => api.get(`/credits/${id}/`);
export const createCredit = (data) => api.post('/credits/', data);
export const updateCredit = (id, data) => api.put(`/credits/${id}/`, data);
export const soumettreDossier = (id) => api.post(`/credits/${id}/soumettre/`);
export const approuverDossier = (id, data) => api.post(`/credits/${id}/approuver/`, data);
export const debloquerDossier = (id) => api.post(`/credits/${id}/debloquer/`);
export const rejeterDossier = (id, data) => api.post(`/credits/${id}/rejeter/`, data);
