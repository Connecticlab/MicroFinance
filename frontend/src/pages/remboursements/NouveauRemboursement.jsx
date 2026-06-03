import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/date';
import api from '../../api/axios';
import { getCredits } from '../../api/credits';

const IconCredit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconMoney = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const modeIcon = { ESPECES: '💵', MOBILE_MONEY: '📱', VIREMENT: '🏦' };

function Section({ icon, title, color, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div style={{ ...styles.sectionIcon, background: color + '15', color }}>{icon}</div>
        <h2 style={styles.sectionTitle}>{title}</h2>
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

export default function NouveauRemboursement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState([]);
  const [creditSelectionne, setCreditSelectionne] = useState(null);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [form, setForm] = useState({
    dossier: '',
    montant_verse: '',
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'ESPECES',
    reference_paiement: '',
    notes: '',
  });

  useEffect(() => {
    getCredits({ statut: 'EN_COURS' }).then(res => setCredits(res.data.results));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErreurs({ ...erreurs, [e.target.name]: '' });
    if (e.target.name === 'dossier' && e.target.value) {
      setLoadingCredit(true);
      api.get(`/credits/${e.target.value}/`).then(res => {
        setCreditSelectionne(res.data);
      }).finally(() => setLoadingCredit(false));
    } else if (e.target.name === 'dossier') {
      setCreditSelectionne(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/remboursements/', form);
      navigate('/remboursements');
    } catch (err) {
      if (err.response?.data) setErreurs(err.response.data);
    } finally {
      setLoading(false);
    }
  };

  const prochaineEcheance = creditSelectionne?.echeancier?.find(
    e => e.statut === 'EN_ATTENTE' || e.statut === 'EN_RETARD' || e.statut === 'PARTIELLEMENT_PAYE'
  );

  const montantRestant = creditSelectionne ? Number(creditSelectionne.montant_restant) : 0;
  const montantRembourse = creditSelectionne ? Number(creditSelectionne.montant_rembourse) : 0;
  const montantAccorde = creditSelectionne ? Number(creditSelectionne.montant_accorde) : 0;
  const progression = montantAccorde > 0 ? Math.round((montantRembourse / montantAccorde) * 100) : 0;
  const nbErreurs = Object.keys(erreurs).filter(k => erreurs[k]).length;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={styles.btnBack} onClick={() => navigate('/remboursements')}>← Retour</button>
          <div>
            <h1 style={styles.title}>Nouveau Remboursement</h1>
            <p style={styles.subtitle}>Saisie d'un versement sur crédit en cours</p>
          </div>
        </div>
        {nbErreurs > 0 && (
          <div style={styles.errorBanner}>
            ⚠ {nbErreurs} champ{nbErreurs > 1 ? 's' : ''} invalide{nbErreurs > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Sélection crédit */}
        <Section icon={<IconCredit />} title="Dossier de crédit" color="#1A6FD4">
          <div style={styles.field}>
            <label style={styles.label}>Crédit en cours <span style={{ color: '#EF4444' }}>*</span></label>
            <select name="dossier" value={form.dossier} onChange={handleChange}
              style={{ ...styles.input, borderColor: erreurs.dossier ? '#EF4444' : '#E5E7EB' }}
              required>
              <option value="">— Choisir un dossier —</option>
              {credits.map(c => (
                <option key={c.id} value={c.id}>
                  {c.numero_dossier} — {c.membre_nom}
                </option>
              ))}
            </select>
            {erreurs.dossier && <span style={styles.erreur}>⚠ {erreurs.dossier}</span>}
          </div>

          {/* Carte crédit sélectionné */}
          {loadingCredit && <div style={{ padding: '12px', color: '#6B7280', fontSize: '13px' }}>Chargement...</div>}
          {creditSelectionne && !loadingCredit && (
            <div style={styles.creditCard}>
              {/* Infos membre */}
              <div style={styles.creditCardHeader}>
                <div style={styles.creditAvatar}>
                  {creditSelectionne.membre_detail?.nom_complet?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>
                    {creditSelectionne.membre_detail?.nom_complet}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {creditSelectionne.numero_dossier} · {creditSelectionne.frequence_remboursement}
                  </div>
                </div>
                <span style={styles.statutBadge}>EN COURS</span>
              </div>

              {/* KPIs crédit */}
              <div style={styles.creditKpis}>
                <div style={styles.kpiItem}>
                  <div style={styles.kpiLabel}>Montant accordé</div>
                  <div style={styles.kpiValue}>{montantAccorde.toLocaleString()} F</div>
                </div>
                <div style={styles.kpiItem}>
                  <div style={styles.kpiLabel}>Remboursé</div>
                  <div style={{ ...styles.kpiValue, color: '#16A34A' }}>{montantRembourse.toLocaleString()} F</div>
                </div>
                <div style={styles.kpiItem}>
                  <div style={styles.kpiLabel}>Restant</div>
                  <div style={{ ...styles.kpiValue, color: '#EF4444' }}>{montantRestant.toLocaleString()} F</div>
                </div>
                <div style={styles.kpiItem}>
                  <div style={styles.kpiLabel}>Progression</div>
                  <div style={{ ...styles.kpiValue, color: '#1A6FD4' }}>{progression}%</div>
                </div>
              </div>

              {/* Barre de progression */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ background: '#F3F4F6', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${progression}%`, height: '100%', background: '#16A34A', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Prochaine échéance */}
        {prochaineEcheance && (
          <Section icon={<IconChart />} title="Prochaine échéance" color={prochaineEcheance.statut === 'EN_RETARD' ? '#EF4444' : '#F59E0B'}>
            <div style={{
              ...styles.echeanceBox,
              borderColor: prochaineEcheance.statut === 'EN_RETARD' ? '#FECACA' : '#FDE68A',
              background: prochaineEcheance.statut === 'EN_RETARD' ? '#FEF2F2' : '#FFFBEB',
            }}>
              <div style={styles.echeanceGrid}>
                <div>
                  <div style={styles.kpiLabel}>Échéance N°</div>
                  <div style={styles.kpiValue}>#{prochaineEcheance.numero_echeance}</div>
                </div>
                <div>
                  <div style={styles.kpiLabel}>Date</div>
                  <div style={styles.kpiValue}>{formatDate(prochaineEcheance.date_echeance)}</div>
                </div>
                <div>
                  <div style={styles.kpiLabel}>Montant</div>
                  <div style={{ ...styles.kpiValue, color: '#1A6FD4' }}>
                    {Number(prochaineEcheance.montant_echeance).toLocaleString()} F
                  </div>
                </div>
                {prochaineEcheance.penalite > 0 && (
                  <div>
                    <div style={styles.kpiLabel}>Pénalité</div>
                    <div style={{ ...styles.kpiValue, color: '#EF4444' }}>
                      + {Number(prochaineEcheance.penalite).toLocaleString()} F
                    </div>
                  </div>
                )}
                <div>
                  <div style={styles.kpiLabel}>Total à payer</div>
                  <div style={{ ...styles.kpiValue, color: '#111827', fontSize: '18px' }}>
                    {(Number(prochaineEcheance.montant_echeance) + Number(prochaineEcheance.penalite || 0)).toLocaleString()} F
                  </div>
                </div>
              </div>
              <button type="button" style={styles.btnSuggerer}
                onClick={() => setForm({
                  ...form,
                  montant_verse: String(Number(prochaineEcheance.montant_echeance) + Number(prochaineEcheance.penalite || 0))
                })}>
                ↗ Utiliser ce montant
              </button>
            </div>
          </Section>
        )}

        {/* Détails paiement */}
        <Section icon={<IconMoney />} title="Détails du paiement" color="#16A34A">
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Montant versé (FCFA) <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="number" name="montant_verse" value={form.montant_verse}
                onChange={handleChange}
                style={{ ...styles.input, borderColor: erreurs.montant_verse ? '#EF4444' : '#E5E7EB', fontSize: '16px', fontWeight: '600' }}
                min="1" placeholder="Ex: 12500" required />
              {erreurs.montant_verse && <span style={styles.erreur}>⚠ {erreurs.montant_verse}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Date de paiement <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="date" name="date_paiement" value={form.date_paiement}
                onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Mode de paiement <span style={{ color: '#EF4444' }}>*</span></label>
              <select name="mode_paiement" value={form.mode_paiement}
                onChange={handleChange} style={styles.input}>
                <option value="ESPECES">{modeIcon.ESPECES} Espèces</option>
                <option value="MOBILE_MONEY">{modeIcon.MOBILE_MONEY} Mobile Money</option>
                <option value="VIREMENT">{modeIcon.VIREMENT} Virement bancaire</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Référence / N° transaction</label>
              <input type="text" name="reference_paiement" value={form.reference_paiement}
                onChange={handleChange} style={styles.input}
                placeholder="Ex: Wave-XXXXXXXX" />
              <span style={styles.hint}>Obligatoire pour Mobile Money et Virement</span>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              style={{ ...styles.input, minHeight: '70px', resize: 'vertical' }}
              placeholder="Observations éventuelles..." />
          </div>
        </Section>

        {/* Actions */}
        <div style={styles.actions}>
          <button type="button" style={styles.btnCancel} onClick={() => navigate('/remboursements')}>
            Annuler
          </button>
          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? 'Enregistrement...' : '✓ Enregistrer le remboursement'}
          </button>
        </div>

      </form>
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  btnBack: { padding: '8px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151', fontWeight: '500' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  subtitle: { fontSize: '13px', color: '#6B7280', marginTop: '4px' },
  errorBanner: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  section: { background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderBottom: '1px solid #F3F4F6' },
  sectionIcon: { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 },
  sectionBody: { padding: '20px 24px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  erreur: { fontSize: '12px', color: '#EF4444', fontWeight: '500' },
  hint: { fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' },
  creditCard: { background: '#F8FAFF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '16px', marginTop: '12px' },
  creditCardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  creditAvatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#1A6FD4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', flexShrink: 0 },
  statutBadge: { marginLeft: 'auto', padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
  creditKpis: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' },
  kpiItem: { textAlign: 'center' },
  kpiLabel: { fontSize: '11px', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' },
  kpiValue: { fontSize: '15px', fontWeight: '700', color: '#111827' },
  echeanceBox: { border: '1px solid', borderRadius: '10px', padding: '16px' },
  echeanceGrid: { display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' },
  btnSuggerer: { padding: '7px 16px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' },
  btnCancel: { padding: '11px 28px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151' },
  btnSubmit: { padding: '11px 28px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};
