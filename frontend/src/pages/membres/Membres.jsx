import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMembres, approuverMembre, rejeterMembre, payerFraisMembre, suspendreMembre, reactiversMembre, exclureMembre } from '../../api/membres';
import { usePermissions } from '../../store/authStore';

export default function Membres() {
  const navigate = useNavigate();
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const perms = usePermissions();

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

  const handleApprouver = async (id) => { await approuverMembre(id); fetchMembres(); };
  const handleRejeter = async (id) => {
    const motif = prompt('Motif du rejet :');
    if (motif !== null) { await rejeterMembre(id, { motif }); fetchMembres(); }
  };
  const handlePayerFrais = async (id) => { await payerFraisMembre(id, { mode_paiement: 'ESPECES' }); fetchMembres(); };
  const handleSuspendre = async (id) => { await suspendreMembre(id); fetchMembres(); };
  const handleReactiver = async (id) => { await reactiversMembre(id); fetchMembres(); };
  const handleExclure = async (id) => {
    if (window.confirm('Confirmer l\'exclusion ?')) { await exclureMembre(id); fetchMembres(); }
  };

  const statutConfig = {
    EN_ATTENTE: { color: '#D97706', bg: '#FFF3CD', label: 'En attente' },
    APPROUVE:   { color: '#1A6FD4', bg: '#EFF6FF', label: 'Approuvé' },
    ACTIF:      { color: '#4BB543', bg: '#F0FDF4', label: 'Actif' },
    REJETE:     { color: '#EF4444', bg: '#FEF2F2', label: 'Rejeté' },
    SUSPENDU:   { color: '#EF4444', bg: '#FEF2F2', label: 'Suspendu' },
    EXCLU:      { color: '#6B7280', bg: '#F3F4F6', label: 'Exclu' },
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Membres</h1>
          <p style={styles.subtitle}>{membres.length} membre{membres.length > 1 ? 's' : ''} trouvé{membres.length > 1 ? 's' : ''}</p>
        </div>
        {perms.peutCreerMembre && (
          <button style={styles.btnPrimary} onClick={() => navigate('/membres/nouveau')}>
            + Nouveau membre
          </button>
        )}
      </div>

      {/* Filtres */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input style={styles.searchInput}
            placeholder="Rechercher par nom, numéro, téléphone..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={styles.statusTabs}>
          {[['', 'Tous'], ['EN_ATTENTE', 'En attente'], ['APPROUVE', 'Approuvé'],
            ['ACTIF', 'Actif'], ['REJETE', 'Rejeté'], ['SUSPENDU', 'Suspendu'], ['EXCLU', 'Exclu']
          ].map(([val, label]) => (
            <button key={val} style={{
              ...styles.tab,
              background: statut === val ? '#1A6FD4' : 'transparent',
              color: statut === val ? '#fff' : '#6B7280',
              borderBottom: statut === val ? '2px solid #1A6FD4' : '2px solid transparent',
            }} onClick={() => setStatut(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Chargement...</p>
        </div>
      ) : membres.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>Aucun membre trouvé</p>
        </div>
      ) : (
        <div style={styles.cards}>
          {membres.map(m => {
            const cfg = statutConfig[m.statut] || { color: '#6B7280', bg: '#F3F4F6', label: m.statut };
            return (
              <div key={m.id} style={styles.card}>
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.avatar}>
                    {m.nom_complet.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardName}>{m.nom_complet}</div>
                    <div style={styles.cardNum}>{m.numero_membre}</div>
                  </div>
                  <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Card Body */}
                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>📞</span>
                    <span style={styles.infoValue}>{m.telephone}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>📅</span>
                    <span style={styles.infoValue}>{m.date_adhesion}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>💳</span>
                    <span style={styles.infoValue}>
                      {m.a_credit_actif ? 'Crédit actif' : 'Aucun crédit'}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>💰</span>
                    <span style={{ ...styles.infoValue, color: m.frais_adhesion_paye ? '#4BB543' : '#D97706' }}>
                      {m.frais_adhesion_paye ? 'Frais payés' : 'Frais non payés'}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={styles.cardFooter}>
                  <button style={styles.btnDetail} onClick={() => navigate(`/membres/${m.id}`)}>
                    👁 Détail
                  </button>
                  {m.statut === 'EN_ATTENTE' && perms.peutValiderMembre && (
                    <>
                      <button style={styles.btnSuccess} onClick={() => handleApprouver(m.id)}>✅ Approuver</button>
                      <button style={styles.btnDanger} onClick={() => handleRejeter(m.id)}>❌ Rejeter</button>
                    </>
                  )}
                  {m.statut === 'APPROUVE' && perms.peutCreerMembre && (
                    <button style={styles.btnWarning} onClick={() => handlePayerFrais(m.id)}>
                      💰 Payer frais
                    </button>
                  )}
                  {m.statut === 'ACTIF' && perms.peutSuspendreExclure && (
                    <button style={styles.btnDanger} onClick={() => handleSuspendre(m.id)}>⏸ Suspendre</button>
                  )}
                  {m.statut === 'SUSPENDU' && perms.peutSuspendreExclure && (
                    <>
                      <button style={styles.btnSuccess} onClick={() => handleReactiver(m.id)}>▶ Réactiver</button>
                      <button style={styles.btnDanger} onClick={() => handleExclure(m.id)}>🚫 Exclure</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
  loading: { textAlign: 'center', padding: '60px', color: '#6B7280' },
  spinner: { width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTop: '3px solid #1A6FD4', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' },
  empty: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '10px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card: { background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', transition: 'box-shadow 0.2s' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 16px 12px' },
  avatar: { width: '42px', height: '42px', borderRadius: '50%', background: '#1A6FD4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', flexShrink: 0 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: '15px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardNum: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 },
  cardBody: { padding: '0 16px 12px', borderBottom: '1px solid #F3F4F6' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' },
  infoLabel: { fontSize: '13px', width: '20px' },
  infoValue: { fontSize: '13px', color: '#374151' },
  cardFooter: { padding: '12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap', background: '#FAFAFA' },
  btnDetail: { padding: '6px 12px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#374151' },
  btnSuccess: { padding: '6px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#4BB543', fontWeight: '600' },
  btnDanger: { padding: '6px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#EF4444', fontWeight: '600' },
  btnWarning: { padding: '6px 12px', background: '#FFF3CD', border: '1px solid #FDE68A', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#D97706', fontWeight: '600' },
};
