import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate } from '../../utils/date';
import { usePermissions } from '../../store/authStore';

export default function Remboursements() {
  const navigate = useNavigate();
  const [remboursements, setRemboursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const perms = usePermissions();

  const fetchRemboursements = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : '';
      const res = await api.get(`/remboursements/${params}`);
      setRemboursements(res.data.results || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRemboursements(); }, [search]);

  const telechargerRecu = async (id, numero) => {
    try {
      const res = await api.get(`/remboursements/${id}/recu_pdf/`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.target = '_blank';
      link.download = `Recu_${numero}.pdf`;
      link.click();
    } catch (err) { alert('Erreur lors de la génération du reçu.'); }
  };

  const modeInfo = (mode) => ({
    ESPECES:      { icon: '💵', label: 'Espèces',      bg: '#F0FDF4', color: '#16A34A' },
    MOBILE_MONEY: { icon: '📱', label: 'Mobile Money', bg: '#EFF6FF', color: '#2563EB' },
    VIREMENT:     { icon: '🏦', label: 'Virement',     bg: '#FFF7ED', color: '#EA580C' },
  })[mode] || { icon: '💰', label: mode, bg: '#F3F4F6', color: '#6B7280' };

  const avatarColor = (nom) => {
    const colors = ['#4BB543','#1A6FD4','#9333EA','#F59E0B','#EF4444','#06B6D4','#EC4899'];
    if (!nom) return colors[0];
    return colors[nom.charCodeAt(0) % colors.length];
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Remboursements</h1>
          <p style={styles.subtitle}>{remboursements.length} remboursement{remboursements.length > 1 ? 's' : ''}</p>
        </div>
        {perms.peutSaisirRemboursement && (
          <button style={styles.btnPrimary} onClick={() => navigate('/remboursements/nouveau')}>
            + Nouveau remboursement
          </button>
        )}
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input style={styles.searchInput}
            placeholder="Rechercher par numéro, membre, dossier crédit..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={styles.empty}><p>Chargement...</p></div>
      ) : remboursements.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>💰</div>
          <p style={{ color: '#6B7280' }}>Aucun remboursement trouvé</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>N° Reçu</th>
                <th style={styles.th}>Membre</th>
                <th style={styles.th}>Dossier crédit</th>
                <th style={styles.th}>Montant versé</th>
                <th style={styles.th}>Principal</th>
                <th style={styles.th}>Pénalité</th>
                <th style={styles.th}>Mode</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {remboursements.map((r, i) => {
                const mode = modeInfo(r.mode_paiement);
                const hasPenalite = Number(r.montant_penalite) > 0;
                const membreNom = r.membre_nom || '—';

                return (
                  <tr key={r.id} style={{ ...styles.tr, background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>
                        {r.numero_remboursement}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: avatarColor(membreNom), color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 'bold', flexShrink: 0
                        }}>
                          {membreNom.charAt(0)}
                        </div>
                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                          {membreNom}
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{ fontSize: '13px', fontWeight: '600', color: '#1A6FD4', cursor: r.dossier_id ? 'pointer' : 'default' }}
                        onClick={() => r.dossier_id && navigate(`/credits/${r.dossier_id}`)}>
                        {r.dossier_numero || '—'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '700', color: '#111827', fontSize: '14px' }}>
                        {Number(r.montant_verse).toLocaleString()} F
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: '600' }}>
                        {Number(r.montant_principal || 0).toLocaleString()} F
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: hasPenalite ? '#EF4444' : '#9CA3AF' }}>
                        {hasPenalite && '⚠ '}{Number(r.montant_penalite || 0).toLocaleString()} F
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '12px',
                        background: mode.bg, color: mode.color,
                        fontSize: '12px', fontWeight: '600'
                      }}>
                        {mode.icon} {mode.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(r.date_paiement)}</span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.btnRecu}
                        onClick={() => telechargerRecu(r.id, r.numero_remboursement)}
                        title="Télécharger le reçu">
                        🧾 Reçu
                      </button>
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
  searchWrapper: { position: 'relative' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' },
  searchInput: { width: '100%', padding: '10px 14px 10px 36px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  empty: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '10px' },
  tableWrapper: { background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F8FAFC' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151', verticalAlign: 'middle' },
  btnRecu: { padding: '5px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#16A34A', fontWeight: '600' },
};
