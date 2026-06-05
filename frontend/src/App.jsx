import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore, { usePermissions } from './store/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Membres from './pages/membres/Membres';
import NouveauMembre from './pages/membres/NouveauMembre';
import DetailMembre from './pages/membres/DetailMembre';
import ModifierMembre from './pages/membres/ModifierMembre';
import Credits from './pages/credits/Credits';
import NouveauCredit from './pages/credits/NouveauCredit';
import DetailCredit from './pages/credits/DetailCredit';
import Remboursements from './pages/remboursements/Remboursements';
import NouveauRemboursement from './pages/remboursements/NouveauRemboursement';
import DetailRemboursement from './pages/remboursements/DetailRemboursement';
import Caisse from './pages/caisse/Caisse';
import Recouvrement from './pages/recouvrement/Recouvrement';
import DetailRecouvrement from './pages/recouvrement/DetailRecouvrement';
import Utilisateurs from './pages/utilisateurs/Utilisateurs';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function RoleRoute({ children, permission }) {
  const perms = usePermissions();
  if (!perms[permission]) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ color: '#EF4444' }}>Accès refusé</h2>
        <p style={{ color: '#6B7280' }}>Vous n'avez pas les droits pour accéder à cette page.</p>
      </div>
    );
  }
  return children;
}

export default function App() {
  const { fetchProfil, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) fetchProfil();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <div style={{ marginLeft: '240px', flex: 1, minHeight: '100vh', background: '#F9FAFB', width: 'calc(100vw - 240px)' }}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/membres" element={<Membres />} />
                    <Route path="/membres/nouveau" element={<NouveauMembre />} />
                    <Route path="/membres/:id" element={<DetailMembre />} />
                    <Route path="/membres/:id/modifier" element={<ModifierMembre />} />
                    <Route path="/credits" element={<Credits />} />
                    <Route path="/credits/nouveau" element={<NouveauCredit />} />
                    <Route path="/credits/:id" element={<DetailCredit />} />
                    <Route path="/remboursements" element={<Remboursements />} />
                    <Route path="/remboursements/nouveau" element={<NouveauRemboursement />} />
                    <Route path="/remboursements/:id" element={<DetailRemboursement />} />
                    <Route path="/caisse" element={<Caisse />} />
                    <Route path="/recouvrement" element={<Recouvrement />} />
                    <Route path="/recouvrement/:id" element={<DetailRecouvrement />} />
                    <Route path="/utilisateurs" element={
                      <RoleRoute permission="peutGererUtilisateurs">
                        <Utilisateurs />
                      </RoleRoute>
                    } />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </div>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
