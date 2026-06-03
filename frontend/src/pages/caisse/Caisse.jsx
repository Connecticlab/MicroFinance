import { useState, useEffect } from 'react';
import { getEcritures, getSoldeCaisse } from '../../api/dashboard';
import { usePermissions } from '../../store/authStore';
import api from '../../api/axios';

const IconEntree = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IconSortie = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const IconSolde = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconInit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const categorieBadge = (cat) => ({
  ADHESION:      { bg: '#EFF6FF', color: '#2563EB' },
  FRG:           { bg: '#F5F3FF', color: '#7C3AED' },
  DEBLOCAGE:     { bg: '#FFF7ED', color: '#EA580C' },
  REMBOURSEMENT: { bg: '#F0FDF4', color: '#16A34A' },
  PENALITE:      { bg: '#FEF2F2', color: '#DC2626' },
  AUTRE:         { bg: '#F3F4F6', color: '#6B7280' },
})[cat] || { bg: '#F3F4F6', color: '#6B7280' };

export default function Caisse() {
  const [ecritures, setEcritures] = useState([]);
  const [solde, setSolde] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [categorie, setCategorie] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showSoldeForm, setShowSoldeForm] = useState(false);
  const [montantInitial, setMontantInitial] = useState('');
  const [savingSolde, setSavingSolde] = useState(false);
  const perms = usePermissions();

  const handleDefinirSolde = async (e) => {
    e.preventDefault();
    setSavingSolde(true);
    try {
      await api.post('/caisse/definir_solde_initial/', { montant: montantInitial });
      setShowSoldeForm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la mise à jour.');
    } finally {
      setSavingSolde(false);
    }
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (type) params.append('type_ecriture', type);
    if (categorie) params.append('categorie', categorie);
    if (dateDebut) params.append('date_debut', dateDebut);
    if (dateFin) params.append('date_fin', dateFin);
    return params.toString();
  };

  const exporterPDF = async () => {
    const qs = buildQueryString();
    const res = await api.get(`/caisse/export_pdf/?${qs}`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.target = '_blank';
    link.click();
  };

  const exporterExcel = async () => {
    const qs = buildQueryString();
    const res = await api.get(`/caisse/export_excel/?${qs}`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Releve_Caisse.xlsx';
    link.click();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (type) params.type_ecriture = type;
      if (categorie) params.categorie = categorie;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const [e, s] = await Promise.all([getEcritures(params), getSoldeCaisse()]);
      setEcritures(e.data.results);
      setSolde(s.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [type, categorie, dateDebut, dateFin]);

  const totalEntrees = ecritures.filter(e => e.type_ecriture === 'ENTREE').reduce((s, e) => s + Number(e.montant), 0);
  const totalSorties = ecritures.filter(e => e.type_ecriture === 'SORTIE').reduce((s, e) => s + Number(e.montant), 0);
  const soldeFiltree = totalEntrees - totalSorties;
  const nbEntrees = ecritures.filter(e => e.type_ecriture === 'ENTREE').length;
  const nbSorties = ecritures.filter(e => e.type_ecriture === 'SORTIE').length;
  const isFiltred = type || categorie || dateDebut || dateFin;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Caisse — Compte Global</h1>
          <p style={styles.subtitle}>Suivi de toutes les écritures financières</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {perms.estDG && (
            <button style={styles.btnPrimary} onClick={() => setShowSoldeForm(true)}>
              💰 Solde initial
            </button>
          )}
        </div>
      </div>

      {/* Modal solde initial */}
      {showSoldeForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
              Définir le solde initial
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
              Montant disponible en caisse avant toute opération dans le système.
              {solde?.date_solde_initial && ` Dernière mise à jour : ${solde.date_solde_initial}`}
            </p>
            <form onSubmit={handleDefinirSolde}>
              <label style={styles.label}>Montant (FCFA) *</label>
              <input type="number" value={montantInitial}
                onChange={e => setMontantInitial(e.target.value)}
                style={styles.input}
                placeholder={solde?.solde_initial ? String(solde.solde_initial) : "Ex: 500000"}
                required />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" style={styles.btnCancel} onClick={() => setShowSoldeForm(false)}>Annuler</button>
                <button type="submit" style={styles.btnPrimary} disabled={savingSolde}>
                  {savingSolde ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards solde */}
      {solde && (
        <div style={styles.grid4}>
          {[
            { label: 'Total entrées', value: Number(solde.total_entrees).toLocaleString(), color: '#16A34A', bg: '#F0FDF4', icon: <IconEntree /> },
            { label: 'Total sorties', value: Number(solde.total_sorties).toLocaleString(), color: '#EF4444', bg: '#FEF2F2', icon: <IconSortie /> },
            { label: 'Solde actuel', value: Number(solde.solde_actuel).toLocaleString(), color: '#1A6FD4', bg: '#EFF6FF', icon: <IconSolde /> },
            { label: 'Solde initial', value: Number(solde.solde_initial || 0).toLocaleString(), color: '#F59E0B', bg: '#FFFBEB', icon: <IconInit />, sub: solde.date_solde_initial ? `Au ${solde.date_solde_initial}` : null },
          ].map(c => (
            <div key={c.label} style={styles.soldeCard}>
              <div style={{ ...styles.soldeIcon, background: c.bg, color: c.color }}>{c.icon}</div>
              <div style={{ ...styles.soldeValue, color: c.color }}>{c.value} <span style={{ fontSize: '13px', fontWeight: '500' }}>FCFA</span></div>
              <div style={styles.soldeLabel}>{c.label}</div>
              {c.sub && <div style={styles.soldeSub}>{c.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Type</label>
            <select style={styles.select} value={type} onChange={e => setType(e.target.value)}>
              <option value="">Tous</option>
              <option value="ENTREE">Entrées</option>
              <option value="SORTIE">Sorties</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Catégorie</label>
            <select style={styles.select} value={categorie} onChange={e => setCategorie(e.target.value)}>
              <option value="">Toutes</option>
              <option value="ADHESION">Adhésion</option>
              <option value="FRG">FRG</option>
              <option value="DEBLOCAGE">Déblocage</option>
              <option value="REMBOURSEMENT">Remboursement</option>
              <option value="PENALITE">Pénalité</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Date début</label>
            <input type="date" style={styles.select} value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Date fin</label>
            <input type="date" style={styles.select} value={dateFin} onChange={e => setDateFin(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <button style={styles.btnReset}
              onClick={() => { setType(''); setCategorie(''); setDateDebut(''); setDateFin(''); }}>
              ↺ Réinitialiser
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginLeft: 'auto' }}>
            <button style={styles.btnExportPDF} onClick={exporterPDF}>📄 PDF</button>
            <button style={styles.btnExportXLS} onClick={exporterExcel}>📊 Excel</button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div style={styles.empty}>Chargement...</div>
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
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Aucune écriture trouvée.</td></tr>
              ) : ecritures.map((e, i) => {
                const isEntree = e.type_ecriture === 'ENTREE';
                const cat = categorieBadge(e.categorie);
                return (
                  <tr key={e.id} style={{ ...styles.tr, background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>{e.numero_ecriture}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '700',
                        background: isEntree ? '#F0FDF4' : '#FEF2F2',
                        color: isEntree ? '#16A34A' : '#EF4444',
                      }}>
                        {isEntree ? '↑' : '↓'} {isEntree ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', background: cat.bg, color: cat.color }}>
                        {e.categorie}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: isEntree ? '#16A34A' : '#EF4444' }}>
                        {isEntree ? '+' : '-'} {Number(e.montant).toLocaleString()} F
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>
                        {Number(e.solde_apres).toLocaleString()} F
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{e.date_ecriture}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{e.description}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Résumé filtré */}
      {!loading && ecritures.length > 0 && (
        <div style={styles.resumeCard}>
          <div style={styles.resumeHeader}>
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
              Résumé — {ecritures.length} écriture{ecritures.length > 1 ? 's' : ''}
            </span>
            {isFiltred && (
              <span style={{ background: '#1A6FD4', color: '#fff', padding: '2px 10px', borderRadius: '99px', fontSize: '12px' }}>
                Filtré
              </span>
            )}
          </div>
          <div style={styles.resumeGrid}>
            {[
              { label: `Entrées (${nbEntrees})`, value: `+ ${totalEntrees.toLocaleString()} F`, color: '#16A34A' },
              { label: `Sorties (${nbSorties})`, value: `- ${totalSorties.toLocaleString()} F`, color: '#EF4444' },
              { label: 'Solde période', value: `${soldeFiltree.toLocaleString()} F`, color: soldeFiltree >= 0 ? '#1A6FD4' : '#EF4444' },
              { label: 'Solde global actuel', value: `${solde ? Number(solde.solde_actuel).toLocaleString() : '—'} F`, color: '#111827' },
            ].map((r, i) => (
              <div key={r.label} style={{ ...styles.resumeItem, borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={styles.resumeLabel}>{r.label}</div>
                <div style={{ ...styles.resumeValue, color: r.color }}>{r.value}</div>
              </div>
            ))}
          </div>
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
  btnPrimary: { padding: '10px 18px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  btnCancel: { padding: '10px 18px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  btnReset: { padding: '10px 14px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnExportPDF: { padding: '10px 14px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnExportXLS: { padding: '10px 14px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '32px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  soldeCard: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  soldeIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' },
  soldeValue: { fontSize: '22px', fontWeight: '800', lineHeight: 1 },
  soldeLabel: { fontSize: '13px', color: '#6B7280', marginTop: '6px' },
  soldeSub: { fontSize: '11px', color: '#9CA3AF', marginTop: '2px' },
  filterCard: { background: '#fff', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  filterRow: { display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  select: { padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', background: '#fff', color: '#374151' },
  tableWrapper: { background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '16px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F8FAFC' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '13px 16px', fontSize: '14px', color: '#374151', verticalAlign: 'middle' },
  empty: { textAlign: 'center', padding: '40px', color: '#9CA3AF' },
  resumeCard: { background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  resumeHeader: { background: '#111827', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' },
  resumeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' },
  resumeItem: { padding: '16px 20px' },
  resumeLabel: { fontSize: '12px', color: '#6B7280', marginBottom: '4px' },
  resumeValue: { fontSize: '20px', fontWeight: '800' },
};
