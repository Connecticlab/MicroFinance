import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate } from '../../utils/date';

const IconCredit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMoney = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

function InfoCard({ icon, title, color, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ ...styles.cardIcon, background: color + '15', color }}>{icon}</div>
        <h2 style={styles.cardTitle}>{title}</h2>
      </div>
      <div style={styles.cardBody}>{children}</div>
    </div>
  );
}

function Row({ label, value, highlight, bold }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={{ ...styles.rowValue, color: highlight || '#111827', fontWeight: bold ? '700' : '500' }}>{value || '—'}</span>
    </div>
  );
}

const modeInfo = (mode) => ({
  ESPECES:      { icon: '💵', label: 'Espèces',      bg: '#F0FDF4', color: '#16A34A' },
  MOBILE_MONEY: { icon: '📱', label: 'Mobile Money', bg: '#EFF6FF', color: '#2563EB' },
  VIREMENT:     { icon: '🏦', label: 'Virement',     bg: '#FFF7ED', color: '#EA580C' },
})[mode] || { icon: '💰', label: mode, bg: '#F3F4F6', color: '#6B7280' };

export default function DetailRemboursement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [remboursement, setRemboursement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/remboursements/${id}/`).then(res => {
      setRemboursement(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const telechargerRecu = async () => {
    try {
      const res = await api.get(`/remboursements/${id}/recu_pdf/`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.target = '_blank';
      link.download = `Recu_${remboursement.numero_remboursement}.pdf`;
      link.click();
    } catch (err) { alert('Erreur lors de la génération du reçu.'); }
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!remboursement) return <div style={styles.loading}>Remboursement introuvable.</div>;

  const dossier = remboursement.dossier_detail || {};
  const mode = modeInfo(remboursement.mode_paiement);
  const hasPenalite = Number(remboursement.montant_penalite) > 0;
  const montantAccorde = Number(dossier.montant_accorde || 0);
  const montantRembourse = Number(dossier.montant_rembourse || 0);
  const progression = montantAccorde > 0 ? Math.round((montantRembourse / montantAccorde) * 100) : 0;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.pageHeader}>
        <button style={styles.btnBack} onClick={() => navigate('/remboursements')}>← Retour</button>

        {/* Hero */}
        <div style={styles.heroCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, flexWrap: 'wrap' }}>
            <div style={styles.heroIcon}>💰</div>
            <div>
              <h1 style={styles.heroTitle}>{remboursement.numero_remboursement}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={styles.heroSub}>{dossier.membre_nom || '—'}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{formatDate(remboursement.date_paiement)}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ ...styles.modeBadge, background: mode.bg, color: mode.color }}>
              {mode.icon} {mode.label}
            </span>
            <button style={styles.btnRecu} onClick={telechargerRecu}>🧾 Reçu PDF</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Montant versé</div>
          <div style={{ ...styles.kpiValue, color: '#1A6FD4' }}>{Number(remboursement.montant_verse).toLocaleString()} F</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Principal</div>
          <div style={{ ...styles.kpiValue, color: '#16A34A' }}>{Number(remboursement.montant_principal || 0).toLocaleString()} F</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Pénalité</div>
          <div style={{ ...styles.kpiValue, color: hasPenalite ? '#EF4444' : '#9CA3AF' }}>
            {hasPenalite ? '⚠ ' : ''}{Number(remboursement.montant_penalite || 0).toLocaleString()} F
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Progression crédit</div>
          <div style={{ ...styles.kpiValue, color: '#7C3AED' }}>{progression}%</div>
          <div style={{ background: '#F3F4F6', borderRadius: '99px', height: '4px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${progression}%`, height: '100%', background: '#7C3AED', borderRadius: '99px' }} />
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={styles.grid}>
        <div style={styles.col}>
          <InfoCard icon={<IconMoney />} title="Détails du paiement" color="#1A6FD4">
            <Row label="Numéro reçu" value={remboursement.numero_remboursement} bold />
            <Row label="Date de paiement" value={formatDate(remboursement.date_paiement)} />
            <Row label="Mode de paiement" value={`${mode.icon} ${mode.label}`} />
            <Row label="Référence transaction" value={remboursement.reference_paiement} />
            <Row label="Montant versé" value={`${Number(remboursement.montant_verse).toLocaleString()} FCFA`} highlight="#1A6FD4" bold />
            <Row label="dont Principal" value={`${Number(remboursement.montant_principal || 0).toLocaleString()} FCFA`} highlight="#16A34A" />
            <Row label="dont Pénalité" value={`${Number(remboursement.montant_penalite || 0).toLocaleString()} FCFA`} highlight={hasPenalite ? '#EF4444' : '#9CA3AF'} />
            {remboursement.notes && <Row label="Notes" value={remboursement.notes} />}
          </InfoCard>
        </div>

        <div style={styles.col}>
          <InfoCard icon={<IconCredit />} title="Dossier de crédit" color="#16A34A">
            <Row label="N° Dossier" value={dossier.numero_dossier} bold />
            <Row label="Fréquence" value={dossier.frequence_remboursement} />
            <Row label="Montant accordé" value={`${Number(dossier.montant_accorde || 0).toLocaleString()} FCFA`} />
            <Row label="Total remboursé" value={`${montantRembourse.toLocaleString()} FCFA`} highlight="#16A34A" />
            <Row label="Restant" value={`${Number(dossier.montant_restant || 0).toLocaleString()} FCFA`} highlight="#EF4444" />
            <div style={{ marginTop: '12px' }}>
              <button style={styles.btnVoirCredit} onClick={() => navigate(`/credits/${remboursement.dossier}`)}>
                💳 Voir le dossier complet
              </button>
            </div>
          </InfoCard>

          <InfoCard icon={<IconUser />} title="Membre" color="#7C3AED">
            <Row label="Nom complet" value={dossier.membre_nom} bold />
            <button style={{ ...styles.btnVoirCredit, marginTop: '12px', background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}
              onClick={() => navigate(`/membres/${dossier.membre}`)}>
              👤 Voir la fiche membre
            </button>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  loading: { padding: '40px', textAlign: 'center', color: '#6B7280' },
  pageHeader: { marginBottom: '24px' },
  btnBack: { padding: '8px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151', fontWeight: '500', marginBottom: '16px', display: 'inline-block' },
  heroCard: { background: 'linear-gradient(135deg, #1E3A5F 0%, #16A34A 100%)', borderRadius: '14px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: '0 4px 20px rgba(22,163,74,0.3)' },
  heroIcon: { fontSize: '36px', width: '64px', height: '64px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroTitle: { fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 },
  heroSub: { fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  modeBadge: { padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600' },
  btnRecu: { padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  kpiCard: { background: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  kpiLabel: { fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600', marginBottom: '6px' },
  kpiValue: { fontSize: '18px', fontWeight: '800', color: '#111827' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  col: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' },
  cardIcon: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 },
  cardBody: { padding: '12px 20px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F9FAFB' },
  rowLabel: { fontSize: '13px', color: '#6B7280' },
  rowValue: { fontSize: '13px', textAlign: 'right' },
  btnVoirCredit: { padding: '8px 16px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
};
