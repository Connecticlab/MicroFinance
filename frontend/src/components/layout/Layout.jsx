import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore, { usePermissions } from '../../store/authStore';
import api from '../../api/axios';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
  { path: '/membres', label: 'Membres', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { path: '/credits', label: 'Crédits', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )},
  { path: '/remboursements', label: 'Remboursements', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )},
  { path: '/caisse', label: 'Caisse', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { path: '/recouvrement', label: 'Recouvrement', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )},
  { path: '/utilisateurs', label: 'Utilisateurs', adminOnly: true, icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
];

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const perms = usePermissions();
  const [config, setConfig] = useState(null);
  const [hoveredPath, setHoveredPath] = useState(null);

  useEffect(() => {
    api.get('/core/configuration/').then(res => setConfig(res.data)).catch(() => {});
  }, []);

  const nomEntreprise = config?.nom_entreprise || 'MicroFinance+';
  const slogan = config?.slogan || 'CTL Group';
  const logoUrl = config?.logo_url || null;

  const initiale = (user?.nom_complet || user?.username || '?').charAt(0).toUpperCase();
  const avatarColors = ['#1A6FD4','#9333EA','#16A34A','#F59E0B'];
  const avatarColor = avatarColors[(user?.username || '').charCodeAt(0) % avatarColors.length];

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>

        {/* Logo */}
        <div style={styles.logoSection}>
          {logoUrl ? (
            <img src={logoUrl} alt={nomEntreprise}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }} />
          ) : (
            <div style={styles.logoFallback}>
              <div style={styles.logoIcon}>M+</div>
              <div>
                <div style={styles.logoText}>{nomEntreprise}</div>
                <div style={styles.logoSub}>{slogan}</div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {menuItems
            .filter(item => !item.adminOnly || perms.peutGererUtilisateurs)
            .map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const isHovered = hoveredPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {}),
                    ...(isHovered && !isActive ? styles.navItemHover : {}),
                  }}
                  onMouseEnter={() => setHoveredPath(item.path)}
                  onMouseLeave={() => setHoveredPath(null)}
                >
                  <span style={{
                    ...styles.navIcon,
                    color: isActive ? '#fff' : '#6B7280',
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '400' }}>
                    {item.label}
                  </span>
                  {isActive && <div style={styles.activeIndicator} />}
                </Link>
              );
            })}
        </nav>

        {/* User section */}
        <div style={styles.userSection}>
          <div style={styles.userCard}>
            <div style={{ ...styles.userAvatar, background: avatarColor }}>
              {initiale}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.userName}>
                {user?.nom_complet || user?.username}
              </div>
              <div style={styles.userRole}>{user?.role_display || user?.role}</div>
            </div>
          </div>
          <button onClick={logout} style={styles.logoutBtn}
            onMouseEnter={e => e.target.style.background = '#1F2937'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%', overflow: 'hidden' },
  sidebar: {
    width: '240px', background: '#0F172A', color: '#fff',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, height: '100vh',
    borderRight: '1px solid #1E293B',
  },
  logoSection: {
    padding: '0', borderBottom: '1px solid #1E293B',
    display: 'flex', alignItems: 'center', overflow: 'hidden', minHeight: '100px', maxHeight: '160px',
  },
  logoFallback: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: {
    width: '36px', height: '36px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #1A6FD4, #7C3AED)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '800', color: '#fff', flexShrink: 0,
  },
  logoText: { fontSize: '15px', fontWeight: '700', color: '#fff', lineHeight: 1.2 },
  logoSub: { fontSize: '11px', color: '#1A6FD4', marginTop: '2px' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', color: '#94A3B8',
    textDecoration: 'none', borderRadius: '8px',
    position: 'relative', transition: 'all 0.15s',
  },
  navItemActive: { background: '#1A6FD4', color: '#fff' },
  navItemHover: { background: '#1E293B', color: '#E2E8F0' },
  navIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activeIndicator: {
    position: 'absolute', right: '8px', width: '6px', height: '6px',
    borderRadius: '50%', background: 'rgba(255,255,255,0.6)',
  },
  userSection: { padding: '12px 8px', borderTop: '1px solid #1E293B' },
  userCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '8px' },
  userAvatar: {
    width: '32px', height: '32px', borderRadius: '50%', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700', flexShrink: 0,
  },
  userName: { fontSize: '13px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: '11px', color: '#475569', marginTop: '1px' },
  logoutBtn: {
    width: '100%', padding: '8px 12px',
    background: 'transparent', border: '1px solid #1E293B',
    color: '#64748B', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
    justifyContent: 'center', transition: 'background 0.15s',
  },
  main: { flex: 1, background: '#F9FAFB', minHeight: '100vh', overflow: 'hidden', minWidth: 0 },
};
