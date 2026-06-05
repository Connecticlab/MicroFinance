import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCredit, approuverDossier, debloquerDossier, rejeterDossier, soumettreDossier } from '../../api/credits';
import api from '../../api/axios';
import { usePermissions } from '../../store/authStore';
import { formatDate } from '../../utils/date';

const statutConfig = {
  BROUILLON:  { label: 'Brouillon',   bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  SOUMIS:     { label: 'Soumis',      bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  EN_ETUDE:   { label: 'En étude',    bg: '#FFFBEB', color: '#F59E0B', border: '#FDE68A' },
  APPROUVE:   { label: 'Approuvé',    bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  REJETE:     { label: 'Rejeté',      bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  DEBLOQUE:   { label: 'Débloqué',    bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  EN_COURS:   { label: 'En cours',    bg: '#EFF6FF', color: '#1A6FD4', border: '#BFDBFE' },
  SOLDE:      { label: 'Soldé',       bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  EN_DEFAUT:  { label: 'En défaut',   bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

const echeanceStatut = {
  PAYE:             { bg: '#F0FDF4', color: '#16A34A' },
  EN_RETARD:        { bg: '#FEF2F2', color: '#DC2626' },
  EN_ATTENTE:       { bg: '#F3F4F6', color: '#6B7280' },
  PARTIELLEMENT_PAYE:{ bg: '#FFFBEB', color: '#F59E0B' },
};

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMoney = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconCal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
  </svg>
);

function InfoCard({ icon, title, color, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ ...styles.cardIcon, background: color + '15', color }}>{icon}</div>
        <h2 style={styles.cardTitle}>{title}</h2>
      </div>
      <div style={styles.cardBody}>{children}</div>
    </div>
  );
}

function Row({ label, value, highlight, bold }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={{ ...styles.rowValue, color: highlight || '#111827', fontWeight: bold ? '700' : '500' }}>{value || '—'}</span>
    </div>
  );
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={styles.overlay}>
      <div style={styles.modalBox}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button style={styles.btnClose} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DetailCredit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credit, setCredit] = useState(null);
  const [loading, setLoading] = useState(true);
  const perms = usePermissions();
  const [montantAccorde, setMontantAccorde] = useState('');
  const [motifRejet, setMotifRejet] = useState('');
  const [showApprouver, setShowApprouver] = useState(false);
  const [showRejeter, setShowRejeter] = useState(false);
  const [showFRG, setShowFRG] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ notes: '', mode_deblocage: 'ESPECES' });
  const [modeFRG, setModeFRG] = useState('ESPECES');

  const ouvrirPDF = async (url, nom) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.target = '_blank';
      link.download = nom;
      link.click();
    } catch (err) { alert('Erreur lors de la génération du PDF.'); }
  };

  const fetchCredit = () => {
    getCredit(id).then(res => { setCredit(res.data); setLoading(false); });
  };

  useEffect(() => { fetchCredit(); }, [id]);

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!credit) return <div style={styles.loading}>Dossier introuvable.</div>;

  const sc = statutConfig[credit.statut] || statutConfig.BROUILLON;
  const montantAccorde_ = Number(credit.montant_accorde || 0);
  const montantRembourse = Number(credit.montant_rembourse || 0);
  const montantRestant = Number(credit.montant_restant || 0);
  const progression = montantAccorde_ > 0 ? Math.round((montantRembourse / montantAccorde_) * 100) : 0;

  const handleApprouver = async () => {
    if (!montantAccorde) return;
    await approuverDossier(id, { montant_accorde: montantAccorde });
    setShowApprouver(false); fetchCredit();
  };
  const handleDebloquer = async () => {
    if (window.confirm('Confirmer le déblocage du crédit ?')) { await debloquerDossier(id); fetchCredit(); }
  };
  const handleRejeter = async () => {
    await rejeterDossier(id, { motif: motifRejet });
    setShowRejeter(false); fetchCredit();
  };
  const handleVerserFRG = async () => {
    try {
      await api.post(`/credits/${id}/verser_frg/`, { mode_versement: modeFRG });
      setShowFRG(false); fetchCredit();
    } catch (err) { alert(err.response?.data?.error || 'Erreur lors du versement.'); }
  };
  const handleSoumettre = async () => { await soumettreDossier(id); fetchCredit(); };

  const handleOpenEdit = () => {
    setEditForm({ notes: credit.notes || '', mode_deblocage: credit.mode_deblocage || 'ESPECES' });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.patch(`/credits/${id}/`, editForm);
      setShowEdit(false);
      fetchCredit();
    } catch (err) { alert('Erreur lors de la modification.'); }
  };

  const nbPaye = credit.echeancier?.filter(e => e.statut === 'PAYE').length || 0;
  const nbTotal = credit.echeancier?.length || 0;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.pageHeader}>
        <button style={styles.btnBack} onClick={() => navigate('/credits')}>← Retour</button>

        {/* Hero */}
        <div style={styles.heroCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, flexWrap: 'wrap' }}>
            <div style={styles.heroIcon}>💳</div>
            <div>
              <h1 style={styles.heroTitle}>{credit.numero_dossier}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={styles.heroMembre}>{credit.membre_detail?.nom_complet}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  {credit.frequence_remboursement}
                </span>
              </div>
            </div>
          </div>
          <span style={{ ...styles.statutBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
            ● {sc.label}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Montant accordé</div>
          <div style={{ ...styles.kpiValue, color: '#1A6FD4' }}>{montantAccorde_.toLocaleString()} F</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>FRG (1/6)</div>
          <div style={{ ...styles.kpiValue, color: credit.frg_verse ? '#16A34A' : '#F59E0B' }}>
            {Number(credit.frg || 0).toLocaleString()} F
          </div>
          <div style={{ fontSize: '11px', color: credit.frg_verse ? '#16A34A' : '#F59E0B', marginTop: '2px' }}>
            {credit.frg_verse ? '✓ Versé' : '⚠ Non versé'}
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Remboursé</div>
          <div style={{ ...styles.kpiValue, color: '#16A34A' }}>{montantRembourse.toLocaleString()} F</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Restant</div>
          <div style={{ ...styles.kpiValue, color: '#EF4444' }}>{montantRestant.toLocaleString()} F</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Progression</div>
          <div style={{ ...styles.kpiValue, color: '#7C3AED' }}>{progression}%</div>
          <div style={{ background: '#F3F4F6', borderRadius: '99px', height: '4px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${progression}%`, height: '100%', background: '#7C3AED', borderRadius: '99px' }} />
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Échéances</div>
          <div style={{ ...styles.kpiValue, color: '#111827' }}>{nbPaye}/{nbTotal}</div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>payées</div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div style={styles.actionsBar}>
        {credit.statut === 'BROUILLON' && (
          <button style={styles.btnBlue} onClick={handleSoumettre}>📤 Soumettre</button>
        )}
        {['SOUMIS', 'EN_ETUDE'].includes(credit.statut) && perms.peutApprouverCredit && (
          <>
            <button style={styles.btnGreen} onClick={() => setShowApprouver(true)}>✅ Approuver</button>
            <button style={styles.btnRed} onClick={() => setShowRejeter(true)}>✕ Rejeter</button>
          </>
        )}
        {['APPROUVE', 'EN_COURS', 'DEBLOQUE', 'SOLDE'].includes(credit.statut) && !credit.frg_verse && perms.peutApprouverCredit && (
          <button style={styles.btnOrange} onClick={() => setShowFRG(true)}>💰 Verser le FRG</button>
        )}
        {['APPROUVE', 'EN_COURS', 'SOLDE', 'DEBLOQUE'].includes(credit.statut) && (
          <button style={styles.btnGhost} onClick={() => ouvrirPDF(`/credits/${id}/contrat_pdf/`, `Contrat_${credit.numero_dossier}.pdf`)}>
            📄 Contrat PDF
          </button>
        )}
        {['EN_COURS', 'SOLDE', 'DEBLOQUE'].includes(credit.statut) && (
          <button style={styles.btnGhost} onClick={() => ouvrirPDF(`/credits/${id}/recu_pdf/`, `Recu_${credit.numero_dossier}.pdf`)}>
            🧾 Reçu déblocage
          </button>
        )}
        <button style={styles.btnGhost} onClick={handleOpenEdit}>✏ Modifier notes</button>
        {credit.statut === 'APPROUVE' && perms.peutDebloquerCredit && (
          <button
            style={{ ...styles.btnGreen, opacity: credit.frg_verse ? 1 : 0.5, cursor: credit.frg_verse ? 'pointer' : 'not-allowed' }}
            onClick={() => credit.frg_verse ? handleDebloquer() : alert('⚠️ Le FRG doit être versé avant le déblocage.')}>
            🚀 {credit.frg_verse ? 'Débloquer le crédit' : 'Débloquer (FRG requis)'}
          </button>
        )}
      </div>

      {/* Modal édition */}
      <Modal show={showEdit} onClose={() => setShowEdit(false)} title="Modifier le dossier">
        <div style={styles.field}>
          <label style={styles.label}>Mode de déblocage</label>
          <select value={editForm.mode_deblocage} onChange={e => setEditForm({...editForm, mode_deblocage: e.target.value})} style={styles.input}
            disabled={['DEBLOQUE', 'EN_COURS', 'SOLDE'].includes(credit.statut)}>
            <option value="ESPECES">💵 Espèces</option>
            <option value="MOBILE_MONEY">📱 Mobile Money</option>
            <option value="VIREMENT">🏦 Virement bancaire</option>
          </select>
        </div>
        <div style={{ ...styles.field, marginTop: '12px' }}>
          <label style={styles.label}>Notes et observations</label>
          <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})}
            style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
            placeholder="Observations, motif de la demande..." />
        </div>
        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={() => setShowEdit(false)}>Annuler</button>
          <button style={styles.btnGreen} onClick={handleSaveEdit}>✅ Enregistrer</button>
        </div>
      </Modal>

      {/* Modals */}
      <Modal show={showApprouver} onClose={() => setShowApprouver(false)} title="Approuver le dossier">
        <p style={styles.modalSub}>Montant demandé : <strong>{Number(credit.montant_demande).toLocaleString()} FCFA</strong></p>
        <div style={styles.field}>
          <label style={styles.label}>Montant accordé (FCFA) *</label>
          <input type="number" value={montantAccorde} onChange={e => setMontantAccorde(e.target.value)}
            style={styles.input} placeholder="Ex: 100000" />
        </div>
        {montantAccorde > 0 && (
          <div style={styles.simRow}>
            <div><div style={styles.kpiLabel}>FRG (1/6)</div><div style={{ fontWeight: '700', color: '#F59E0B' }}>{Math.round(montantAccorde / 6).toLocaleString()} FCFA</div></div>
            <div><div style={styles.kpiLabel}>Montant net</div><div style={{ fontWeight: '700', color: '#16A34A' }}>{Number(montantAccorde).toLocaleString()} FCFA</div></div>
          </div>
        )}
        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={() => setShowApprouver(false)}>Annuler</button>
          <button style={styles.btnGreen} onClick={handleApprouver}>✅ Confirmer</button>
        </div>
      </Modal>

      <Modal show={showRejeter} onClose={() => setShowRejeter(false)} title="Rejeter le dossier">
        <div style={styles.field}>
          <label style={styles.label}>Motif du rejet</label>
          <textarea value={motifRejet} onChange={e => setMotifRejet(e.target.value)}
            style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            placeholder="Expliquez le motif du rejet..." />
        </div>
        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={() => setShowRejeter(false)}>Annuler</button>
          <button style={styles.btnRed} onClick={handleRejeter}>✕ Confirmer le rejet</button>
        </div>
      </Modal>

      <Modal show={showFRG} onClose={() => setShowFRG(false)} title="Verser le Fonds de Risques et de Garantie">
        <div style={styles.frgBox}>
          <div style={styles.kpiLabel}>Montant à verser</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#F59E0B' }}>
            {Number(credit.frg).toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>
            Ce montant est conservé définitivement par la microfinance
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Mode de versement</label>
          <select value={modeFRG} onChange={e => setModeFRG(e.target.value)} style={styles.input}>
            <option value="ESPECES">💵 Espèces</option>
            <option value="MOBILE_MONEY">📱 Mobile Money</option>
          </select>
        </div>
        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={() => setShowFRG(false)}>Annuler</button>
          <button style={styles.btnGreen} onClick={handleVerserFRG}>✅ Confirmer le versement</button>
        </div>
      </Modal>

      {/* Contenu */}
      <div style={styles.grid}>
        <div style={styles.col}>
          <InfoCard icon={<IconUser />} title="Membre" color="#1A6FD4">
            <Row label="Nom complet" value={credit.membre_detail?.nom_complet} bold />
            <Row label="Téléphone" value={credit.membre_detail?.telephone} />
            <Row label="Numéro membre" value={credit.membre_detail?.numero_membre} />
          </InfoCard>

          <InfoCard icon={<IconSettings />} title="Conditions du crédit" color="#7C3AED">
            <Row label="Fréquence" value={credit.frequence_remboursement} />
            <Row label="Nombre d'échéances" value={credit.nombre_echeances} />
            <Row label="Mode de déblocage" value={credit.mode_deblocage} />
            <Row label="Date soumission" value={formatDate(credit.date_soumission)} />
            <Row label="Date approbation" value={formatDate(credit.date_approbation)} />
            <Row label="Date déblocage" value={formatDate(credit.date_deblocage)} />
            <Row label="Échéance finale" value={formatDate(credit.date_echeance_finale)} />
          </InfoCard>
        </div>

        <div style={styles.col}>
          <InfoCard icon={<IconMoney />} title="Montants" color="#16A34A">
            <Row label="Montant demandé" value={`${Number(credit.montant_demande || 0).toLocaleString()} FCFA`} />
            <Row label="Montant accordé" value={credit.montant_accorde ? `${Number(credit.montant_accorde).toLocaleString()} FCFA` : '—'} highlight="#1A6FD4" bold />
            <Row label="FRG (1/6)" value={credit.frg ? `${Number(credit.frg).toLocaleString()} FCFA` : '—'} highlight="#F59E0B" />
            <Row label="Montant remboursé" value={`${Number(credit.montant_rembourse || 0).toLocaleString()} FCFA`} highlight="#16A34A" />
            <Row label="Montant restant" value={`${Number(credit.montant_restant || 0).toLocaleString()} FCFA`} highlight="#EF4444" bold />
            <Row label="Pénalités" value={`${Number(credit.penalites_total || 0).toLocaleString()} FCFA`} highlight={credit.penalites_total > 0 ? '#EF4444' : '#6B7280'} />
            <div style={{
              marginTop: '12px', padding: '12px 14px', borderRadius: '8px',
              background: credit.frg_verse ? '#F0FDF4' : '#FFFBEB',
              border: `1px solid ${credit.frg_verse ? '#BBF7D0' : '#FDE68A'}`
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: credit.frg_verse ? '#16A34A' : '#F59E0B' }}>
                {credit.frg_verse ? '✓ FRG versé' : '⚠ FRG non encore versé'}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                {credit.frg_verse ? `Le ${formatDate(credit.frg_date_versement)}` : `À verser : ${Number(credit.frg || 0).toLocaleString()} FCFA`}
              </div>
            </div>
          </InfoCard>

          {credit.notes && (
            <InfoCard icon={<IconSettings />} title="Notes" color="#6B7280">
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{credit.notes}</p>
            </InfoCard>
          )}
        </div>
      </div>

      {/* Échéancier */}
      {credit.echeancier && credit.echeancier.length > 0 && (
        <InfoCard icon={<IconCal />} title={`Échéancier — ${nbPaye}/${nbTotal} échéances payées`} color="#1A6FD4">
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>N°</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Montant</th>
                  <th style={styles.th}>Payé</th>
                  <th style={styles.th}>Pénalité</th>
                  <th style={styles.th}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {credit.echeancier.map((e, i) => {
                  const es = echeanceStatut[e.statut] || { bg: '#F3F4F6', color: '#6B7280' };
                  return (
                    <tr key={e.id} style={{ ...styles.tr, background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={styles.td}><span style={{ fontWeight: '700', color: '#111827' }}>#{e.numero_echeance}</span></td>
                      <td style={styles.td}><span style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(e.date_echeance)}</span></td>
                      <td style={styles.td}><span style={{ fontWeight: '600' }}>{Number(e.montant_echeance).toLocaleString()} F</span></td>
                      <td style={styles.td}><span style={{ color: '#16A34A', fontWeight: '600' }}>{Number(e.montant_paye).toLocaleString()} F</span></td>
                      <td style={styles.td}>
                        <span style={{ color: e.penalite > 0 ? '#EF4444' : '#9CA3AF', fontSize: '12px' }}>
                          {e.penalite > 0 ? `⚠ ${Number(e.penalite).toLocaleString()} F` : '—'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', background: es.bg, color: es.color }}>
                          {e.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </InfoCard>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  loading: { padding: '40px', textAlign: 'center', color: '#6B7280' },
  pageHeader: { marginBottom: '24px' },
  btnBack: { padding: '8px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151', fontWeight: '500', marginBottom: '16px', display: 'inline-block' },
  heroCard: { background: 'linear-gradient(135deg, #1E3A5F 0%, #1A6FD4 100%)', borderRadius: '14px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: '0 4px 20px rgba(26,111,212,0.3)' },
  heroIcon: { fontSize: '40px', width: '64px', height: '64px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroTitle: { fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 },
  heroMembre: { fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  statutBadge: { padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600', flexShrink: 0 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' },
  kpiCard: { background: '#fff', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  kpiLabel: { fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600', marginBottom: '6px' },
  kpiValue: { fontSize: '16px', fontWeight: '800', color: '#111827' },
  actionsBar: { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', background: '#fff', padding: '16px 20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  btnBlue:   { padding: '9px 18px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnGreen:  { padding: '9px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnRed:    { padding: '9px 18px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnOrange: { padding: '9px 18px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnGhost:  { padding: '9px 18px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnCancel: { padding: '9px 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: '12px', padding: '28px', width: '480px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  modalTitle: { fontSize: '17px', fontWeight: 'bold', color: '#111827', margin: 0 },
  btnClose: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' },
  modalSub: { fontSize: '14px', color: '#6B7280', marginBottom: '12px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' },
  simRow: { display: 'flex', gap: '20px', padding: '14px', background: '#F0FDF4', borderRadius: '8px', marginTop: '12px' },
  frgBox: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '16px', marginBottom: '16px', textAlign: 'center' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  col: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' },
  cardIcon: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 },
  cardBody: { padding: '12px 20px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F9FAFB' },
  rowLabel: { fontSize: '13px', color: '#6B7280' },
  rowValue: { fontSize: '13px', textAlign: 'right', maxWidth: '60%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F8FAFC' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '10px 14px', fontSize: '13px', color: '#374151', verticalAlign: 'middle' },
};
