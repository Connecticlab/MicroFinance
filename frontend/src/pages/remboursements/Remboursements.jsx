import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function Remboursements() {
  const [remboursements, setRemboursements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/remboursements/');
        setRemboursements(res.data.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Remboursements</h1>
        <button style={{ padding: '10px 20px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          onClick={() => window.location.href='/remboursements/nouveau'}>
          + Nouveau remboursement
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Numéro</th>
                <th style={styles.th}>Dossier crédit</th>
                <th style={styles.th}>Membre</th>
                <th style={styles.th}>Montant versé</th>
                <th style={styles.th}>Date paiement</th>
                <th style={styles.th}>Mode paiement</th>
              </tr>
            </thead>
            <tbody>
              {remboursements.length === 0 ? (
                <tr>
                  <td colSpan={6} style={styles.empty}>
                    Aucun remboursement enregistré.
                  </td>
                </tr>
              ) : (
                remboursements.map((r) => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{r.numero_remboursement}</td>
                    <td style={styles.td}>{r.dossier_numero}</td>
                    <td style={styles.td}>{r.membre_nom}</td>
                    <td style={styles.td}>
                      {Number(r.montant_verse).toLocaleString()} FCFA
                    </td>
                    <td style={styles.td}>{r.date_paiement}</td>
                    <td style={styles.td}>{r.mode_paiement}</td>
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
  tableWrapper: { background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F3F4F6' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' },
  tr: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#374151' },
  loading: { textAlign: 'center', padding: '40px', color: '#6B7280' },
  empty: { textAlign: 'center', padding: '40px', color: '#9CA3AF' },
};
