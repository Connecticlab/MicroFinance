import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCredit } from '../../api/credits';
import { getMembres } from '../../api/membres';

export default function NouveauCredit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [membres, setMembres] = useState([]);
  const [erreurs, setErreurs] = useState({});
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

  // Calcul automatique FRG et montant net
  const montant = parseFloat(form.montant_demande) || 0;
  const frg = montant > 0 ? Math.round(montant / 6) : 0;
  const montantNet = montant - frg;
  const echeance = form.nombre_echeances > 0
    ? Math.round(montant / form.nombre_echeances)
    : 0;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/credits')}>
          ← Retour
        </button>
        <h1 style={styles.title}>Nouveau Dossier de Crédit</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Membre */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👤 Membre</h2>
          <div style={styles.field}>
            <label style={styles.label}>Sélectionner un membre actif *</label>
            <select name="membre" value={form.membre} onChange={handleChange}
              style={{ ...styles.input, borderColor: erreurs.membre ? '#EF4444' : '#D1D5DB' }}
              required>
              <option value="">— Choisir un membre —</option>
              {membres.map(m => (
                <option key={m.id} value={m.id}>
                  {m.numero_membre} — {m.nom_complet}
                </option>
              ))}
            </select>
            {erreurs.membre && <span style={styles.erreur}>{erreurs.membre}</span>}
          </div>
        </div>

        {/* Montant */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💰 Montant et conditions</h2>
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Montant demandé (FCFA) *</label>
              <input type="number" name="montant_demande" value={form.montant_demande}
                onChange={handleChange} style={styles.input} min="1000" required />
              {erreurs.montant_demande && <span style={styles.erreur}>{erreurs.montant_demande}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Fréquence de remboursement *</label>
              <select name="frequence_remboursement" value={form.frequence_remboursement}
                onChange={handleChange} style={styles.input}>
                <option value="MENSUEL">Mensuel</option>
                <option value="HEBDOMADAIRE">Hebdomadaire</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Nombre d'échéances *</label>
              <input type="number" name="nombre_echeances" value={form.nombre_echeances}
                onChange={handleChange} style={styles.input} min="1" required />
              {erreurs.nombre_echeances && <span style={styles.erreur}>{erreurs.nombre_echeances}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Mode de déblocage *</label>
              <select name="mode_deblocage" value={form.mode_deblocage}
                onChange={handleChange} style={styles.input}>
                <option value="ESPECES">Espèces</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="VIREMENT">Virement bancaire</option>
              </select>
            </div>
          </div>
        </div>

        {/* Simulation */}
        {montant > 0 && (
          <div style={styles.simulation}>
            <h2 style={styles.simTitle}>📊 Simulation automatique</h2>
            <div style={styles.simGrid}>
              <div style={styles.simCard}>
                <div style={styles.simLabel}>Montant demandé</div>
                <div style={styles.simValue}>{montant.toLocaleString()} FCFA</div>
              </div>
              <div style={{ ...styles.simCard, background: '#FEF3C7' }}>
                <div style={styles.simLabel}>FRG (1/6)</div>
                <div style={{ ...styles.simValue, color: '#D97706' }}>
                  — {frg.toLocaleString()} FCFA
                </div>
              </div>
              <div style={{ ...styles.simCard, background: '#F0FDF4' }}>
                <div style={styles.simLabel}>Montant net débloqué</div>
                <div style={{ ...styles.simValue, color: '#4BB543' }}>
                  {montantNet.toLocaleString()} FCFA
                </div>
              </div>
              <div style={{ ...styles.simCard, background: '#EFF6FF' }}>
                <div style={styles.simLabel}>
                  Échéance {form.frequence_remboursement === 'MENSUEL' ? 'mensuelle' : 'hebdomadaire'}
                </div>
                <div style={{ ...styles.simValue, color: '#1A6FD4' }}>
                  {echeance.toLocaleString()} FCFA
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📝 Notes</h2>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            placeholder="Observations, motif de la demande..." />
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.btnCancel} onClick={() => navigate('/credits')}>
            Annuler
          </button>
          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? 'Enregistrement...' : '💾 Enregistrer le dossier'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  btnBack: { padding: '8px 16px', background: 'transparent', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  section: { background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  erreur: { fontSize: '12px', color: '#EF4444' },
  simulation: { background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #1A6FD4' },
  simTitle: { fontSize: '16px', fontWeight: '600', color: '#1A6FD4', marginBottom: '16px' },
  simGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  simCard: { background: '#F9FAFB', borderRadius: '8px', padding: '16px', textAlign: 'center' },
  simLabel: { fontSize: '12px', color: '#6B7280', marginBottom: '8px' },
  simValue: { fontSize: '18px', fontWeight: 'bold', color: '#111827' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' },
  btnCancel: { padding: '10px 24px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  btnSubmit: { padding: '10px 24px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};
