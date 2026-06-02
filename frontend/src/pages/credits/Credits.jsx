import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCredits, soumettreDossier } from '../../api/credits';
import { usePermissions } from '../../store/authStore';

export default function Credits() {
  const navigate = useNavigate();
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState('');
  const [search, setSearch] = useState('');
  const perms = usePermissions();

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statut) params.statut = statut;
      const res = await getCredits(params);
      setCredits(res.data.results);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCredits(); }, [search, statut]);

  const handleSoumettre = async (id) => { await soumettreDossier(id); fetchCredits(); };

  const statutConfig = {
    BROUILLON:  { color: '#6B7280', bg: '#F3F4F6', label: 'Brouillon' },
    SOUMIS:     { color: '#1A6FD4', bg: '#EFF6FF', label: 'Soumis' },
    EN_ETUDE:   { color: '#D97706', bg: '#FFF3CD', label: 'En étude' },
    APPROUVE:   { color: '#4BB543', bg: '#F0FDF4', label: 'Approuvé' },
    REJETE:     { color: '#EF4444', bg: '#FEF2F2', label: 'Rejeté' },
    DEBLOQUE:   { color: '#4BB543', bg: '#F0FDF4', label: 'Débloqué' },
    EN_COURS:   { color: '#1A6FD4', bg: '#EFF6FF', label: 'En cours' },
    SOLDE:      { color: '#6B7280', bg: '#F3F4F6', label: 'Soldé' },
    EN_DEFAUT:  { color: '#EF4444', bg: '#FEF2F2', label: 'En défaut' },
  };

  const tabs = [
    ['', 'Tous'], ['SOUMIS', 'Soumis'], ['APPROUVE', 'Approuvé'],
    ['EN_COURS', 'En cours'], ['SOLDE', 'Soldé'],
    ['EN_DEFAUT', 'En défaut'], ['REJETE', 'Rejeté'],
  ];

  const pct = (c) => {
    if (!c.montant_accorde || c.montant_accorde == 0) return 0;
    return Math.min(100, Math.round((c.montant_rembourse / c.montant_accorde) * 100));
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dossiers de Crédit</h1>
          <p style={styles.subtitle}>{credits.length} dossier{credits.length > 1 ? 's' : ''}</p>
        </div>
        {perms.peutCreerCredit && (
          <button style={styles.btnPrimary} onClick={() => navigate('/credits/nouveau')}>
            + Nouveau dossier
          </button>
        )}
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input style={styles.searchInput}
            placeholder="Rechercher par numéro, nom du membre..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={styles.statusTabs}>
          {tabs.map(([val, label]) => (
            <button key={val} style={{
              ...styles.tab,
              background: statut === val ? '#1A6FD4' : 'transparent',
              color: statut === val ? '#fff' : '#6B7280',
              borderBottom: statut === val ? '2px solid #1A6FD4' : '2px solid transparent',
            }} onClick={() => setStatut(val)}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.empty}><p>Chargement...</p></div>
      ) : credits.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>💳</div>
          <p style={{ color: '#6B7280' }}>Aucun dossier trouvé</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Dossier</th>
                <th style={styles.th}>Membre</th>
                <th style={styles.th}>Accordé</th>
                <th style={styles.th}>Progression</th>
                <th style={styles.th}>Restant</th>
                <th style={styles.th}>Fréquence</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {credits.map((c, i) => {
                const cfg = statutConfig[c.statut] || { color: '#6B7280', bg: '#F3F4F6', label: c.statut };
                const p = pct(c);
                return (
                  <tr key={c.id} style={{ ...styles.tr, background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>{c.numero_dossier}</div>
                      {c.date_deblocage && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{c.date_deblocage}</div>}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1A6FD4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>
                          {c.membre_nom ? c.membre_nom.charAt(0) : '?'}
                        </div>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{c.membre_nom}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>
                        {c.montant_accorde ? `${Number(c.montant_accorde).toLocaleString()} F` : '—'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, minWidth: '120px' }}>
                      {c.montant_accorde ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#4BB543' }}>
                              {c.montant_rembourse ? `${Number(c.montant_rembourse).toLocaleString()} F` : '0 F'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>{p}%</span>
                          </div>
                          <div style={{ height: '5px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${p}%`, height: '100%', background: p === 100 ? '#4BB543' : '#1A6FD4', borderRadius: '3px' }} />
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '600', color: c.montant_restant > 0 ? '#EF4444' : '#4BB543', fontSize: '13px' }}>
                        {c.montant_restant !== undefined ? `${Number(c.montant_restant).toLocaleString()} F` : '—'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{c.frequence_remboursement}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={styles.btnDetail} onClick={() => navigate(`/credits/${c.id}`)}>👁</button>
                        {c.statut === 'BROUILLON' && perms.peutCreerCredit && (
                          <button style={styles.btnSuccess} onClick={() => handleSoumettre(c.id)}>📤</button>
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
  btnPrimary: { padding: '10px 20px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  filterBar: { background: '#fff', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  searchWrapper: { position: 'relative', marginBottom: '12px' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' },
  searchInput: { width: '100%', padding: '10px 14px 10px 36px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  statusTabs: { display: 'flex', gap: '4px', overflowX: 'auto' },
  tab: { padding: '6px 14px', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', transition: 'all 0.2s' },
  empty: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '10px' },
  tableWrapper: { background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F8FAFC' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #F3F4F6', transition: 'background 0.1s' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151', verticalAlign: 'middle' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },
  btnDetail: { padding: '5px 10px', background: '#F3F4F6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  btnSuccess: { padding: '5px 10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
};
