import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { usePermissions } from '../../store/authStore';

export default function DetailRecouvrement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const perms = usePermissions();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAction, setShowAction] = useState(false);
  const [action, setAction] = useState({
    type_action: 'APPEL',
    date_action: new Date().toISOString().split('T')[0],
    resultat: 'SANS_REPONSE',
    notes: '',
  });

  const fetchDossier = async () => {
    try {
      const res = await api.get(`/recouvrement/dossiers/${id}/`);
      setDossier(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDossier(); }, [id]);

  const handleEscalader = async () => {
    if (window.confirm('Confirmer l\'escalade vers l\'étape suivante ?')) {
      await api.post(`/recouvrement/dossiers/${id}/escalader/`);
      fetchDossier();
    }
  };

  const handleResoudre = async () => {
    if (window.confirm('Confirmer la résolution de ce dossier ?')) {
      await api.post(`/recouvrement/dossiers/${id}/resoudre/`);
      fetchDossier();
    }
  };

  const handlePasserEnPerte = async () => {
    if (window.confirm('Passer ce dossier en perte ? Cette action est irréversible.')) {
      await api.post(`/recouvrement/dossiers/${id}/passer_en_perte/`);
      fetchDossier();
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    await api.post('/recouvrement/actions/', {
      ...action, dossier: id
    });
    setShowAction(false);
    fetchDossier();
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!dossier) return <div style={styles.loading}>Dossier introuvable.</div>;

  const statutColor = {
    OUVERT: '#F5A623', EN_COURS: '#1A6FD4',
    RESOLU: '#4BB543', PERTE: '#EF4444',
  };

  const etapeLabel = {
    RELANCE_1: 'Relance amiable (J+7)',
    RELANCE_2: 'Mise en demeure (J+30)',
    RELANCE_3: 'Intervention superviseur (J+60)',
    RELANCE_4: 'Procédure légale (J+90)',
  };

  const typeActionLabel = {
    APPEL: 'Appel téléphonique',
    SMS: 'SMS',
    VISITE: 'Visite domicile',
    COURRIER: 'Courrier',
    MISE_EN_DEMEURE: 'Mise en demeure',
    AUTRE: 'Autre',
  };

  const resultatColor = {
    SANS_REPONSE: '#6B7280',
    PROMESSE_PAIEMENT: '#F5A623',
    PAIEMENT_PARTIEL: '#1A6FD4',
    PAIEMENT_TOTAL: '#4BB543',
    REFUSE: '#EF4444',
  };

  const Row = ({ label, value }) => (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/recouvrement')}>
          ← Retour
        </button>
        <div>
          <h1 style={styles.title}>{dossier.numero_dossier}</h1>
          <div style={styles.sub}>{dossier.membre_nom}</div>
        </div>
        <span style={{
          ...styles.statut,
          background: (statutColor[dossier.statut] || '#6B7280') + '20',
          color: statutColor[dossier.statut] || '#6B7280',
        }}>
          {dossier.statut}
        </span>
      </div>

      {/* Étape actuelle */}
      <div style={styles.etapeBar}>
        {Object.entries(etapeLabel).map(([key, label]) => (
          <div key={key} style={{
            ...styles.etapeItem,
            background: dossier.etape_actuelle === key ? '#1A6FD4' : '#F3F4F6',
            color: dossier.etape_actuelle === key ? '#fff' : '#6B7280',
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Actions workflow */}
      {perms.peutGererRecouvrement && dossier.statut !== 'RESOLU' && dossier.statut !== 'PERTE' && (
        <div style={styles.actionsBar}>
          <button style={styles.btnBlue} onClick={() => setShowAction(true)}>
            📝 Enregistrer une action
          </button>
          {dossier.etape_actuelle !== 'RELANCE_4' && (
            <button style={styles.btnOrange} onClick={handleEscalader}>
              ⬆ Escalader
            </button>
          )}
          <button style={styles.btnGreen} onClick={handleResoudre}>
            ✅ Marquer résolu
          </button>
          <button style={styles.btnRed} onClick={handlePasserEnPerte}>
            💀 Passer en perte
          </button>
        </div>
      )}

      {/* Modal action */}
      {showAction && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>Enregistrer une action</h3>
            <form onSubmit={handleAction} style={styles.form}>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Type d'action *</label>
                  <select value={action.type_action}
                    onChange={e => setAction({...action, type_action: e.target.value})}
                    style={styles.input}>
                    {Object.entries(typeActionLabel).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Date *</label>
                  <input type="date" value={action.date_action}
                    onChange={e => setAction({...action, date_action: e.target.value})}
                    style={styles.input} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Résultat *</label>
                  <select value={action.resultat}
                    onChange={e => setAction({...action, resultat: e.target.value})}
                    style={styles.input}>
                    <option value="SANS_REPONSE">Sans réponse</option>
                    <option value="PROMESSE_PAIEMENT">Promesse de paiement</option>
                    <option value="PAIEMENT_PARTIEL">Paiement partiel</option>
                    <option value="PAIEMENT_TOTAL">Paiement total</option>
                    <option value="REFUSE">Refus de paiement</option>
                  </select>
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Notes</label>
                <textarea value={action.notes}
                  onChange={e => setAction({...action, notes: e.target.value})}
                  style={{...styles.input, minHeight: '80px'}}
                  placeholder="Détails de l'action..." />
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.btnCancel}
                  onClick={() => setShowAction(false)}>
                  Annuler
                </button>
                <button type="submit" style={styles.btnBlue}>
                  💾 Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {/* Colonne gauche */}
        <div style={styles.col}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>💳 Crédit concerné</h2>
            <Row label="N° Dossier" value={dossier.credit_detail?.numero_dossier || dossier.credit_numero} />
            <Row label="Membre" value={dossier.credit_detail?.membre_nom || dossier.membre_nom} />
            <Row label="Montant en défaut" value={`${Number(dossier.montant_en_defaut).toLocaleString()} FCFA`} />
            <Row label="Montant recouvré" value={`${Number(dossier.montant_recouvre).toLocaleString()} FCFA`} />
            <Row label="Montant restant" value={`${Number(dossier.montant_restant).toLocaleString()} FCFA`} />
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📋 Suivi</h2>
            <Row label="Date ouverture" value={dossier.date_ouverture} />
            <Row label="Date résolution" value={dossier.date_resolution} />
            <Row label="Assigné à" value={dossier.assigne_a_nom} />
            <Row label="Étape actuelle" value={etapeLabel[dossier.etape_actuelle]} />
          </div>
        </div>

        {/* Colonne droite — Historique des actions */}
        <div style={styles.col}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📜 Historique des actions ({dossier.actions?.length || 0})</h2>
            {dossier.actions?.length === 0 ? (
              <div style={styles.empty}>Aucune action enregistrée.</div>
            ) : (
              dossier.actions?.map(a => (
                <div key={a.id} style={styles.actionItem}>
                  <div style={styles.actionHeader}>
                    <span style={styles.actionType}>{typeActionLabel[a.type_action]}</span>
                    <span style={styles.actionDate}>{a.date_action}</span>
                  </div>
                  <div style={styles.actionResultat}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                      background: (resultatColor[a.resultat] || '#6B7280') + '20',
                      color: resultatColor[a.resultat] || '#6B7280',
                    }}>
                      {a.resultat}
                    </span>
                  </div>
                  {a.notes && <div style={styles.actionNotes}>{a.notes}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  loading: { padding: '40px', textAlign: 'center', color: '#6B7280' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' },
  btnBack: { padding: '8px 16px', background: 'transparent', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#111827', margin: 0 },
  sub: { fontSize: '13px', color: '#6B7280' },
  statut: { padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginLeft: 'auto' },
  etapeBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  etapeItem: { padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  actionsBar: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  btnBlue: { padding: '10px 20px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  btnGreen: { padding: '10px 20px', background: '#4BB543', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  btnOrange: { padding: '10px 20px', background: '#F5A623', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  btnRed: { padding: '10px 20px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  btnCancel: { padding: '10px 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  col: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #F3F4F6' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F9FAFB' },
  rowLabel: { fontSize: '13px', color: '#6B7280' },
  rowValue: { fontSize: '13px', color: '#111827', fontWeight: '500' },
  modal: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: '12px', padding: '32px', width: '520px', maxWidth: '90vw' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  empty: { textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: '14px' },
  actionItem: { padding: '12px', background: '#F9FAFB', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #1A6FD4' },
  actionHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  actionType: { fontSize: '13px', fontWeight: '600', color: '#111827' },
  actionDate: { fontSize: '12px', color: '#6B7280' },
  actionResultat: { marginBottom: '4px' },
  actionNotes: { fontSize: '12px', color: '#6B7280', marginTop: '4px' },
};
