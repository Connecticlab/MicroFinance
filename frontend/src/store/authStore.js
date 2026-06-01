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

// Helper de permissions
export const usePermissions = () => {
  const user = useAuthStore(state => state.user);
  const role = user?.role;
  const isAdmin = user?.is_staff || user?.is_superuser;

  return {
    // Rôles
    estDG: role === 'DG' || isAdmin,
    estComptable: role === 'COMPTABLE',
    estSuperviseur: role === 'SUPERVISEUR',
    estAdmin: isAdmin,

    // Membres
    peutCreerMembre: ['DG', 'COMPTABLE'].includes(role) || isAdmin,
    peutValiderMembre: ['DG', 'SUPERVISEUR'].includes(role) || isAdmin,
    peutSuspendreExclure: ['DG', 'SUPERVISEUR'].includes(role) || isAdmin,

    // Crédits
    peutCreerCredit: ['DG', 'COMPTABLE'].includes(role) || isAdmin,
    peutApprouverCredit: role === 'DG' || isAdmin,
    peutDebloquerCredit: role === 'DG' || isAdmin,
    peutRejeterCredit: role === 'DG' || isAdmin,

    // Remboursements
    peutSaisirRemboursement: ['DG', 'COMPTABLE'].includes(role) || isAdmin,

    // Caisse
    peutVoirCaisse: ['DG', 'COMPTABLE'].includes(role) || isAdmin,

    // Recouvrement
    peutGererRecouvrement: ['DG', 'SUPERVISEUR'].includes(role) || isAdmin,

    // Utilisateurs
    peutGererUtilisateurs: role === 'DG' || isAdmin,
  };
};
