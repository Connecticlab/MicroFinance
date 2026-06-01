import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { getCredits } from '../../api/credits';

export default function NouveauRemboursement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState([]);
  const [creditSelectionne, setCreditSelectionne] = useState(null);
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
      api.get(`/credits/${e.target.value}/`).then(res => {
        setCreditSelectionne(res.data);
      });
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

  // Prochaine échéance
  const prochaineEcheance = creditSelectionne?.echeancier?.find(
    e => e.statut === 'EN_ATTENTE' || e.statut === 'EN_RETARD' || e.statut === 'PARTIELLEMENT_PAYE'
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/remboursements')}>
          ← Retour
        </button>
        <h1 style={styles.title}>Nouveau Remboursement</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Sélection du crédit */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💳 Dossier de Crédit</h2>
          <div style={styles.field}>
            <label style={styles.label}>Sélectionner un crédit en cours *</label>
            <select name="dossier" value={form.dossier} onChange={handleChange}
              style={{ ...styles.input, borderColor: erreurs.dossier ? '#EF4444' : '#D1D5DB' }}
              required>
              <option value="">— Choisir un dossier —</option>
              {credits.map(c => (
                <option key={c.id} value={c.id}>
                  {c.numero_dossier} — {c.membre_nom}
                </option>
              ))}
            </select>
            {erreurs.dossier && <span style={styles.erreur}>{erreurs.dossier}</span>}
          </div>
        </div>

        {/* Info crédit sélectionné */}
        {creditSelectionne && (
          <div style={styles.infoCredit}>
            <h2 style={styles.infoCreditTitle}>📊 Situation du crédit</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Membre</div>
                <div style={styles.infoValue}>{creditSelectionne.membre_detail?.nom_complet}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Montant accordé</div>
                <div style={styles.infoValue}>
                  {Number(creditSelectionne.montant_accorde).toLocaleString()} FCFA
                </div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Montant remboursé</div>
                <div style={{ ...styles.infoValue, color: '#4BB543' }}>
                  {Number(creditSelectionne.montant_rembourse).toLocaleString()} FCFA
                </div>
              </div>
              <div style={{ ...styles.infoCard, borderTop: '3px solid #EF4444' }}>
                <div style={styles.infoLabel}>Montant restant</div>
                <div style={{ ...styles.infoValue, color: '#EF4444' }}>
                  {Number(creditSelectionne.montant_restant).toLocaleString()} FCFA
                </div>
              </div>
            </div>

            {/* Prochaine échéance */}
            {prochaineEcheance && (
              <div style={styles.echeanceAlert}>
                <div style={styles.echeanceTitle}>
                  {prochaineEcheance.statut === 'EN_RETARD' ? '⚠️ Échéance en retard' : '📅 Prochaine échéance'}
                </div>
                <div style={styles.echeanceInfo}>
                  <span>Échéance N° {prochaineEcheance.numero_echeance}</span>
                  <span>Date : <strong>{prochaineEcheance.date_echeance}</strong></span>
                  <span>Montant : <strong>{Number(prochaineEcheance.montant_echeance).toLocaleString()} FCFA</strong></span>
                  {prochaineEcheance.penalite > 0 && (
                    <span style={{ color: '#EF4444' }}>
                      Pénalité : <strong>{Number(prochaineEcheance.penalite).toLocaleString()} FCFA</strong>
                    </span>
                  )}
                </div>
                <button type="button" style={styles.btnSuggerer}
                  onClick={() => setForm({
                    ...form,
                    montant_verse: String(
                      Number(prochaineEcheance.montant_echeance) +
                      Number(prochaineEcheance.penalite || 0)
                    )
                  })}>
                  Utiliser ce montant
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paiement */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💰 Détails du paiement</h2>
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Montant versé (FCFA) *</label>
              <input type="number" name="montant_verse" value={form.montant_verse}
                onChange={handleChange}
                style={{ ...styles.input, borderColor: erreurs.montant_verse ? '#EF4444' : '#D1D5DB' }}
                min="1" required />
              {erreurs.montant_verse && <span style={styles.erreur}>{erreurs.montant_verse}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Date de paiement *</label>
              <input type="date" name="date_paiement" value={form.date_paiement}
                onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Mode de paiement *</label>
              <select name="mode_paiement" value={form.mode_paiement}
                onChange={handleChange} style={styles.input}>
                <option value="ESPECES">Espèces</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="VIREMENT">Virement bancaire</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Référence / N° transaction</label>
              <input type="text" name="reference_paiement" value={form.reference_paiement}
                onChange={handleChange} style={styles.input}
                placeholder="Ex: Wave-XXXXXXXX" />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
              placeholder="Observations éventuelles..." />
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.btnCancel} onClick={() => navigate('/remboursements')}>
            Annuler
          </button>
          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? 'Enregistrement...' : '💾 Enregistrer le remboursement'}
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
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  erreur: { fontSize: '12px', color: '#EF4444' },
  infoCredit: { background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #1A6FD4' },
  infoCreditTitle: { fontSize: '16px', fontWeight: '600', color: '#1A6FD4', marginBottom: '16px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' },
  infoCard: { background: '#F9FAFB', borderRadius: '8px', padding: '12px', borderTop: '3px solid #1A6FD4' },
  infoLabel: { fontSize: '12px', color: '#6B7280', marginBottom: '4px' },
  infoValue: { fontSize: '16px', fontWeight: 'bold', color: '#111827' },
  echeanceAlert: { background: '#FFF7ED', borderRadius: '8px', padding: '16px', border: '1px solid #F5A623' },
  echeanceTitle: { fontSize: '14px', fontWeight: '600', color: '#92400E', marginBottom: '8px' },
  echeanceInfo: { display: 'flex', gap: '20px', fontSize: '13px', color: '#374151', flexWrap: 'wrap', marginBottom: '12px' },
  btnSuggerer: { padding: '6px 14px', background: '#F5A623', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' },
  btnCancel: { padding: '10px 24px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  btnSubmit: { padding: '10px 24px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};
