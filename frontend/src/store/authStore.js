import { create } from 'zustand';
import { login as loginApi, logout as logoutApi, getProfil } from '../api/auth';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      await loginApi(username, password);
      const res = await getProfil();
      set({ user: res.data, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.detail || 'Identifiants incorrects.',
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    logoutApi();
    set({ user: null, isAuthenticated: false });
  },

  fetchProfil: async () => {
    try {
      const res = await getProfil();
      set({ user: res.data });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },
}));

export default useAuthStore;
