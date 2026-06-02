import { useState, useEffect } from 'react';
import api from '../../api/axios';

const roleConfig = {
  DG:         { label: 'Directeur Général', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  COMPTABLE:  { label: 'Comptable',         bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  SUPERVISEUR:{ label: 'Superviseur',       bg: '#FFFBEB', color: '#F59E0B', border: '#FDE68A' },
};

const avatarColor = (nom) => {
  const colors = ['#1A6FD4','#9333EA','#16A34A','#F59E0B','#EF4444','#06B6D4','#EC4899'];
  if (!nom) return colors[0];
  return colors[nom.charCodeAt(0) % colors.length];
};

export default function Utilisateurs() {
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
      username: user.username, first_name: user.first_name || '',
      last_name: user.last_name || '', email: user.email || '',
      role: user.role, telephone: user.telephone || '',
      password: '', est_actif: user.est_actif, is_staff: user.is_staff,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditUser(null);
    setForm({ username: '', first_name: '', last_name: '', email: '', role: 'COMPTABLE', telephone: '', password: '', est_actif: true, is_staff: false });
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
    } finally { setSaving(false); }
  };

  const handleToggleActif = async (user) => {
    await api.patch(`/core/utilisateurs/${user.id}/`, { est_actif: !user.est_actif });
    fetchUtilisateurs();
  };

  const stats = {
    total: utilisateurs.length,
    actifs: utilisateurs.filter(u => u.est_actif).length,
    dg: utilisateurs.filter(u => u.role === 'DG').length,
    comptable: utilisateurs.filter(u => u.role === 'COMPTABLE').length,
    superviseur: utilisateurs.filter(u => u.role === 'SUPERVISEUR').length,
  };

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion des Utilisateurs</h1>
          <p style={styles.subtitle}>{stats.actifs} actif{stats.actifs > 1 ? 's' : ''} sur {stats.total} utilisateur{stats.total > 1 ? 's' : ''}</p>
        </div>
        <button style={styles.btnPrimary} onClick={handleNew}>
          + Nouvel utilisateur
        </button>
      </div>

      {/* Stats */}
      <div style={styles.grid4}>
        {[
          { label: 'Total',        value: stats.total,       color: '#1A6FD4', bg: '#EFF6FF' },
          { label: 'Dir. Généraux', value: stats.dg,         color: '#1D4ED8', bg: '#EFF6FF' },
          { label: 'Comptables',   value: stats.comptable,   color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Superviseurs', value: stats.superviseur, color: '#F59E0B', bg: '#FFFBEB' },
        ].map(c => (
          <div key={c.label} style={styles.statCard}>
            <div style={{ ...styles.statValue, color: c.color }}>{c.value}</div>
            <div style={styles.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editUser ? `Modifier — ${editUser.username}` : 'Nouvel utilisateur'}
              </h2>
              <button style={styles.btnClose} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
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
                  <label style={styles.label}>
                    {editUser ? 'Nouveau mot de passe (vide = inchangé)' : 'Mot de passe *'}
                  </label>
                  <input name="password" type="password" value={form.password}
                    onChange={handleChange} style={styles.input} required={!editUser} />
                  {erreurs.password && <span style={styles.erreur}>{erreurs.password}</span>}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Droits</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
                    {[
                      { name: 'est_actif', label: 'Compte actif', checked: form.est_actif },
                      { name: 'is_staff', label: 'Accès admin Django', checked: form.is_staff },
                    ].map(cb => (
                      <label key={cb.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                        <input type="checkbox" name={cb.name} checked={cb.checked} onChange={handleChange} />
                        {cb.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.btnCancel} onClick={() => setShowForm(false)}>Annuler</button>
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
        <div style={styles.empty}>Chargement...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Utilisateur</th>
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Téléphone</th>
                <th style={styles.th}>Admin</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u, i) => {
                const rc = roleConfig[u.role] || { label: u.role, bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
                const initiale = (u.first_name || u.username || '?').charAt(0).toUpperCase();
                return (
                  <tr key={u.id} style={{ ...styles.tr, background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: avatarColor(u.username), color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', fontWeight: 'bold', flexShrink: 0
                        }}>
                          {initiale}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#111827', fontSize: '14px' }}>{u.username}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>{u.nom_complet || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                        background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`
                      }}>
                        {rc.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{u.email || '—'}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{u.telephone || '—'}</span>
                    </td>
                    <td style={styles.td}>
                      {u.is_staff
                        ? <span style={{ fontSize: '12px', fontWeight: '600', color: '#7C3AED', background: '#F5F3FF', padding: '3px 8px', borderRadius: '99px' }}>✓ Admin</span>
                        : <span style={{ color: '#9CA3AF', fontSize: '13px' }}>—</span>
                      }
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                        background: u.est_actif ? '#F0FDF4' : '#FEF2F2',
                        color: u.est_actif ? '#16A34A' : '#EF4444',
                        border: `1px solid ${u.est_actif ? '#BBF7D0' : '#FECACA'}`
                      }}>
                        {u.est_actif ? '● Actif' : '● Inactif'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={styles.btnEdit} onClick={() => handleEdit(u)}>✏ Modifier</button>
                        <button
                          style={{ ...styles.btnToggle, background: u.est_actif ? '#FEF2F2' : '#F0FDF4', color: u.est_actif ? '#DC2626' : '#16A34A', border: `1px solid ${u.est_actif ? '#FECACA' : '#BBF7D0'}` }}
                          onClick={() => handleToggleActif(u)}>
                          {u.est_actif ? '⏸ Désactiver' : '▶ Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
  btnPrimary: { padding: '10px 20px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  statValue: { fontSize: '32px', fontWeight: '800', lineHeight: 1 },
  statLabel: { fontSize: '13px', color: '#6B7280', marginTop: '6px' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: '12px', padding: '32px', width: '640px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 },
  btnClose: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280', padding: '4px 8px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  erreur: { fontSize: '12px', color: '#EF4444' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' },
  btnCancel: { padding: '10px 24px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  empty: { textAlign: 'center', padding: '40px', color: '#9CA3AF' },
  tableWrapper: { background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F8FAFC' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151', verticalAlign: 'middle' },
  btnEdit: { padding: '5px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#2563EB', fontWeight: '600' },
  btnToggle: { padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
};
