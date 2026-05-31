import { useState, useEffect } from 'react';
import { getCredits, soumettreDossier, rejeterDossier } from '../../api/credits';

export default function Credits() {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState('');
  const [search, setSearch] = useState('');

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statut) params.statut = statut;
      const res = await getCredits(params);
      setCredits(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCredits(); }, [search, statut]);

  const statutColor = {
    BROUILLON: '#6B7280',
    SOUMIS: '#1A6FD4',
    EN_ETUDE: '#F5A623',
    APPROUVE: '#4BB543',
    REJETE: '#EF4444',
    DEBLOQUE: '#4BB543',
    EN_COURS: '#1A6FD4',
    SOLDE: '#6B7280',
    EN_DEFAUT: '#EF4444',
  };

  const handleSoumettre = async (id) => {
    await soumettreDossier(id);
    fetchCredits();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dossiers de Crédit</h1>
        <button style={styles.btnPrimary}>+ Nouveau dossier</button>
      </div>

      <div style={styles.filters}>
        <input
          style={styles.search}
          placeholder="Rechercher par numéro, nom du membre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="SOUMIS">Soumis</option>
          <option value="EN_ETUDE">En étude</option>
          <option value="APPROUVE">Approuvé</option>
          <option value="DEBLOQUE">Débloqué</option>
          <option value="EN_COURS">En cours</option>
          <option value="SOLDE">Soldé</option>
          <option value="EN_DEFAUT">En défaut</option>
          <option value="REJETE">Rejeté</option>
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
                <th style={styles.th}>Membre</th>
                <th style={styles.th}>Montant accordé</th>
                <th style={styles.th}>Montant restant</th>
                <th style={styles.th}>Fréquence</th>
                <th style={styles.th}>Date déblocage</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {credits.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.empty}>
                    Aucun dossier trouvé.
                  </td>
                </tr>
              ) : (
                credits.map((c) => (
                  <tr key={c.id} style={styles.tr}>
                    <td style={styles.td}>{c.numero_dossier}</td>
                    <td style={styles.td}>{c.membre_nom}</td>
                    <td style={styles.td}>
                      {c.montant_accorde
                        ? `${Number(c.montant_accorde).toLocaleString()} FCFA`
                        : '—'}
                    </td>
                    <td style={styles.td}>
                      {c.montant_restant
                        ? `${Number(c.montant_restant).toLocaleString()} FCFA`
                        : '—'}
                    </td>
                    <td style={styles.td}>{c.frequence_remboursement}</td>
                    <td style={styles.td}>{c.date_deblocage || '—'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: (statutColor[c.statut] || '#6B7280') + '20',
                        color: statutColor[c.statut] || '#6B7280',
                      }}>
                        {c.statut}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {c.statut === 'BROUILLON' && (
                        <button
                          style={styles.btnSmallBlue}
                          onClick={() => handleSoumettre(c.id)}
                        >
                          Soumettre
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  btnPrimary: { padding: '10px 20px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  filters: { display: 'flex', gap: '12px', marginBottom: '20px' },
  search: { flex: 1, padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' },
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
  btnSmallBlue: { padding: '4px 12px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
};
