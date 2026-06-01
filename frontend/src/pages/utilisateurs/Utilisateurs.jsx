import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function Utilisateurs() {
  const navigate = useNavigate();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({
    username: '', first_name: '', last_name: '',
    email: '', role: 'COMPTABLE', telephone: '',
    password: '', est_actif: true, is_staff: false,
  });
  const [erreurs, setErreurs] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchUtilisateurs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/core/utilisateurs/');
      setUtilisateurs(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUtilisateurs(); }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
    setErreurs({ ...erreurs, [e.target.name]: '' });
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role,
      telephone: user.telephone || '',
      password: '',
      est_actif: user.est_actif,
      is_staff: user.is_staff,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditUser(null);
    setForm({
      username: '', first_name: '', last_name: '',
      email: '', role: 'COMPTABLE', telephone: '',
      password: '', est_actif: true, is_staff: false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editUser) {
        await api.put(`/core/utilisateurs/${editUser.id}/`, data);
      } else {
        await api.post('/core/utilisateurs/', data);
      }
      setShowForm(false);
      fetchUtilisateurs();
    } catch (err) {
      if (err.response?.data) setErreurs(err.response.data);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActif = async (user) => {
    await api.patch(`/core/utilisateurs/${user.id}/`, { est_actif: !user.est_actif });
    fetchUtilisateurs();
  };

  const roleColor = {
    DG: '#1A6FD4', COMPTABLE: '#4BB543', SUPERVISEUR: '#F5A623',
  };
  const roleLabel = {
    DG: 'Directeur Général', COMPTABLE: 'Comptable', SUPERVISEUR: 'Superviseur',
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>👥 Gestion des Utilisateurs</h1>
        <button style={styles.btnPrimary} onClick={handleNew}>
          + Nouvel utilisateur
        </button>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h2 style={styles.modalTitle}>
              {editUser ? `Modifier — ${editUser.username}` : 'Nouvel utilisateur'}
            </h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Nom d'utilisateur *</label>
                  <input name="username" value={form.username} onChange={handleChange}
                    style={styles.input} required disabled={!!editUser} />
                  {erreurs.username && <span style={styles.erreur}>{erreurs.username}</span>}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Rôle *</label>
                  <select name="role" value={form.role} onChange={handleChange} style={styles.input}>
                    <option value="DG">Directeur Général</option>
                    <option value="COMPTABLE">Comptable</option>
                    <option value="SUPERVISEUR">Superviseur</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Prénom</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Nom</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Téléphone</label>
                  <input name="telephone" value={form.telephone} onChange={handleChange} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{editUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}</label>
                  <input name="password" type="password" value={form.password}
                    onChange={handleChange} style={styles.input}
                    required={!editUser} />
                  {erreurs.password && <span style={styles.erreur}>{erreurs.password}</span>}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Droits</label>
                  <div style={styles.checkboxGroup}>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" name="est_actif" checked={form.est_actif}
                        onChange={handleChange} />
                      Compte actif
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" name="is_staff" checked={form.is_staff}
                        onChange={handleChange} />
                      Accès administration Django
                    </label>
                  </div>
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.btnCancel}
                  onClick={() => setShowForm(false)}>
                  Annuler
                </button>
                <button type="submit" style={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Utilisateur</th>
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Téléphone</th>
                <th style={styles.th}>Admin Django</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map(u => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600' }}>{u.username}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      {u.nom_complet}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                      fontWeight: '600',
                      background: (roleColor[u.role] || '#6B7280') + '20',
                      color: roleColor[u.role] || '#6B7280',
                    }}>
                      {roleLabel[u.role] || u.role}
                    </span>
                  </td>
                  <td style={styles.td}>{u.email || '—'}</td>
                  <td style={styles.td}>{u.telephone || '—'}</td>
                  <td style={styles.td}>{u.is_staff ? '✅' : '—'}</td>
                  <td style={styles.td}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                      background: u.est_actif ? '#F0FDF4' : '#FEF2F2',
                      color: u.est_actif ? '#4BB543' : '#EF4444',
                    }}>
                      {u.est_actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.btnSmallBlue} onClick={() => handleEdit(u)}>
                      ✏️ Modifier
                    </button>
                    <button
                      style={{ ...styles.btnSmall, background: u.est_actif ? '#EF4444' : '#4BB543' }}
                      onClick={() => handleToggleActif(u)}>
                      {u.est_actif ? '⏸ Désactiver' : '▶ Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  btnPrimary: { padding: '10px 20px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  loading: { textAlign: 'center', padding: '40px', color: '#6B7280' },
  tableWrapper: { background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F3F4F6' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' },
  tr: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#374151' },
  btnSmallBlue: { padding: '4px 10px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' },
  btnSmall: { padding: '4px 10px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  modal: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: '12px', padding: '32px', width: '640px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  erreur: { fontSize: '12px', color: '#EF4444' },
  checkboxGroup: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  btnCancel: { padding: '10px 24px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer' },
};
