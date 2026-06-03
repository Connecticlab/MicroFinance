import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate } from '../../utils/date';
import { usePermissions } from '../../store/authStore';

const statutConfig = {
  OUVERT:   { label: 'Ouvert',         bg: '#FFFBEB', color: '#F59E0B', border: '#FDE68A' },
  EN_COURS: { label: 'En cours',       bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  RESOLU:   { label: 'Résolu',         bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  PERTE:    { label: 'Passé en perte', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

const etapeConfig = {
  RELANCE_1: { label: 'Relance amiable',    sub: 'J+7',  color: '#6B7280', step: 1 },
  RELANCE_2: { label: 'Mise en demeure',    sub: 'J+30', color: '#F59E0B', step: 2 },
  RELANCE_3: { label: 'Intervention superviseur', sub: 'J+60', color: '#EF4444', step: 3 },
  RELANCE_4: { label: 'Procédure légale',   sub: 'J+90', color: '#7F1D1D', step: 4 },
};

const resultatConfig = {
  SANS_REPONSE:       { label: 'Sans réponse',       color: '#6B7280', bg: '#F3F4F6' },
  PROMESSE_PAIEMENT:  { label: 'Promesse de paiement', color: '#F59E0B', bg: '#FFFBEB' },
  PAIEMENT_PARTIEL:   { label: 'Paiement partiel',   color: '#2563EB', bg: '#EFF6FF' },
  PAIEMENT_TOTAL:     { label: 'Paiement total',     color: '#16A34A', bg: '#F0FDF4' },
  REFUSE:             { label: 'Refus de paiement',  color: '#DC2626', bg: '#FEF2F2' },
};

const typeActionLabel = {
  APPEL: 'Appel téléphonique', SMS: 'SMS', VISITE: 'Visite domicile',
  COURRIER: 'Courrier', MISE_EN_DEMEURE: 'Mise en demeure', AUTRE: 'Autre',
};

const typeActionIcon = {
  APPEL: '📞', SMS: '💬', VISITE: '🏠', COURRIER: '✉️', MISE_EN_DEMEURE: '⚖️', AUTRE: '📋',
};

const IconCredit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconClip = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const IconHistory = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
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

export default function DetailRecouvrement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const perms = usePermissions();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAction, setShowAction] = useState(false);
  const [action, setAction] = useState({
    type_action: 'APPEL',
    date_action: new Date().toISOString().split('T')[0],
    resultat: 'SANS_REPONSE',
    notes: '',
  });

  const fetchDossier = async () => {
    try {
      const res = await api.get(`/recouvrement/dossiers/${id}/`);
      setDossier(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDossier(); }, [id]);

  const handleEscalader = async () => {
    if (window.confirm('Confirmer l\'escalade vers l\'étape suivante ?')) {
      await api.post(`/recouvrement/dossiers/${id}/escalader/`); fetchDossier();
    }
  };
  const handleResoudre = async () => {
    if (window.confirm('Confirmer la résolution de ce dossier ?')) {
      await api.post(`/recouvrement/dossiers/${id}/resoudre/`); fetchDossier();
    }
  };
  const handlePasserEnPerte = async () => {
    if (window.confirm('Passer ce dossier en perte ? Cette action est irréversible.')) {
      await api.post(`/recouvrement/dossiers/${id}/passer_en_perte/`); fetchDossier();
    }
  };
  const handleAction = async (e) => {
    e.preventDefault();
    await api.post('/recouvrement/actions/', { ...action, dossier: id });
    setShowAction(false); fetchDossier();
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!dossier) return <div style={styles.loading}>Dossier introuvable.</div>;

  const sc = statutConfig[dossier.statut] || statutConfig.OUVERT;
  const etapeCourante = etapeConfig[dossier.etape_actuelle];
  const montantDefaut = Number(dossier.montant_en_defaut || 0);
  const montantRecouvre = Number(dossier.montant_recouvre || 0);
  const tauxRecouvrement = montantDefaut > 0 ? Math.round((montantRecouvre / montantDefaut) * 100) : 0;
  const isActif = dossier.statut !== 'RESOLU' && dossier.statut !== 'PERTE';

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.pageHeader}>
        <button style={styles.btnBack} onClick={() => navigate('/recouvrement')}>← Retour</button>

        {/* Hero */}
        <div style={styles.heroCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, flexWrap: 'wrap' }}>
            <div style={styles.heroIcon}>⚠️</div>
            <div>
              <h1 style={styles.heroTitle}>{dossier.numero_dossier}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={styles.heroMembre}>{dossier.membre_nom}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  {dossier.credit_numero}
                </span>
              </div>
            </div>
          </div>
          <span style={{ ...styles.statutBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
            ● {sc.label}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Montant en défaut</div>
          <div style={{ ...styles.kpiValue, color: '#EF4444' }}>{montantDefaut.toLocaleString()} F</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Montant recouvré</div>
          <div style={{ ...styles.kpiValue, color: '#16A34A' }}>{montantRecouvre.toLocaleString()} F</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Restant à recouvrer</div>
          <div style={{ ...styles.kpiValue, color: '#F59E0B' }}>
            {(montantDefaut - montantRecouvre).toLocaleString()} F
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Taux de recouvrement</div>
          <div style={{ ...styles.kpiValue, color: '#7C3AED' }}>{tauxRecouvrement}%</div>
          <div style={{ background: '#F3F4F6', borderRadius: '99px', height: '4px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${tauxRecouvrement}%`, height: '100%', background: '#7C3AED', borderRadius: '99px' }} />
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Actions</div>
          <div style={{ ...styles.kpiValue, color: '#1A6FD4' }}>{dossier.actions?.length || 0}</div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>enregistrées</div>
        </div>
      </div>

      {/* Étapes */}
      <div style={styles.etapesCard}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
          Progression de l'escalade
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {Object.entries(etapeConfig).map(([key, cfg], i) => {
            const isActive = dossier.etape_actuelle === key;
            const isPast = cfg.step < (etapeConfig[dossier.etape_actuelle]?.step || 0);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  background: isActive ? cfg.color : isPast ? '#F0FDF4' : '#F3F4F6',
                  color: isActive ? '#fff' : isPast ? '#16A34A' : '#9CA3AF',
                  border: isActive ? `1px solid ${cfg.color}` : isPast ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
                }}>
                  {isPast && !isActive && '✓ '}{cfg.label}
                  <span style={{ fontSize: '10px', marginLeft: '6px', opacity: 0.75 }}>{cfg.sub}</span>
                </div>
                {i < 3 && <div style={{ width: '24px', height: '2px', background: isPast ? '#16A34A' : '#E5E7EB' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions workflow */}
      {perms.peutGererRecouvrement && isActif && (
        <div style={styles.actionsBar}>
          <button style={styles.btnBlue} onClick={() => setShowAction(true)}>📝 Enregistrer une action</button>
          {dossier.etape_actuelle !== 'RELANCE_4' && (
            <button style={styles.btnOrange} onClick={handleEscalader}>↑ Escalader</button>
          )}
          <button style={styles.btnGreen} onClick={handleResoudre}>✅ Marquer résolu</button>
          <button style={styles.btnRed} onClick={handlePasserEnPerte}>Passer en perte</button>
        </div>
      )}

      {/* Modal action */}
      {showAction && (
        <div style={styles.overlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Enregistrer une action</h3>
              <button style={styles.btnClose} onClick={() => setShowAction(false)}>✕</button>
            </div>
            <form onSubmit={handleAction}>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Type d'action *</label>
                  <select value={action.type_action}
                    onChange={e => setAction({ ...action, type_action: e.target.value })}
                    style={styles.input}>
                    {Object.entries(typeActionLabel).map(([k, v]) => (
                      <option key={k} value={k}>{typeActionIcon[k]} {v}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Date *</label>
                  <input type="date" value={action.date_action}
                    onChange={e => setAction({ ...action, date_action: e.target.value })}
                    style={styles.input} required />
                </div>
                <div style={styles.field} style={{ gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Résultat *</label>
                  <select value={action.resultat}
                    onChange={e => setAction({ ...action, resultat: e.target.value })}
                    style={styles.input}>
                    {Object.entries(resultatConfig).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ ...styles.field, marginTop: '12px' }}>
                <label style={styles.label}>Notes</label>
                <textarea value={action.notes}
                  onChange={e => setAction({ ...action, notes: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Détails de l'action..." />
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.btnCancel} onClick={() => setShowAction(false)}>Annuler</button>
                <button type="submit" style={styles.btnBlue}>💾 Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contenu */}
      <div style={styles.grid}>
        <div style={styles.col}>
          <InfoCard icon={<IconCredit />} title="Crédit concerné" color="#EF4444">
            <Row label="N° Dossier" value={dossier.credit_detail?.numero_dossier || dossier.credit_numero} bold />
            <Row label="Membre" value={dossier.credit_detail?.membre_nom || dossier.membre_nom} />
            <Row label="Montant en défaut" value={`${montantDefaut.toLocaleString()} FCFA`} highlight="#EF4444" bold />
            <Row label="Montant recouvré" value={`${montantRecouvre.toLocaleString()} FCFA`} highlight="#16A34A" />
            <Row label="Restant" value={`${(montantDefaut - montantRecouvre).toLocaleString()} FCFA`} highlight="#F59E0B" />
          </InfoCard>

          <InfoCard icon={<IconClip />} title="Suivi du dossier" color="#7C3AED">
            <Row label="Date ouverture" value={formatDate(dossier.date_ouverture)} />
            <Row label="Date résolution" value={formatDate(dossier.date_resolution)} />
            <Row label="Assigné à" value={dossier.assigne_a_nom} />
            <Row label="Étape actuelle" value={etapeCourante?.label} />
          </InfoCard>
        </div>

        <div style={styles.col}>
          <InfoCard icon={<IconHistory />} title={`Historique des actions (${dossier.actions?.length || 0})`} color="#1A6FD4">
            {!dossier.actions?.length ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '14px' }}>
                Aucune action enregistrée.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dossier.actions.map(a => {
                  const rc = resultatConfig[a.resultat] || { label: a.resultat, color: '#6B7280', bg: '#F3F4F6' };
                  return (
                    <div key={a.id} style={{
                      padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px',
                      borderLeft: `3px solid ${rc.color}`, border: `1px solid #F1F5F9`,
                      borderLeftWidth: '3px', borderLeftColor: rc.color,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                          {typeActionIcon[a.type_action]} {typeActionLabel[a.type_action]}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{formatDate(a.date_action)}</span>
                      </div>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: '99px',
                        fontSize: '11px', fontWeight: '600', background: rc.bg, color: rc.color,
                        marginBottom: a.notes ? '6px' : '0'
                      }}>
                        {rc.label}
                      </span>
                      {a.notes && (
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', lineHeight: 1.5 }}>
                          {a.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
  heroCard: { background: 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)', borderRadius: '14px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: '0 4px 20px rgba(220,38,38,0.3)' },
  heroIcon: { fontSize: '36px', width: '64px', height: '64px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroTitle: { fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 },
  heroMembre: { fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  statutBadge: { padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600', flexShrink: 0 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' },
  kpiCard: { background: '#fff', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  kpiLabel: { fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600', marginBottom: '6px' },
  kpiValue: { fontSize: '16px', fontWeight: '800', color: '#111827' },
  etapesCard: { background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  actionsBar: { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', background: '#fff', padding: '16px 20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  btnBlue:   { padding: '9px 18px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnGreen:  { padding: '9px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnOrange: { padding: '9px 18px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnRed:    { padding: '9px 18px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnCancel: { padding: '9px 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: '12px', padding: '28px', width: '520px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '17px', fontWeight: 'bold', color: '#111827', margin: 0 },
  btnClose: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
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
};
