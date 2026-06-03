import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCredit } from '../../api/credits';
import { getMembres } from '../../api/membres';

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
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
const IconNote = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
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

export default function NouveauCredit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [membres, setMembres] = useState([]);
  const [erreurs, setErreurs] = useState({});
  const [membreSelectionne, setMembreSelectionne] = useState(null);
  const [form, setForm] = useState({
    membre: '',
    montant_demande: '',
    frequence_remboursement: 'MENSUEL',
    nombre_echeances: '',
    mode_deblocage: 'ESPECES',
    notes: '',
  });

  useEffect(() => {
    getMembres({ statut: 'ACTIF' }).then(res => setMembres(res.data.results));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErreurs({ ...erreurs, [e.target.name]: '' });
    if (e.target.name === 'membre') {
      const m = membres.find(x => String(x.id) === e.target.value);
      setMembreSelectionne(m || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCredit(form);
      navigate('/credits');
    } catch (err) {
      if (err.response?.data) setErreurs(err.response.data);
    } finally {
      setLoading(false);
    }
  };

  const montant = parseFloat(form.montant_demande) || 0;
  const frg = montant > 0 ? Math.round(montant / 6) : 0;
  const echeance = form.nombre_echeances > 0 ? Math.round(montant / form.nombre_echeances) : 0;
  const nbErreurs = Object.keys(erreurs).filter(k => erreurs[k]).length;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={styles.btnBack} onClick={() => navigate('/credits')}>← Retour</button>
          <div>
            <h1 style={styles.title}>Nouveau Dossier de Crédit</h1>
            <p style={styles.subtitle}>Création d'une demande de financement</p>
          </div>
        </div>
        {nbErreurs > 0 && (
          <div style={styles.errorBanner}>
            ⚠ {nbErreurs} champ{nbErreurs > 1 ? 's' : ''} invalide{nbErreurs > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Membre */}
        <Section icon={<IconUser />} title="Sélection du membre" color="#1A6FD4">
          <div style={styles.field}>
            <label style={styles.label}>Membre actif <span style={{ color: '#EF4444' }}>*</span></label>
            <select name="membre" value={form.membre} onChange={handleChange}
              style={{ ...styles.input, borderColor: erreurs.membre ? '#EF4444' : '#E5E7EB' }}
              required>
              <option value="">— Choisir un membre —</option>
              {membres.map(m => (
                <option key={m.id} value={m.id} disabled={m.a_credit_actif}>
                  {m.numero_membre} — {m.nom_complet}{m.a_credit_actif ? ' ⛔ crédit en cours' : ''}
                </option>
              ))}
            </select>
            {erreurs.membre && <span style={styles.erreur}>⚠ {erreurs.membre}</span>}
          </div>

          {/* Carte membre sélectionné */}
          {membreSelectionne && (
            <div style={styles.membreCard}>
              <div style={styles.membreAvatar}>
                {membreSelectionne.nom_complet?.charAt(0) || '?'}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>
                  {membreSelectionne.nom_complet}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                  {membreSelectionne.numero_membre} · {membreSelectionne.telephone || '—'}
                </div>
              </div>
              <span style={{
                marginLeft: 'auto', padding: '4px 12px', borderRadius: '99px',
                fontSize: '12px', fontWeight: '600',
                background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0'
              }}>
                ● Actif
              </span>
            </div>
          )}
        </Section>

        {/* Montant et conditions */}
        <Section icon={<IconMoney />} title="Montant et conditions" color="#16A34A">
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Montant demandé (FCFA) <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="number" name="montant_demande" value={form.montant_demande}
                onChange={handleChange}
                style={{ ...styles.input, borderColor: erreurs.montant_demande ? '#EF4444' : '#E5E7EB' }}
                min="1000" placeholder="Ex: 100000" required />
              {erreurs.montant_demande && <span style={styles.erreur}>⚠ {erreurs.montant_demande}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Fréquence de remboursement <span style={{ color: '#EF4444' }}>*</span></label>
              <select name="frequence_remboursement" value={form.frequence_remboursement}
                onChange={handleChange} style={styles.input}>
                <option value="MENSUEL">📅 Mensuel</option>
                <option value="HEBDOMADAIRE">📆 Hebdomadaire</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Nombre d'échéances <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="number" name="nombre_echeances" value={form.nombre_echeances}
                onChange={handleChange}
                style={{ ...styles.input, borderColor: erreurs.nombre_echeances ? '#EF4444' : '#E5E7EB' }}
                min="1" placeholder="Ex: 12" required />
              {erreurs.nombre_echeances && <span style={styles.erreur}>⚠ {erreurs.nombre_echeances}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Mode de déblocage <span style={{ color: '#EF4444' }}>*</span></label>
              <select name="mode_deblocage" value={form.mode_deblocage}
                onChange={handleChange} style={styles.input}>
                <option value="ESPECES">{modeIcon.ESPECES} Espèces</option>
                <option value="MOBILE_MONEY">{modeIcon.MOBILE_MONEY} Mobile Money</option>
                <option value="VIREMENT">{modeIcon.VIREMENT} Virement bancaire</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Simulation */}
        {montant > 0 && (
          <Section icon={<IconChart />} title="Simulation automatique" color="#7C3AED">
            <div style={styles.simGrid}>
              <div style={styles.simCard}>
                <div style={styles.simLabel}>Montant demandé</div>
                <div style={styles.simValue}>{montant.toLocaleString()}</div>
                <div style={styles.simUnit}>FCFA</div>
              </div>
              <div style={{ ...styles.simCard, borderTop: '3px solid #F59E0B' }}>
                <div style={styles.simLabel}>FRG à verser (1/6)</div>
                <div style={{ ...styles.simValue, color: '#F59E0B' }}>{frg.toLocaleString()}</div>
                <div style={styles.simUnit}>FCFA — avant déblocage</div>
              </div>
              <div style={{ ...styles.simCard, borderTop: '3px solid #16A34A' }}>
                <div style={styles.simLabel}>Montant net débloqué</div>
                <div style={{ ...styles.simValue, color: '#16A34A' }}>{montant.toLocaleString()}</div>
                <div style={styles.simUnit}>FCFA</div>
              </div>
              <div style={{ ...styles.simCard, borderTop: '3px solid #1A6FD4' }}>
                <div style={styles.simLabel}>
                  Échéance {form.frequence_remboursement === 'MENSUEL' ? 'mensuelle' : 'hebdomadaire'}
                </div>
                <div style={{ ...styles.simValue, color: '#1A6FD4' }}>
                  {echeance > 0 ? echeance.toLocaleString() : '—'}
                </div>
                <div style={styles.simUnit}>FCFA × {form.nombre_echeances || '?'}</div>
              </div>
            </div>
            <div style={styles.frgInfo}>
              ℹ Le FRG de <strong>{frg.toLocaleString()} FCFA</strong> doit être versé par le membre <strong>avant</strong> le déblocage. Il est conservé définitivement par la microfinance.
            </div>
          </Section>
        )}

        {/* Notes */}
        <Section icon={<IconNote />} title="Notes et observations" color="#6B7280">
          <textarea name="notes" value={form.notes} onChange={handleChange}
            style={{ ...styles.input, minHeight: '90px', resize: 'vertical' }}
            placeholder="Motif de la demande, observations particulières..." />
        </Section>

        {/* Actions */}
        <div style={styles.actions}>
          <button type="button" style={styles.btnCancel} onClick={() => navigate('/credits')}>
            Annuler
          </button>
          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? 'Enregistrement...' : '✓ Soumettre le dossier'}
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
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  erreur: { fontSize: '12px', color: '#EF4444', fontWeight: '500' },
  membreCard: { display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 16px', marginTop: '12px' },
  membreAvatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#1A6FD4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', flexShrink: 0 },
  simGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' },
  simCard: { background: '#F9FAFB', borderRadius: '10px', padding: '16px', textAlign: 'center', borderTop: '3px solid #E5E7EB' },
  simLabel: { fontSize: '11px', color: '#6B7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' },
  simValue: { fontSize: '20px', fontWeight: '800', color: '#111827' },
  simUnit: { fontSize: '11px', color: '#9CA3AF', marginTop: '4px' },
  frgInfo: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#92400E' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' },
  btnCancel: { padding: '11px 28px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151' },
  btnSubmit: { padding: '11px 28px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};
