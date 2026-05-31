import { useState, useEffect } from 'react';
import { getEcritures, getSoldeCaisse } from '../../api/dashboard';

export default function Caisse() {
  const [ecritures, setEcritures] = useState([]);
  const [solde, setSolde] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (type) params.type_ecriture = type;
      const [e, s] = await Promise.all([
        getEcritures(params),
        getSoldeCaisse(),
      ]);
      setEcritures(e.data.results);
      setSolde(s.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [type]);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Caisse — Compte Global</h1>

      {/* Solde */}
      {solde && (
        <div style={styles.soldeGrid}>
          <div style={{ ...styles.soldeCard, borderTop: '4px solid #4BB543' }}>
            <div style={styles.soldeLabel}>Total entrées</div>
            <div style={{ ...styles.soldeValue, color: '#4BB543' }}>
              + {Number(solde.total_entrees).toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ ...styles.soldeCard, borderTop: '4px solid #EF4444' }}>
            <div style={styles.soldeLabel}>Total sorties</div>
            <div style={{ ...styles.soldeValue, color: '#EF4444' }}>
              - {Number(solde.total_sorties).toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ ...styles.soldeCard, borderTop: '4px solid #1A6FD4' }}>
            <div style={styles.soldeLabel}>Solde actuel</div>
            <div style={{ ...styles.soldeValue, color: '#1A6FD4' }}>
              {Number(solde.solde_actuel).toLocaleString()} FCFA
            </div>
          </div>
        </div>
      )}

      {/* Filtre */}
      <div style={styles.filters}>
        <select
          style={styles.select}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Toutes les écritures</option>
          <option value="ENTREE">Entrées</option>
          <option value="SORTIE">Sorties</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Numéro</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Catégorie</th>
                <th style={styles.th}>Montant</th>
                <th style={styles.th}>Solde après</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {ecritures.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>
                    Aucune écriture trouvée.
                  </td>
                </tr>
              ) : (
                ecritures.map((e) => (
                  <tr key={e.id} style={styles.tr}>
                    <td style={styles.td}>{e.numero_ecriture}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: e.type_ecriture === 'ENTREE' ? '#F0FDF4' : '#FEF2F2',
                        color: e.type_ecriture === 'ENTREE' ? '#4BB543' : '#EF4444',
                      }}>
                        {e.type_ecriture}
                      </span>
                    </td>
                    <td style={styles.td}>{e.categorie}</td>
                    <td style={styles.td}>
                      {Number(e.montant).toLocaleString()} FCFA
                    </td>
                    <td style={styles.td}>
                      {Number(e.solde_apres).toLocaleString()} FCFA
                    </td>
                    <td style={styles.td}>{e.date_ecriture}</td>
                    <td style={styles.td}>{e.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' },
  soldeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  soldeCard: { background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  soldeLabel: { fontSize: '13px', color: '#6B7280', marginBottom: '8px' },
  soldeValue: { fontSize: '24px', fontWeight: 'bold' },
  filters: { marginBottom: '20px' },
  select: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', background: '#fff' },
  tableWrapper: { background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F3F4F6' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' },
  tr: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#374151' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  loading: { textAlign: 'center', padding: '40px', color: '#6B7280' },
  empty: { textAlign: 'center', padding: '40px', color: '#9CA3AF' },
};
