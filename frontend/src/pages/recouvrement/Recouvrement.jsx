import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const statutConfig = {
  OUVERT:   { label: 'Ouvert',          bg: '#FFFBEB', color: '#F59E0B', border: '#FDE68A' },
  EN_COURS: { label: 'En cours',        bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  RESOLU:   { label: 'Résolu',          bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  PERTE:    { label: 'Passé en perte',  bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

const etapeConfig = {
  RELANCE_AMIABLE:  { label: 'Relance amiable',  color: '#6B7280', step: 1 },
  MISE_EN_DEMEURE:  { label: 'Mise en demeure',  color: '#F59E0B', step: 2 },
  PROCEDURE_LEGALE: { label: 'Procédure légale', color: '#EF4444', step: 3 },
  PERTE:            { label: 'Passé en perte',   color: '#7F1D1D', step: 4 },
};

function EtapeIndicator({ etape }) {
  const cfg = etapeConfig[etape] || { label: etape, color: '#6B7280', step: 1 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: cfg.color, flexShrink: 0
      }} />
      <span style={{ fontSize: '12px', color: cfg.color, fontWeight: '600' }}>{cfg.label}</span>
    </div>
  );
}

export default function Recouvrement() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState('');

  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statut) params.statut = statut;
      const res = await api.get('/recouvrement/dossiers/', { params });
      setDossiers(res.data.results);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDossiers(); }, [statut]);

  const handleEscalader = async (id) => {
    await api.post(`/recouvrement/dossiers/${id}/escalader/`);
    fetchDossiers();
  };

  // Stats rapides
  const stats = {
    total:    dossiers.length,
    ouvert:   dossiers.filter(d => d.statut === 'OUVERT').length,
    en_cours: dossiers.filter(d => d.statut === 'EN_COURS').length,
    resolu:   dossiers.filter(d => d.statut === 'RESOLU').length,
    perte:    dossiers.filter(d => d.statut === 'PERTE').length,
    montant_defaut:   dossiers.reduce((s, d) => s + Number(d.montant_en_defaut || 0), 0),
    montant_recouvre: dossiers.reduce((s, d) => s + Number(d.montant_recouvre || 0), 0),
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Recouvrement</h1>
          <p style={styles.subtitle}>Suivi des dossiers de créances en défaut</p>
        </div>
      </div>

      {/* Stats cards */}
      <div style={styles.grid4}>
        {[
          { label: 'Total dossiers',    value: stats.total,    color: '#1A6FD4', bg: '#EFF6FF' },
          { label: 'Ouverts',           value: stats.ouvert,   color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'En cours',          value: stats.en_cours, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Résolus',           value: stats.resolu,   color: '#16A34A', bg: '#F0FDF4' },
        ].map(c => (
          <div key={c.label} style={styles.statCard}>
            <div style={{ ...styles.statValue, color: c.color }}>{c.value}</div>
            <div style={styles.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Montants */}
      <div style={styles.grid2}>
        <div style={{ ...styles.montantCard, borderLeft: '4px solid #EF4444' }}>
          <div style={styles.montantLabel}>Total montant en défaut</div>
          <div style={{ ...styles.montantValue, color: '#EF4444' }}>
            {stats.montant_defaut.toLocaleString()} FCFA
          </div>
        </div>
        <div style={{ ...styles.montantCard, borderLeft: '4px solid #16A34A' }}>
          <div style={styles.montantLabel}>Total montant recouvré</div>
          <div style={{ ...styles.montantValue, color: '#16A34A' }}>
            {stats.montant_recouvre.toLocaleString()} FCFA
          </div>
        </div>
      </div>

      {/* Filtre */}
      <div style={styles.filterCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={styles.label}>Filtrer par statut</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { value: '', label: 'Tous' },
              { value: 'OUVERT', label: 'Ouvert' },
              { value: 'EN_COURS', label: 'En cours' },
              { value: 'RESOLU', label: 'Résolu' },
              { value: 'PERTE', label: 'Passé en perte' },
            ].map(opt => (
              <button key={opt.value}
                style={{
                  ...styles.filterBtn,
                  background: statut === opt.value ? '#1A6FD4' : '#F3F4F6',
                  color: statut === opt.value ? '#fff' : '#374151',
                  border: statut === opt.value ? '1px solid #1A6FD4' : '1px solid #E5E7EB',
                }}
                onClick={() => setStatut(opt.value)}>
                {opt.label}
                {opt.value && <span style={{
                  marginLeft: '6px', fontSize: '11px', fontWeight: '700',
                  background: statut === opt.value ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                  padding: '1px 6px', borderRadius: '99px',
                  color: statut === opt.value ? '#fff' : '#6B7280',
                }}>
                  {dossiers.filter(d => d.statut === opt.value).length}
                </span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div style={styles.empty}>Chargement...</div>
      ) : dossiers.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>⚠️</div>
          <p style={{ color: '#6B7280', fontSize: '15px' }}>Aucun dossier de recouvrement</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Numéro</th>
                <th style={styles.th}>Crédit</th>
                <th style={styles.th}>Membre</th>
                <th style={styles.th}>Étape</th>
                <th style={styles.th}>Montant défaut</th>
                <th style={styles.th}>Montant recouvré</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dossiers.map((d, i) => {
                const sc = statutConfig[d.statut] || { label: d.statut, bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
                const montantDefaut = Number(d.montant_en_defaut || 0);
                const montantRecouvre = Number(d.montant_recouvre || 0);
                const tauxRecouvrement = montantDefaut > 0 ? Math.round((montantRecouvre / montantDefaut) * 100) : 0;

                return (
                  <tr key={d.id} style={{ ...styles.tr, background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>
                        {d.numero_dossier}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A6FD4' }}>
                        {d.credit_numero}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: '#EF4444', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                        }}>
                          {d.membre_nom ? d.membre_nom.charAt(0) : '?'}
                        </div>
                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                          {d.membre_nom}
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <EtapeIndicator etape={d.etape_actuelle} />
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '700', color: '#EF4444', fontSize: '13px' }}>
                        {montantDefaut.toLocaleString()} F
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <span style={{ fontWeight: '700', color: '#16A34A', fontSize: '13px' }}>
                          {montantRecouvre.toLocaleString()} F
                        </span>
                        <div style={{ background: '#F3F4F6', borderRadius: '99px', height: '4px', marginTop: '4px', width: '80px', overflow: 'hidden' }}>
                          <div style={{ width: `${tauxRecouvrement}%`, height: '100%', background: '#16A34A', borderRadius: '99px' }} />
                        </div>
                        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{tauxRecouvrement}%</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`
                      }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={styles.btnDetail}
                          onClick={() => navigate(`/recouvrement/${d.id}`)}>
                          👁 Détail
                        </button>
                        {d.statut !== 'RESOLU' && d.statut !== 'PERTE' && (
                          <button style={styles.btnEscalader}
                            onClick={() => handleEscalader(d.id)}>
                            ↑ Escalader
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  subtitle: { fontSize: '13px', color: '#6B7280', marginTop: '4px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  statValue: { fontSize: '32px', fontWeight: '800', lineHeight: 1 },
  statLabel: { fontSize: '13px', color: '#6B7280', marginTop: '6px' },
  montantCard: { background: '#fff', borderRadius: '12px', padding: '18px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  montantLabel: { fontSize: '13px', color: '#6B7280', marginBottom: '6px' },
  montantValue: { fontSize: '22px', fontWeight: '800' },
  filterCard: { background: '#fff', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' },
  filterBtn: { padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  tableWrapper: { background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F8FAFC' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151', verticalAlign: 'middle' },
  empty: { textAlign: 'center', padding: '40px', color: '#9CA3AF' },
  emptyState: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '10px' },
  btnDetail: { padding: '5px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#2563EB', fontWeight: '600' },
  btnEscalader: { padding: '5px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#F59E0B', fontWeight: '600' },
};
