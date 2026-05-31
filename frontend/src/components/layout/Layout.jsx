import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/membres', label: 'Membres', icon: '👥' },
  { path: '/credits', label: 'Crédits', icon: '💳' },
  { path: '/remboursements', label: 'Remboursements', icon: '💰' },
  { path: '/caisse', label: 'Caisse', icon: '🏦' },
  { path: '/recouvrement', label: 'Recouvrement', icon: '⚠️' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <h2 style={styles.logoText}>MicroFinance+</h2>
          <p style={styles.logoSub}>CTL Group</p>
        </div>
        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={styles.userSection}>
          <div style={styles.userName}>
            {user?.nom_complet || user?.username}
          </div>
          <div style={styles.userRole}>{user?.role_display}</div>
          <button onClick={logout} style={styles.logoutBtn}>
            Déconnexion
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif',
  },
  sidebar: {
    width: '240px',
    background: '#111827',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid #1F2937',
  },
  logoText: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
  },
  logoSub: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#1A6FD4',
  },
  nav: {
    flex: 1,
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 20px',
    color: '#9CA3AF',
    textDecoration: 'none',
    fontSize: '14px',
    borderRadius: '0',
    transition: 'all 0.2s',
  },
  navItemActive: {
    background: '#1A6FD4',
    color: '#fff',
  },
  navIcon: {
    fontSize: '16px',
  },
  userSection: {
    padding: '16px 20px',
    borderTop: '1px solid #1F2937',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },
  userRole: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '2px',
  },
  logoutBtn: {
    marginTop: '12px',
    width: '100%',
    padding: '8px',
    background: 'transparent',
    border: '1px solid #374151',
    color: '#9CA3AF',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};
