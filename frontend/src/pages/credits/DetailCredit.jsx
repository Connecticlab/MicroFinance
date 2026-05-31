import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCredit, approuverDossier, debloquerDossier, rejeterDossier, soumettreDossier } from '../../api/credits';
import api from '../../api/axios';

export default function DetailCredit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credit, setCredit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [montantAccorde, setMontantAccorde] = useState('');
  const [motifRejet, setMotifRejet] = useState('');
  const [showApprouver, setShowApprouver] = useState(false);
  const [showRejeter, setShowRejeter] = useState(false);

  const ouvrirPDF = async (url, nom) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.target = '_blank';
      link.download = nom;
      link.click();
    } catch (err) {
      alert('Erreur lors de la génération du PDF.');
    }
  };

  const fetchCredit = () => {
    getCredit(id).then(res => {
      setCredit(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchCredit(); }, [id]);

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!credit) return <div style={styles.loading}>Dossier introuvable.</div>;

  const statutColor = {
    BROUILLON: '#6B7280', SOUMIS: '#1A6FD4', EN_ETUDE: '#F5A623',
    APPROUVE: '#4BB543', REJETE: '#EF4444', DEBLOQUE: '#4BB543',
    EN_COURS: '#1A6FD4', SOLDE: '#6B7280', EN_DEFAUT: '#EF4444',
  };

  const handleApprouver = async () => {
    if (!montantAccorde) return;
    await approuverDossier(id, { montant_accorde: montantAccorde });
    setShowApprouver(false);
    fetchCredit();
  };

  const handleDebloquer = async () => {
    if (window.confirm('Confirmer le déblocage du crédit ?')) {
      await debloquerDossier(id);
      fetchCredit();
    }
  };

  const handleRejeter = async () => {
    await rejeterDossier(id, { motif: motifRejet });
    setShowRejeter(false);
    fetchCredit();
  };

  const handleSoumettre = async () => {
    await soumettreDossier(id);
    fetchCredit();
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
        <button style={styles.btnBack} onClick={() => navigate('/credits')}>← Retour</button>
        <div>
          <h1 style={styles.title}>{credit.numero_dossier}</h1>
          <div style={styles.sub}>{credit.membre_detail?.nom_complet}</div>
        </div>
        <span style={{
          ...styles.statut,
          background: (statutColor[credit.statut] || '#6B7280') + '20',
          color: statutColor[credit.statut] || '#6B7280',
        }}>
          {credit.statut}
        </span>
      </div>

      {/* Actions workflow */}
      <div style={styles.actionsBar}>
        {credit.statut === 'BROUILLON' && (
          <button style={styles.btnBlue} onClick={handleSoumettre}>📤 Soumettre</button>
        )}
        {['SOUMIS', 'EN_ETUDE'].includes(credit.statut) && (
          <>
            <button style={styles.btnGreen} onClick={() => setShowApprouver(true)}>
              ✅ Approuver
            </button>
            <button style={styles.btnRed} onClick={() => setShowRejeter(true)}>
              ❌ Rejeter
            </button>
          </>
        )}
        {['APPROUVE', 'EN_COURS', 'SOLDE', 'DEBLOQUE'].includes(credit.statut) && (
        <button style={styles.btnBlue}
          onClick={() => ouvrirPDF(`/credits/${id}/contrat_pdf/`, `Contrat_${credit.numero_dossier}.pdf`)}>
          📄 Contrat PDF
        </button>
      )}
      {['EN_COURS', 'SOLDE', 'DEBLOQUE'].includes(credit.statut) && (
        <button style={{...styles.btnBlue, background: '#4BB543'}}
          onClick={() => ouvrirPDF(`/credits/${id}/recu_pdf/`, `Recu_${credit.numero_dossier}.pdf`)}>
          🧾 Reçu de déblocage
        </button>
      )}
      {credit.statut === 'APPROUVE' && (
          <button style={styles.btnGreen} onClick={handleDebloquer}>
            🚀 Débloquer le crédit
          </button>
        )}
      </div>

      {/* Modal Approbation */}
      {showApprouver && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>Approuver le dossier</h3>
            <p style={styles.modalSub}>Montant demandé : {Number(credit.montant_demande).toLocaleString()} FCFA</p>
            <div style={styles.field}>
              <label style={styles.label}>Montant accordé (FCFA) *</label>
              <input type="number" value={montantAccorde}
                onChange={e => setMontantAccorde(e.target.value)}
                style={styles.input} placeholder="Entrez le montant accordé" />
            </div>
            {montantAccorde > 0 && (
              <div style={styles.simRow}>
                <span>FRG (1/6) : <strong>{Math.round(montantAccorde / 6).toLocaleString()} FCFA</strong></span>
                <span>Net débloqué : <strong>{Math.round(montantAccorde - montantAccorde / 6).toLocaleString()} FCFA</strong></span>
              </div>
            )}
            <div style={styles.modalActions}>
              <button style={styles.btnCancel} onClick={() => setShowApprouver(false)}>Annuler</button>
              <button style={styles.btnGreen} onClick={handleApprouver}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejet */}
      {showRejeter && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>Rejeter le dossier</h3>
            <div style={styles.field}>
              <label style={styles.label}>Motif du rejet</label>
              <textarea value={motifRejet} onChange={e => setMotifRejet(e.target.value)}
                style={{ ...styles.input, minHeight: '80px' }}
                placeholder="Expliquez le motif du rejet..." />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnCancel} onClick={() => setShowRejeter(false)}>Annuler</button>
              <button style={styles.btnRed} onClick={handleRejeter}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {/* Colonne gauche */}
        <div style={styles.col}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>👤 Membre</h2>
            <Row label="Nom complet" value={credit.membre_detail?.nom_complet} />
            <Row label="Téléphone" value={credit.membre_detail?.telephone} />
            <Row label="Numéro membre" value={credit.membre_detail?.numero_membre} />
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📋 Conditions</h2>
            <Row label="Fréquence" value={credit.frequence_remboursement} />
            <Row label="Nombre d'échéances" value={credit.nombre_echeances} />
            <Row label="Mode de déblocage" value={credit.mode_deblocage} />
            <Row label="Date soumission" value={credit.date_soumission} />
            <Row label="Date approbation" value={credit.date_approbation} />
            <Row label="Date déblocage" value={credit.date_deblocage} />
            <Row label="Échéance finale" value={credit.date_echeance_finale} />
          </div>
        </div>

        {/* Colonne droite */}
        <div style={styles.col}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>💰 Montants</h2>
            <Row label="Montant demandé" value={`${Number(credit.montant_demande || 0).toLocaleString()} FCFA`} />
            <Row label="Montant accordé" value={credit.montant_accorde ? `${Number(credit.montant_accorde).toLocaleString()} FCFA` : '—'} />
            <Row label="FRG (1/6)" value={credit.frg ? `${Number(credit.frg).toLocaleString()} FCFA` : '—'} />
            <Row label="Montant net débloqué" value={credit.montant_net_debloque ? `${Number(credit.montant_net_debloque).toLocaleString()} FCFA` : '—'} />
            <Row label="Montant remboursé" value={`${Number(credit.montant_rembourse || 0).toLocaleString()} FCFA`} />
            <Row label="Montant restant" value={`${Number(credit.montant_restant || 0).toLocaleString()} FCFA`} />
            <Row label="Pénalités" value={`${Number(credit.penalites_total || 0).toLocaleString()} FCFA`} />
          </div>

          {/* Échéancier */}
          {credit.echeancier && credit.echeancier.length > 0 && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📅 Échéancier</h2>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>N°</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Montant</th>
                    <th style={styles.th}>Payé</th>
                    <th style={styles.th}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {credit.echeancier.map(e => (
                    <tr key={e.id} style={styles.tr}>
                      <td style={styles.td}>{e.numero_echeance}</td>
                      <td style={styles.td}>{e.date_echeance}</td>
                      <td style={styles.td}>{Number(e.montant_echeance).toLocaleString()}</td>
                      <td style={styles.td}>{Number(e.montant_paye).toLocaleString()}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                          background: e.statut === 'PAYE' ? '#F0FDF4' : e.statut === 'EN_RETARD' ? '#FEF2F2' : '#F9FAFB',
                          color: e.statut === 'PAYE' ? '#4BB543' : e.statut === 'EN_RETARD' ? '#EF4444' : '#6B7280',
                        }}>
                          {e.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {credit.notes && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📝 Notes</h2>
          <p style={{ color: '#374151', fontSize: '14px' }}>{credit.notes}</p>
        </div>
      )}
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
  actionsBar: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  btnBlue: { padding: '10px 20px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  btnGreen: { padding: '10px 20px', background: '#4BB543', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  btnRed: { padding: '10px 20px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  btnCancel: { padding: '10px 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  col: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #F3F4F6' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F9FAFB' },
  rowLabel: { fontSize: '13px', color: '#6B7280' },
  rowValue: { fontSize: '13px', color: '#111827', fontWeight: '500', textAlign: 'right' },
  modal: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: '12px', padding: '32px', width: '480px', maxWidth: '90vw' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' },
  modalSub: { fontSize: '14px', color: '#6B7280', marginBottom: '16px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' },
  simRow: { display: 'flex', gap: '16px', padding: '12px', background: '#F0FDF4', borderRadius: '8px', fontSize: '13px', marginTop: '8px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F3F4F6' },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' },
  tr: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '8px 12px', fontSize: '12px', color: '#374151' },
};
