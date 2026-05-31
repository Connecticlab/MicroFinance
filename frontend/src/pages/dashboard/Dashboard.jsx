import { useEffect, useState } from 'react';
import { getResumeDashboard, getSoldeCaisse } from '../../api/dashboard';

export default function Dashboard() {
  const [resume, setResume] = useState(null);
  const [solde, setSolde] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [r, s] = await Promise.all([
          getResumeDashboard(),
          getSoldeCaisse(),
        ]);
        setResume(r.data);
        setSolde(s.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  const cards = [
    { label: 'Membres actifs', value: resume?.membres?.actifs ?? 0, total: resume?.membres?.total, color: '#1A6FD4', icon: '👥' },
    { label: 'Crédits en cours', value: resume?.credits?.en_cours ?? 0, color: '#4BB543', icon: '💳' },
    { label: 'Crédits en défaut', value: resume?.credits?.en_defaut ?? 0, color: '#EF4444', icon: '⚠️' },
    { label: 'Solde caisse', value: `${Number(solde?.solde_actuel ?? 0).toLocaleString()} FCFA`, color: '#F5A623', icon: '🏦' },
  ];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Tableau de bord</h1>

      {/* Cartes KPI */}
      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} style={{ ...styles.card, borderTop: `4px solid ${card.color}` }}>
            <div style={styles.cardIcon}>{card.icon}</div>
            <div style={styles.cardValue}>{card.value}</div>
            <div style={styles.cardLabel}>{card.label}</div>
            {card.total !== undefined && (
              <div style={styles.cardSub}>Total : {card.total}</div>
            )}
          </div>
        ))}
      </div>

      {/* Indicateurs PAR */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Indicateurs de risque</h2>
        <div style={styles.parGrid}>
          <div style={styles.parCard}>
            <div style={styles.parLabel}>PAR 30</div>
            <div style={{
              ...styles.parValue,
              color: (resume?.indicateurs?.par30 ?? 0) > 5 ? '#EF4444' : '#4BB543'
            }}>
              {resume?.indicateurs?.par30 ?? 0} %
            </div>
            <div style={styles.parSeuil}>Seuil acceptable : 5%</div>
          </div>
          <div style={styles.parCard}>
            <div style={styles.parLabel}>PAR 90</div>
            <div style={{
              ...styles.parValue,
              color: (resume?.indicateurs?.par90 ?? 0) > 3 ? '#EF4444' : '#4BB543'
            }}>
              {resume?.indicateurs?.par90 ?? 0} %
            </div>
            <div style={styles.parSeuil}>Seuil acceptable : 3%</div>
          </div>
          <div style={styles.parCard}>
            <div style={styles.parLabel}>Taux de remboursement</div>
            <div style={{
              ...styles.parValue,
              color: (resume?.indicateurs?.taux_remboursement ?? 0) >= 95 ? '#4BB543' : '#F5A623'
            }}>
              {resume?.indicateurs?.taux_remboursement ?? 0} %
            </div>
            <div style={styles.parSeuil}>Objectif : ≥ 95%</div>
          </div>
          <div style={styles.parCard}>
            <div style={styles.parLabel}>Encours total</div>
            <div style={{ ...styles.parValue, color: '#1A6FD4' }}>
              {Number(resume?.credits?.total_encours ?? 0).toLocaleString()}
            </div>
            <div style={styles.parSeuil}>FCFA</div>
          </div>
        </div>
      </div>

      {/* Résumé caisse */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Résumé de la caisse</h2>
        <div style={styles.caisseGrid}>
          <div style={{ ...styles.caisseCard, background: '#F0FDF4' }}>
            <div style={styles.caisseLabel}>Total entrées</div>
            <div style={{ ...styles.caisseValue, color: '#4BB543' }}>
              + {Number(solde?.total_entrees ?? 0).toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ ...styles.caisseCard, background: '#FEF2F2' }}>
            <div style={styles.caisseLabel}>Total sorties</div>
            <div style={{ ...styles.caisseValue, color: '#EF4444' }}>
              - {Number(solde?.total_sorties ?? 0).toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ ...styles.caisseCard, background: '#EFF6FF' }}>
            <div style={styles.caisseLabel}>Solde actuel</div>
            <div style={{ ...styles.caisseValue, color: '#1A6FD4' }}>
              {Number(solde?.solde_actuel ?? 0).toLocaleString()} FCFA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  loading: { padding: '40px', textAlign: 'center', color: '#6B7280' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px', width: '100%' },
  card: { background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardIcon: { fontSize: '24px', marginBottom: '8px' },
  cardValue: { fontSize: '28px', fontWeight: 'bold', color: '#111827' },
  cardLabel: { fontSize: '13px', color: '#6B7280', marginTop: '4px' },
  cardSub: { fontSize: '12px', color: '#9CA3AF', marginTop: '2px' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' },
  parGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '100%' },
  parCard: { background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' },
  parLabel: { fontSize: '13px', color: '#6B7280', marginBottom: '8px' },
  parValue: { fontSize: '32px', fontWeight: 'bold' },
  parSeuil: { fontSize: '11px', color: '#9CA3AF', marginTop: '4px' },
  caisseGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '100%' },
  caisseCard: { borderRadius: '8px', padding: '20px' },
  caisseLabel: { fontSize: '13px', color: '#6B7280', marginBottom: '8px' },
  caisseValue: { fontSize: '22px', fontWeight: 'bold' },
};
