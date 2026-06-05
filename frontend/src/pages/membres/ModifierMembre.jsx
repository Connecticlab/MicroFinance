import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMembre } from '../../api/membres';
import api from '../../api/axios';

function Field({ label, name, type = 'text', options, required, hint, form, erreurs, handleChange, disabled }) {
  const hasError = !!erreurs[name];
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {options ? (
        <select name={name} value={form[name] || ''} onChange={handleChange} disabled={disabled}
          style={{ ...styles.input, borderColor: hasError ? '#EF4444' : '#E5E7EB', background: disabled ? '#F9FAFB' : '#fff' }}>
          <option value="">— Choisir —</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={form[name] || ''} onChange={handleChange} disabled={disabled}
          style={{ ...styles.input, borderColor: hasError ? '#EF4444' : '#E5E7EB', background: disabled ? '#F9FAFB' : '#fff' }} />
      )}
      {hint && <span style={styles.hint}>{hint}</span>}
      {hasError && <span style={styles.erreur}>⚠ {erreurs[name]}</span>}
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={styles.section}>
      <div style={{ ...styles.sectionHeader, borderLeft: `4px solid ${color}` }}>
        <h2 style={styles.sectionTitle}>{title}</h2>
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

export default function ModifierMembre() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [form, setForm] = useState({
    nom: '', prenom: '', sexe: '', date_naissance: '',
    lieu_naissance: '', type_piece: '', numero_piece: '',
    date_expiration_piece: '', telephone: '', adresse: '',
    email: '', profession: '', secteur_activite: '',
    revenu_mensuel_estime: '', beneficiaire_nom: '',
    beneficiaire_telephone: '', beneficiaire_lien: '',
    statut: '', eligible_credit: false,
  });

  useEffect(() => {
    getMembre(id).then(res => {
      const m = res.data;
      setForm({
        nom: m.nom || '',
        prenom: m.prenom || '',
        sexe: m.sexe || '',
        date_naissance: m.date_naissance || '',
        lieu_naissance: m.lieu_naissance || '',
        type_piece: m.type_piece || '',
        numero_piece: m.numero_piece || '',
        date_expiration_piece: m.date_expiration_piece || '',
        telephone: m.telephone || '',
        adresse: m.adresse || '',
        email: m.email || '',
        profession: m.profession || '',
        secteur_activite: m.secteur_activite || '',
        revenu_mensuel_estime: m.revenu_mensuel_estime || '',
        beneficiaire_nom: m.beneficiaire_nom || '',
        beneficiaire_telephone: m.beneficiaire_telephone || '',
        beneficiaire_lien: m.beneficiaire_lien || '',
        statut: m.statut || '',
      });
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErreurs({ ...erreurs, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/membres/${id}/`, form);
      navigate(`/membres/${id}`);
    } catch (err) {
      if (err.response?.data) setErreurs(err.response.data);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={styles.btnBack} onClick={() => navigate(`/membres/${id}`)}>← Retour</button>
          <div>
            <h1 style={styles.title}>Modifier le membre</h1>
            <p style={styles.subtitle}>Mise à jour des informations</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        <Section title="Identité" color="#1A6FD4">
          <div style={styles.grid2}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Nom" name="nom" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Prénom" name="prenom" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Sexe" name="sexe" required options={[
              { value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }
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

        <Section title="Pièce d'identité" color="#7C3AED">
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

        <Section title="Activité économique" color="#F59E0B">
          <div style={styles.grid3}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Profession" name="profession" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Secteur d'activité" name="secteur_activite" required />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Revenu mensuel estimé (FCFA)" name="revenu_mensuel_estime" type="number" />
          </div>
        </Section>

        <Section title="Personne à contacter / Bénéficiaire" color="#EF4444">
          <div style={styles.grid3}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Nom complet" name="beneficiaire_nom" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Téléphone" name="beneficiaire_telephone" />
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Lien de parenté" name="beneficiaire_lien" />
          </div>
        </Section>

        <Section title="Statut" color="#16A34A">
          <div style={styles.grid2}>
            <Field form={form} erreurs={erreurs} handleChange={handleChange} label="Statut" name="statut" required options={[
              { value: 'EN_ATTENTE', label: 'En attente' },
              { value: 'ACTIF', label: 'Actif' },
              { value: 'SUSPENDU', label: 'Suspendu' },
              { value: 'EXCLU', label: 'Exclu' },
            ]} />
          </div>
        </Section>

        <div style={styles.actions}>
          <button type="button" style={styles.btnCancel} onClick={() => navigate(`/membres/${id}`)}>Annuler</button>
          <button type="submit" style={styles.btnSubmit} disabled={saving}>
            {saving ? 'Enregistrement...' : '✓ Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  loading: { padding: '40px', textAlign: 'center', color: '#6B7280' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  btnBack: { padding: '8px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151', fontWeight: '500' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  subtitle: { fontSize: '13px', color: '#6B7280', marginTop: '4px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  section: { background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  sectionHeader: { padding: '14px 20px', borderBottom: '1px solid #F3F4F6' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 },
  sectionBody: { padding: '20px 24px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  hint: { fontSize: '12px', color: '#6B7280', fontStyle: 'italic' },
  erreur: { fontSize: '12px', color: '#EF4444', fontWeight: '500' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' },
  btnCancel: { padding: '11px 28px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151' },
  btnSubmit: { padding: '11px 28px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};
