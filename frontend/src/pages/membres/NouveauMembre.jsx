import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMembre } from '../../api/membres';

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconId = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);
const IconWork = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconHeart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconDoc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

function Field({ label, name, type = 'text', options, required, hint, form, erreurs, handleChange }) {
  const hasError = !!erreurs[name];
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {options ? (
        <select name={name} value={form[name]} onChange={handleChange}
          style={{ ...styles.input, borderColor: hasError ? '#EF4444' : '#E5E7EB' }}>
          <option value="">— Choisir —</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={form[name]} onChange={handleChange}
          style={{ ...styles.input, borderColor: hasError ? '#EF4444' : '#E5E7EB' }} />
      )}
      {hint && <span style={styles.hint}>{hint}</span>}
      {hasError && <span style={styles.erreur}>⚠ {erreurs[name]}</span>}
    </div>
  );
}

function FileField({ label, name, required, hint, fichiers, erreurs, handleFichier }) {
  const hasError = !!erreurs[name];
  const fileName = fichiers[name]?.name;
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <label style={{ ...styles.fileLabel, borderColor: hasError ? '#EF4444' : '#E5E7EB', background: fileName ? '#F0FDF4' : '#FAFAFA' }}>
        <div style={{ color: fileName ? '#16A34A' : '#6B7280', display: 'flex', alignItems: 'center', gap: '8px', flexDirection: 'column' }}>
          <IconUpload />
          <span style={{ fontSize: '13px', fontWeight: '500' }}>
            {fileName || 'Cliquer pour sélectionner'}
          </span>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>PDF, JPG, PNG</span>
        </div>
        <input type="file" name={name} onChange={handleFichier}
          accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} required={required} />
      </label>
      {hint && <span style={styles.hint}>{hint}</span>}
      {hasError && <span style={styles.erreur}>⚠ {erreurs[name]}</span>}
    </div>
  );
}

