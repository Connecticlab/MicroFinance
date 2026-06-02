import { useEffect, useState } from 'react';
import { getResumeDashboard, getSoldeCaisse } from '../../api/dashboard';

const IconMembers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCredit = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconAlert = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <triangle points="10.29 3.86 1.82 18 22.18 18"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  </svg>
);
const IconCaisse = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IconDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const IconBalance = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: '#F3F4F6', borderRadius: '99px', height: '6px', marginTop: '10px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.6s ease' }} />
    </div>
  );
}

export default function Dashboard() {
  const [resume, setResume] = useState(null);
  const [solde, setSolde] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [r, s] = await Promise.all([getResumeDashboard(), getSoldeCaisse()]);
        setResume(r.data);
        setSolde(s.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  const par30 = resume?.indicateurs?.par30 ?? 0;
  const par90 = resume?.indicateurs?.par90 ?? 0;
  const tauxRemb = resume?.indicateurs?.taux_remboursement ?? 0;
  const encours = Number(resume?.credits?.total_encours ?? 0);

  const kpis = [
    {
      label: 'Membres actifs',
      value: resume?.membres?.actifs ?? 0,
      sub: `Total : ${resume?.membres?.total ?? 0}`,
      color: '#1A6FD4', bg: '#EFF6FF', icon: <IconMembers />
    },
    {
      label: 'Crédits en cours',
      value: resume?.credits?.en_cours ?? 0,
      sub: 'dossiers actifs',
      color: '#16A34A', bg: '#F0FDF4', icon: <IconCredit />
    },
    {
      label: 'Crédits en défaut',
      value: resume?.credits?.en_defaut ?? 0,
      sub: 'nécessitent attention',
      color: '#EF4444', bg: '#FEF2F2', icon: <IconAlert />
    },
    {
      label: 'Solde caisse',
      value: `${Number(solde?.solde_actuel ?? 0).toLocaleString()}`,
      sub: 'FCFA',
      color: '#F59E0B', bg: '#FFFBEB', icon: <IconCaisse />
    },
  ];

  const risques = [
    {
      label: 'PAR 30', value: par30, unit: '%',
      seuil: 'Seuil : 5%', max: 10,
      color: par30 > 5 ? '#EF4444' : '#16A34A',
      ok: par30 <= 5
    },
    {
      label: 'PAR 90', value: par90, unit: '%',
      seuil: 'Seuil : 3%', max: 10,
      color: par90 > 3 ? '#EF4444' : '#16A34A',
      ok: par90 <= 3
    },
    {
      label: 'Taux remboursement', value: tauxRemb, unit: '%',
      seuil: 'Objectif : ≥ 95%', max: 100,
      color: tauxRemb >= 95 ? '#16A34A' : '#F59E0B',
      ok: tauxRemb >= 95
    },
    {
      label: 'Encours total', value: encours.toLocaleString(), unit: 'FCFA',
      seuil: 'portefeuille actif', max: null,
      color: '#1A6FD4', ok: true
    },
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Tableau de bord</h1>
          <p style={styles.subtitle}>Vue d'ensemble de l'activité — MicroFinance+</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.grid4}>
        {kpis.map((k) => (
          <div key={k.label} style={styles.kpiCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ ...styles.kpiIcon, background: k.bg, color: k.color }}>
                {k.icon}
              </div>
            </div>
            <div style={{ ...styles.kpiValue, color: k.color }}>{k.value}</div>
            <div style={styles.kpiLabel}>{k.label}</div>
            <div style={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Indicateurs de risque */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Indicateurs de risque</h2>
          <span style={styles.sectionBadge}>Portefeuille</span>
        </div>
        <div style={styles.grid4}>
          {risques.map((r) => (
            <div key={r.label} style={styles.risqueCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={styles.risqueLabel}>{r.label}</span>
                <span style={{
                  ...styles.risqueBadge,
                  background: r.ok ? '#F0FDF4' : '#FEF2F2',
                  color: r.ok ? '#16A34A' : '#EF4444'
                }}>
                  {r.ok ? '✓ OK' : '✗ Alerte'}
                </span>
              </div>
              <div style={{ ...styles.risqueValue, color: r.color }}>
                {r.value} <span style={styles.risqueUnit}>{r.unit}</span>
              </div>
              {r.max !== null && (
                <ProgressBar value={typeof r.value === 'number' ? r.value : 0} max={r.max} color={r.color} />
              )}
              <div style={styles.risqueSeuil}>{r.seuil}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Résumé caisse */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Résumé de la caisse</h2>
          <span style={styles.sectionBadge}>Trésorerie</span>
        </div>
        <div style={styles.grid3}>
          <div style={{ ...styles.caisseCard, borderLeft: '4px solid #16A34A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ ...styles.caisseIcon, background: '#F0FDF4', color: '#16A34A' }}><IconUp /></div>
              <span style={styles.caisseLabel}>Total entrées</span>
            </div>
            <div style={{ ...styles.caisseValue, color: '#16A34A' }}>
              + {Number(solde?.total_entrees ?? 0).toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ ...styles.caisseCard, borderLeft: '4px solid #EF4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ ...styles.caisseIcon, background: '#FEF2F2', color: '#EF4444' }}><IconDown /></div>
              <span style={styles.caisseLabel}>Total sorties</span>
            </div>
            <div style={{ ...styles.caisseValue, color: '#EF4444' }}>
              - {Number(solde?.total_sorties ?? 0).toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ ...styles.caisseCard, borderLeft: '4px solid #1A6FD4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ ...styles.caisseIcon, background: '#EFF6FF', color: '#1A6FD4' }}><IconBalance /></div>
              <span style={styles.caisseLabel}>Solde actuel</span>
            </div>
            <div style={{ ...styles.caisseValue, color: '#1A6FD4' }}>
              {Number(solde?.solde_actuel ?? 0).toLocaleString()} FCFA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  loading: { padding: '40px', textAlign: 'center', color: '#6B7280' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  subtitle: { fontSize: '13px', color: '#6B7280', marginTop: '4px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  kpiCard: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '4px' },
  kpiIcon: { width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' },
  kpiValue: { fontSize: '30px', fontWeight: '800', lineHeight: 1 },
  kpiLabel: { fontSize: '13px', color: '#374151', fontWeight: '500', marginTop: '4px' },
  kpiSub: { fontSize: '12px', color: '#9CA3AF' },
  section: { marginBottom: '32px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  sectionTitle: { fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 },
  sectionBadge: { fontSize: '11px', fontWeight: '600', color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: '99px' },
  risqueCard: { background: '#fff', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  risqueLabel: { fontSize: '12px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' },
  risqueBadge: { fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px' },
  risqueValue: { fontSize: '28px', fontWeight: '800', marginTop: '6px' },
  risqueUnit: { fontSize: '14px', fontWeight: '500' },
  risqueSeuil: { fontSize: '11px', color: '#9CA3AF', marginTop: '8px' },
  caisseCard: { background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  caisseIcon: { width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  caisseLabel: { fontSize: '13px', color: '#6B7280', fontWeight: '500' },
  caisseValue: { fontSize: '22px', fontWeight: '800' },
};
