import { useState, useEffect } from 'react';
import { getMembres, validerAdhesion, suspendreMembre, reactiversMembre, exclureMembre } from '../../api/membres';
import { usePermissions } from '../../store/authStore';

export default function Membres() {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const perms = usePermissions();
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');

  const fetchMembres = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statut) params.statut = statut;
      const res = await getMembres(params);
      setMembres(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembres(); }, [search, statut]);

  const handleValider = async (id) => {
    await validerAdhesion(id);
    fetchMembres();
  };

  const handleSuspendre = async (id) => {
    await suspendreMembre(id);
    fetchMembres();
  };

  const handleReactiver = async (id) => {
    await reactiversMembre(id);
    fetchMembres();
  };

  const handleExclure = async (id) => {
    if (window.confirm('Confirmer l\'exclusion de ce membre ?')) {
      await exclureMembre(id);
      fetchMembres();
    }
  };

  const statutColor = {
    ACTIF: '#4BB543',
    EN_ATTENTE: '#F5A623',
    SUSPENDU: '#EF4444',
    EXCLU: '#6B7280',
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Membres</h1>
        {perms.peutCreerMembre && <button style={styles.btnPrimary}
          onClick={() => window.location.href = '/membres/nouveau'}>
          + Nouveau membre
        </button>}
      </div>

      {/* Filtres */}
      <div style={styles.filters}>
        <input
          style={styles.search}
          placeholder="Rechercher par nom, numéro, téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="ACTIF">Actif</option>
          <option value="SUSPENDU">Suspendu</option>
          <option value="EXCLU">Exclu</option>
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
                <th style={styles.th}>Nom complet</th>
                <th style={styles.th}>Téléphone</th>
                <th style={styles.th}>Date adhésion</th>
                <th style={styles.th}>Frais payés</th>
                <th style={styles.th}>Crédit actif</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {membres.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.empty}>
                    Aucun membre trouvé.
                  </td>
                </tr>
              ) : (
                membres.map((m) => (
                  <tr key={m.id} style={styles.tr}>
                    <td style={styles.td}>
                      <button style={styles.btnSmallBlue} onClick={() => window.location.href=`/membres/${m.id}`}>
                        👁 Détail
                      </button>{' '}{m.numero_membre}</td>
                    <td style={styles.td}>{m.nom_complet}</td>
                    <td style={styles.td}>{m.telephone}</td>
                    <td style={styles.td}>{m.date_adhesion}</td>
                    <td style={styles.td}>
                      {m.frais_adhesion_paye ? '✅' : '❌'}
                    </td>
                    <td style={styles.td}>
                      {m.a_credit_actif ? '💳 Oui' : '—'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: statutColor[m.statut] + '20',
                        color: statutColor[m.statut],
                      }}>
                        {m.statut}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {m.statut === 'EN_ATTENTE' && (
                        <button style={styles.btnSmallGreen} onClick={() => handleValider(m.id)}>
                          ✅ Valider
                        </button>
                      )}
                      {m.statut === 'ACTIF' && (
                        <button style={styles.btnSmallRed} onClick={() => handleSuspendre(m.id)}>
                          ⏸ Suspendre
                        </button>
                      )}
                      {m.statut === 'SUSPENDU' && (
                        <>
                          <button style={styles.btnSmallGreen} onClick={() => handleReactiver(m.id)}>
                            ▶ Réactiver
                          </button>
                          <button style={{...styles.btnSmallRed, marginLeft: '4px'}} onClick={() => handleExclure(m.id)}>
                            🚫 Exclure
                          </button>
                        </>
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
  btnSmallGreen: { padding: '4px 12px', background: '#4BB543', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' },
  btnSmallRed: { padding: '4px 12px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
};
