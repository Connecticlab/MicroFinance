import api from './axios';

export const getMembres = (params) => api.get('/membres/', { params });
export const getMembre = (id) => api.get(`/membres/${id}/`);
export const getMembreUrl = (path) => path ? `http://192.168.1.8${path}` : null;
export const createMembre = (data) => api.post('/membres/', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateMembre = (id, data) => api.put(`/membres/${id}/`, data);
export const validerAdhesion = (id) => api.post(`/membres/${id}/valider_adhesion/`);
export const approuverMembre = (id) => api.post(`/membres/${id}/approuver/`);
export const rejeterMembre = (id, data) => api.post(`/membres/${id}/rejeter/`, data);
export const payerFraisMembre = (id, data) => api.post(`/membres/${id}/payer_frais/`, data);
export const suspendreMembre = (id) => api.post(`/membres/${id}/suspendre/`);

export const reactiversMembre = (id) => api.post(`/membres/${id}/reactiver/`);
export const exclureMembre = (id) => api.post(`/membres/${id}/exclure/`);
