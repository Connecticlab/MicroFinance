import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function Recouvrement() {
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDossiers(); }, [statut]);

  const handleEscalader = async (id) => {
    await api.post(`/recouvrement/dossiers/${id}/escalader/`);
    fetchDossiers();
  };

  const statutColor = {
    OUVERT: '#F5A623',
    EN_COURS: '#1A6FD4',
    RESOLU: '#4BB543',
    PERTE: '#EF4444',
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Recouvrement</h1>

      <div style={styles.filters}>
        <select
          style={styles.select}
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="OUVERT">Ouvert</option>
          <option value="EN_COURS">En cours</option>
          <option value="RESOLU">Résolu</option>
          <option value="PERTE">Passé en perte</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Chargement...</div>
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
              {dossiers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.empty}>
                    Aucun dossier de recouvrement.
                  </td>
                </tr>
              ) : (
                dossiers.map((d) => (
                  <tr key={d.id} style={styles.tr}>
                    <td style={styles.td}>{d.numero_dossier}</td>
                    <td style={styles.td}>{d.credit_numero}</td>
                    <td style={styles.td}>{d.membre_nom}</td>
                    <td style={styles.td}>{d.etape_actuelle}</td>
                    <td style={styles.td}>
                      {Number(d.montant_en_defaut).toLocaleString()} FCFA
                    </td>
                    <td style={styles.td}>
                      {Number(d.montant_recouvre).toLocaleString()} FCFA
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: (statutColor[d.statut] || '#6B7280') + '20',
                        color: statutColor[d.statut] || '#6B7280',
                      }}>
                        {d.statut}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {d.statut !== 'RESOLU' && d.statut !== 'PERTE' && (
                        <button
                          style={styles.btnSmall}
                          onClick={() => handleEscalader(d.id)}
                        >
                          Escalader
                        </button>
                      )}
                    </td>
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
  btnSmall: { padding: '4px 12px', background: '#F5A623', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
};