function Section({ icon, title, color, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div style={{ ...styles.sectionIcon, background: color + '15', color }}>
          {icon}
        </div>
        <h2 style={styles.sectionTitle}>{title}</h2>
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

const STEPS = ['Identité', 'Pièce d\'identité', 'Activité', 'Bénéficiaire', 'Documents'];

export default function NouveauMembre() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [fichiers, setFichiers] = useState({ copie_piece_identite: null, justificatif_domicile: null });
  const [form, setForm] = useState({
    nom: '', prenom: '', sexe: '', date_naissance: '',
    lieu_naissance: '', type_piece: '', numero_piece: '',
    date_expiration_piece: '', telephone: '', adresse: '',
    email: '', profession: '', secteur_activite: '',
    revenu_mensuel_estime: '', beneficiaire_nom: '',
    beneficiaire_telephone: '', beneficiaire_lien: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErreurs({ ...erreurs, [e.target.name]: '' });
  };

  const handleFichier = (e) => {
    setFichiers({ ...fichiers, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => formData.append(k, form[k]));
      if (fichiers.copie_piece_identite) formData.append('copie_piece_identite', fichiers.copie_piece_identite);
      if (fichiers.justificatif_domicile) formData.append('justificatif_domicile', fichiers.justificatif_domicile);
      await createMembre(formData);
      navigate('/membres');
    } catch (err) {
      if (err.response?.data) setErreurs(err.response.data);
    } finally {
      setLoading(false);
    }
  };

  const nbErreurs = Object.keys(erreurs).filter(k => erreurs[k]).length;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={styles.btnBack} onClick={() => navigate('/membres')}>
            ← Retour
          </button>
          <div>
            <h1 style={styles.title}>Nouveau Membre</h1>
            <p style={styles.subtitle}>Enregistrement d'un nouveau membre — Imp'ACT Finance</p>
          </div>
        </div>
        {nbErreurs > 0 && (
          <div style={styles.errorBanner}>
            ⚠ {nbErreurs} champ{nbErreurs > 1 ? 's' : ''} invalide{nbErreurs > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Indicateur étapes */}
      <div style={styles.stepsBar}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={styles.stepItem}>
              <div style={{ ...styles.stepDot, background: '#1A6FD4' }}>{i + 1}</div>
              <span style={styles.stepLabel}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={styles.stepLine} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Identité */}
        <Section icon={<IconUser />} title="Identité" color="#1A6FD4">
          <div style={styles.grid2}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Nom" name="nom" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Prénom" name="prenom" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Sexe" name="sexe" required options={[
              { value: 'M', label: 'Masculin' },
              { value: 'F', label: 'Féminin' },
            ]} />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Date de naissance" name="date_naissance" type="date" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Lieu de naissance" name="lieu_naissance" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Téléphone" name="telephone" required />
          </div>
          <div style={styles.grid2}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Adresse" name="adresse" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Email" name="email" type="email" />
          </div>
        </Section>

        {/* Pièce d'identité */}
        <Section icon={<IconId />} title="Pièce d'identité" color="#7C3AED">
          <div style={styles.grid3}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Type de pièce" name="type_piece" required options={[
              { value: 'CNI', label: "Carte Nationale d'Identité" },
              { value: 'PASSEPORT', label: 'Passeport' },
              { value: 'PERMIS', label: 'Permis de conduire' },
            ]} />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Numéro de pièce" name="numero_piece" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Date d'expiration" name="date_expiration_piece" type="date" required />
          </div>
        </Section>

        {/* Activité */}
        <Section icon={<IconWork />} title="Activité économique" color="#F59E0B">
          <div style={styles.grid3}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Profession" name="profession" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Secteur d'activité" name="secteur_activite" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Revenu mensuel estimé (FCFA)" name="revenu_mensuel_estime" type="number" />
          </div>
        </Section>

        {/* Bénéficiaire */}
        <Section icon={<IconHeart />} title="Personne à contacter / Bénéficiaire" color="#EF4444">
          <div style={styles.grid3}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Nom complet" name="beneficiaire_nom" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Téléphone" name="beneficiaire_telephone" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Lien de parenté" name="beneficiaire_lien" />
          </div>
        </Section>

        {/* Documents */}
        <Section icon={<IconDoc />} title="Documents justificatifs" color="#16A34A">
          <div style={styles.grid2}>
            <FileField
              label="Copie pièce d'identité légalisée" name="copie_piece_identite"
              required fichiers={fichiers} erreurs={erreurs} handleFichier={handleFichier} />
            <FileField
              label="Justificatif de domicile" name="justificatif_domicile"
              required hint="Facture d'eau, d'électricité ou certificat de résidence"
              fichiers={fichiers} erreurs={erreurs} handleFichier={handleFichier} />
          </div>
          <div style={styles.infoBox}>
            <span style={{ fontSize: '13px', color: '#92400E' }}>
              ℹ Les frais d'adhésion de <strong>5 000 FCFA</strong> seront enregistrés séparément après validation du dossier.
            </span>
          </div>
        </Section>

        {/* Actions */}
        <div style={styles.actions}>
          <button type="button" style={styles.btnCancel} onClick={() => navigate('/membres')}>
            Annuler
          </button>
          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.spinner} /> Enregistrement...
              </span>
            ) : '✓ Enregistrer le membre'}
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
  stepsBar: { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '10px', padding: '16px 24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflowX: 'auto', gap: '4px' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  stepDot: { width: '26px', height: '26px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  stepLabel: { fontSize: '12px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' },
  stepLine: { width: '32px', height: '2px', background: '#E5E7EB', flexShrink: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  section: { background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderBottom: '1px solid #F3F4F6' },
  sectionIcon: { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 },
  sectionBody: { padding: '20px 24px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  fileLabel: { display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #E5E7EB', borderRadius: '10px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  hint: { fontSize: '12px', color: '#6B7280', fontStyle: 'italic' },
  erreur: { fontSize: '12px', color: '#EF4444', fontWeight: '500' },
  infoBox: { marginTop: '16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 16px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' },
  btnCancel: { padding: '11px 28px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151' },
  btnSubmit: { padding: '11px 28px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
  spinner: { width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' },
};
