import api from './axios';

export const getResumeDashboard = () => api.get('/rapports/dashboard/resume/');
export const getSoldeCaisse = () => api.get('/caisse/solde/');
export const getEcritures = (params) => api.get('/caisse/', { params });
