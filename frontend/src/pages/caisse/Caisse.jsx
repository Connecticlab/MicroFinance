import { useState, useEffect } from 'react';
import { getEcritures, getSoldeCaisse } from '../../api/dashboard';
import { usePermissions } from '../../store/authStore';
import api from '../../api/axios';

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

  const buildFetchParams = () => {
    const params = {};
    if (type) params.type_ecriture = type;
    if (categorie) params.categorie = categorie;
    if (dateDebut) params['date_ecriture__gte'] = dateDebut;
    if (dateFin) params['date_ecriture__lte'] = dateFin;
    return params;
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
      if (dateDebut) params.date_ecriture__gte = dateDebut;
      if (dateFin) params.date_ecriture__lte = dateFin;
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

  useEffect(() => { fetchData(); }, [type, categorie, dateDebut, dateFin]);

  // Calcul du résumé en fonction des écritures affichées
  const totalEntreesFiltrees = ecritures
    .filter(e => e.type_ecriture === 'ENTREE')
    .reduce((sum, e) => sum + Number(e.montant), 0);
  const totalSortiesFiltrees = ecritures
    .filter(e => e.type_ecriture === 'SORTIE')
    .reduce((sum, e) => sum + Number(e.montant), 0);
  const soldeFiltree = totalEntreesFiltrees - totalSortiesFiltrees;
  const nbEntrees = ecritures.filter(e => e.type_ecriture === 'ENTREE').length;
  const nbSorties = ecritures.filter(e => e.type_ecriture === 'SORTIE').length;

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Caisse — Compte Global</h1>
        {perms.estDG && (
          <button style={{ padding: '10px 20px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => setShowSoldeForm(true)}>
            💰 Définir solde initial
          </button>
        )}
      </div>

      {/* Solde */}
      {/* Modal solde initial */}
      {showSoldeForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '400px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
              💰 Définir le solde initial de la caisse
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
              Ce montant représente l'argent disponible en caisse avant toute opération dans le système.
              {solde?.date_solde_initial && ` Dernière mise à jour : ${solde.date_solde_initial}`}
            </p>
            <form onSubmit={handleDefinirSolde}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Montant (FCFA) *</label>
                <input type="number" value={montantInitial}
                  onChange={e => setMontantInitial(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                  placeholder={solde?.solde_initial ? String(solde.solde_initial) : "Ex: 500000"}
                  required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" style={{ padding: '10px 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => setShowSoldeForm(false)}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '10px 20px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  disabled={savingSolde}>
                  {savingSolde ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {solde && (
        <div style={styles.soldeGrid}>
          <div style={{ ...styles.soldeCard, borderTop: '4px solid #4BB543' }}>
            <div style={styles.soldeLabel}>Total entrées</div>
            <div style={{ ...styles.soldeValue, color: '#4BB543' }}>
              {Number(solde.total_entrees).toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ ...styles.soldeCard, borderTop: '4px solid #EF4444' }}>
            <div style={styles.soldeLabel}>Total sorties</div>
            <div style={{ ...styles.soldeValue, color: '#EF4444' }}>
              {Number(solde.total_sorties).toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ ...styles.soldeCard, borderTop: '4px solid #1A6FD4' }}>
            <div style={styles.soldeLabel}>Solde actuel</div>
            <div style={{ ...styles.soldeValue, color: '#1A6FD4' }}>
              {Number(solde.solde_actuel).toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ ...styles.soldeCard, borderTop: '4px solid #F5A623' }}>
            <div style={styles.soldeLabel}>Solde initial</div>
            <div style={{ ...styles.soldeValue, color: '#F5A623' }}>
              {Number(solde.solde_initial || 0).toLocaleString()} FCFA
            </div>
            {solde.date_solde_initial && (
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                Au {solde.date_solde_initial}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={styles.select} value={type} onChange={e => setType(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="ENTREE">Entrées</option>
          <option value="SORTIE">Sorties</option>
        </select>
        <select style={styles.select} value={categorie} onChange={e => setCategorie(e.target.value)}>
          <option value="">Toutes catégories</option>
          <option value="ADHESION">Adhésion</option>
          <option value="FRG">FRG</option>
          <option value="DEBLOCAGE">Déblocage</option>
          <option value="REMBOURSEMENT">Remboursement</option>
          <option value="PENALITE">Pénalité</option>
          <option value="AUTRE">Autre</option>
        </select>
        <input type="date" style={styles.select} value={dateDebut}
          onChange={e => setDateDebut(e.target.value)} placeholder="Date début" />
        <input type="date" style={styles.select} value={dateFin}
          onChange={e => setDateFin(e.target.value)} placeholder="Date fin" />
        <button style={{ padding: '10px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          onClick={() => { setType(''); setCategorie(''); setDateDebut(''); setDateFin(''); }}>
          🔄 Réinitialiser
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ padding: '10px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            onClick={exporterPDF}>
            📄 Export PDF
          </button>
          <button style={{ padding: '10px 16px', background: '#4BB543', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            onClick={exporterExcel}>
            📊 Export Excel
          </button>
        </div>
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

      {/* Résumé filtré */}
      {!loading && ecritures.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: '8px', marginTop: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden'
        }}>
          <div style={{
            background: '#111827', padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
              📊 Résumé — {ecritures.length} écriture{ecritures.length > 1 ? 's' : ''}
            </span>
            {(type || categorie || dateDebut || dateFin) && (
              <span style={{ background: '#1A6FD4', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
                Filtré
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div style={{ padding: '16px 20px', borderRight: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                Entrées ({nbEntrees})
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4BB543' }}>
                {totalEntreesFiltrees.toLocaleString()} FCFA
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderRight: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                Sorties ({nbSorties})
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#EF4444' }}>
                {totalSortiesFiltrees.toLocaleString()} FCFA
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderRight: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                Solde période
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: soldeFiltree >= 0 ? '#1A6FD4' : '#EF4444' }}>
                {soldeFiltree.toLocaleString()} FCFA
              </div>
            </div>
            <div style={{ padding: '16px 20px', background: '#F9FAFB' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                Solde global actuel
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                {solde ? Number(solde.solde_actuel).toLocaleString() : '—'} FCFA
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' },
  soldeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
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
