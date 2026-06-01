import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Membres from './pages/membres/Membres';
import NouveauMembre from './pages/membres/NouveauMembre';
import DetailMembre from './pages/membres/DetailMembre';
import Credits from './pages/credits/Credits';
import NouveauCredit from './pages/credits/NouveauCredit';
import DetailCredit from './pages/credits/DetailCredit';
import Remboursements from './pages/remboursements/Remboursements';
import NouveauRemboursement from './pages/remboursements/NouveauRemboursement';
import Caisse from './pages/caisse/Caisse';
import Recouvrement from './pages/recouvrement/Recouvrement';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
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
                    <Route path="/credits" element={<Credits />} />
                    <Route path="/credits/nouveau" element={<NouveauCredit />} />
                    <Route path="/credits/:id" element={<DetailCredit />} />
                    <Route path="/remboursements" element={<Remboursements />} />
                    <Route path="/remboursements/nouveau" element={<NouveauRemboursement />} />
                    <Route path="/caisse" element={<Caisse />} />
                    <Route path="/recouvrement" element={<Recouvrement />} />
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
