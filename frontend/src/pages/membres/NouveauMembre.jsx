import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMembre } from '../../api/membres';

function Field({ label, name, type = 'text', options, form, erreurs, handleChange }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {options ? (
        <select name={name} value={form[name]} onChange={handleChange} style={styles.input}>
          <option value="">— Choisir —</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type} name={name} value={form[name]}
          onChange={handleChange} style={{
            ...styles.input,
            borderColor: erreurs[name] ? '#EF4444' : '#D1D5DB'
          }}
        />
      )}
      {erreurs[name] && <span style={styles.erreur}>{erreurs[name]}</span>}
    </div>
  );
}

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
      if (err.response?.data) {
        setErreurs(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/membres')}>
          ← Retour
        </button>
        <h1 style={styles.title}>Nouveau Membre</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Identité */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Identité</h2>
          <div style={styles.grid2}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Nom *" name="nom" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Prénom *" name="prenom" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Sexe *" name="sexe" options={[
              { value: 'M', label: 'Masculin' },
              { value: 'F', label: 'Féminin' },
            ]} />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Date de naissance *" name="date_naissance" type="date" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Lieu de naissance *" name="lieu_naissance" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Téléphone *" name="telephone" />
          </div>
          <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Adresse *" name="adresse" />
          <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Email" name="email" type="email" />
        </div>

        {/* Pièce d'identité */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Pièce d'identité</h2>
          <div style={styles.grid2}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Type de pièce *" name="type_piece" options={[
              { value: 'CNI', label: "Carte Nationale d'Identité" },
              { value: 'PASSEPORT', label: 'Passeport' },
              { value: 'PERMIS', label: 'Permis de conduire' },
            ]} />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Numéro de pièce *" name="numero_piece" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Date d'expiration *" name="date_expiration_piece" type="date" />
          </div>
        </div>

        {/* Activité */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Activité économique</h2>
          <div style={styles.grid2}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Profession *" name="profession" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Secteur d'activité *" name="secteur_activite" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Revenu mensuel estimé (FCFA)" name="revenu_mensuel_estime" type="number" />
          </div>
        </div>

        {/* Bénéficiaire */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Bénéficiaire en cas de décès</h2>
          <div style={styles.grid2}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Nom complet" name="beneficiaire_nom" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Téléphone" name="beneficiaire_telephone" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Lien de parenté" name="beneficiaire_lien" />
          </div>
        </div>

        {/* Documents justificatifs */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Documents justificatifs</h2>
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Copie pièce d'identité légalisée *</label>
              <input type="file" name="copie_piece_identite" onChange={handleFichier}
                accept=".pdf,.jpg,.jpeg,.png" style={styles.inputFile} required />
              {erreurs.copie_piece_identite && <span style={styles.erreur}>{erreurs.copie_piece_identite}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Justificatif de domicile *</label>
              <input type="file" name="justificatif_domicile" onChange={handleFichier}
                accept=".pdf,.jpg,.jpeg,.png" style={styles.inputFile} required />
              <small style={styles.hint}>Certificat de résidence, facture d'eau ou d'électricité</small>
              {erreurs.justificatif_domicile && <span style={styles.erreur}>{erreurs.justificatif_domicile}</span>}
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.btnCancel} onClick={() => navigate('/membres')}>
            Annuler
          </button>
          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer le membre'}
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
  input: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff' },
  erreur: { fontSize: '12px', color: '#EF4444' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' },
  btnCancel: { padding: '10px 24px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  btnSubmit: { padding: '10px 24px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  inputFile: { padding: '8px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', background: '#fff', cursor: 'pointer' },
  hint: { fontSize: '12px', color: '#6B7280' },
};
