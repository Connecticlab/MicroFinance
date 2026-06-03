import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMembre } from '../../api/membres';
import api from '../../api/axios';

const statutConfig = {
  ACTIF:      { label: 'Actif',      bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  EN_ATTENTE: { label: 'En attente', bg: '#FFFBEB', color: '#F59E0B', border: '#FDE68A' },
  SUSPENDU:   { label: 'Suspendu',   bg: '#FEF2F2', color: '#EF4444', border: '#FECACA' },
  EXCLU:      { label: 'Exclu',      bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
};

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconId = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);
const IconWork = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconDoc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IconClip = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
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

function Row({ label, value, highlight }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={{ ...styles.rowValue, color: highlight || '#111827' }}>{value || '—'}</span>
    </div>
  );
}

function DocumentCard({ label, url, hint }) {
  if (!url) return null;
  const fullUrl = url.startsWith('http') ? url : `http://192.168.1.8${url}`;
  const isPdf = url.toLowerCase().endsWith('.pdf');
  const handlePrint = () => { const win = window.open(fullUrl, '_blank'); win.onload = () => win.print(); };

  return (
    <div style={styles.docCard}>
      <div style={{ ...styles.docIconBox, background: isPdf ? '#FEF2F2' : '#EFF6FF', color: isPdf ? '#EF4444' : '#1A6FD4' }}>
        {isPdf ? '📄' : '🖼️'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{label}</div>
        {hint && <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{hint}</div>}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <a href={fullUrl} target="_blank" rel="noreferrer" style={styles.docBtnBlue}>👁 Voir</a>
        <a href={fullUrl} download style={styles.docBtnGreen}>⬇ Télécharger</a>
        <button onClick={handlePrint} style={styles.docBtnGray}>🖨 Imprimer</button>
      </div>
    </div>
  );
}

export default function DetailMembre() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membre, setMembre] = useState(null);
  const [loading, setLoading] = useState(true);

  const telechargerRecuAdhesion = async () => {
    try {
      const res = await api.get(`/membres/${id}/recu_adhesion_pdf/`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.target = '_blank';
      link.click();
    } catch (err) { alert('Erreur lors de la génération du reçu.'); }
  };

  useEffect(() => {
    getMembre(id).then(res => { setMembre(res.data); setLoading(false); });
  }, [id]);

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!membre) return <div style={styles.loading}>Membre introuvable.</div>;

  const sc = statutConfig[membre.statut] || statutConfig.EXCLU;
  const initiale = (membre.prenom || membre.nom || '?').charAt(0).toUpperCase();
  const avatarColors = ['#1A6FD4','#9333EA','#16A34A','#F59E0B','#EF4444','#06B6D4'];
  const avatarColor = avatarColors[(membre.nom || '').charCodeAt(0) % avatarColors.length];

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.pageHeader}>
        <button style={styles.btnBack} onClick={() => navigate('/membres')}>← Retour</button>

        {/* Hero membre */}
        <div style={styles.heroCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            <div style={{ ...styles.heroAvatar, background: avatarColor }}>
              {initiale}
            </div>
            <div>
              <h1 style={styles.heroName}>{membre.prenom} {membre.nom}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={styles.heroNumero}>{membre.numero_membre}</span>
                <span style={{ color: '#CBD5E1', fontSize: '12px' }}>·</span>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                  Adhésion le {membre.date_adhesion || '—'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ ...styles.statutBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
              ● {sc.label}
            </span>
            {membre.frais_adhesion_paye && (
              <button style={styles.btnRecu} onClick={telechargerRecuAdhesion}>
                🧾 Reçu d'adhésion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPIs rapides */}
      <div style={styles.kpiGrid}>
        {[
          { label: 'Frais d\'adhésion', value: `${Number(membre.frais_adhesion || 0).toLocaleString()} FCFA`, color: '#1A6FD4', ok: true },
          { label: 'Frais payés', value: membre.frais_adhesion_paye ? '✓ Oui' : '✗ Non', color: membre.frais_adhesion_paye ? '#16A34A' : '#EF4444', ok: membre.frais_adhesion_paye },
          { label: 'Crédit actif', value: membre.a_credit_actif ? '💳 En cours' : 'Aucun', color: membre.a_credit_actif ? '#F59E0B' : '#16A34A', ok: !membre.a_credit_actif },
          { label: 'Éligible au crédit', value: membre.eligible_credit ? '✓ Oui' : '✗ Non', color: membre.eligible_credit ? '#16A34A' : '#EF4444', ok: membre.eligible_credit },
        ].map(k => (
          <div key={k.label} style={styles.kpiCard}>
            <div style={styles.kpiLabel}>{k.label}</div>
            <div style={{ ...styles.kpiValue, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Grille infos */}
      <div style={styles.grid}>
        <div style={styles.col}>
          <InfoCard icon={<IconUser />} title="Identité" color="#1A6FD4">
            <Row label="Nom complet" value={`${membre.prenom} ${membre.nom}`} />
            <Row label="Sexe" value={membre.sexe === 'M' ? 'Masculin' : 'Féminin'} />
            <Row label="Date de naissance" value={formatDate(membre.date_naissance)} />
            <Row label="Lieu de naissance" value={membre.lieu_naissance} />
          </InfoCard>

          <InfoCard icon={<IconPhone />} title="Contact" color="#06B6D4">
            <Row label="Téléphone" value={membre.telephone} />
            <Row label="Adresse" value={membre.adresse} />
            <Row label="Email" value={membre.email} />
          </InfoCard>

          <InfoCard icon={<IconHeart />} title="Bénéficiaire / Personne à contacter" color="#EF4444">
            <Row label="Nom" value={membre.beneficiaire_nom} />
            <Row label="Téléphone" value={membre.beneficiaire_telephone} />
            <Row label="Lien de parenté" value={membre.beneficiaire_lien} />
          </InfoCard>
        </div>

        <div style={styles.col}>
          <InfoCard icon={<IconId />} title="Pièce d'identité" color="#7C3AED">
            <Row label="Type" value={membre.type_piece} />
            <Row label="Numéro" value={membre.numero_piece} />
            <Row label="Date d'expiration" value={formatDate(membre.date_expiration_piece)} />
          </InfoCard>

          <InfoCard icon={<IconWork />} title="Activité économique" color="#F59E0B">
            <Row label="Profession" value={membre.profession} />
            <Row label="Secteur d'activité" value={membre.secteur_activite} />
            <Row label="Revenu mensuel estimé" value={`${Number(membre.revenu_mensuel_estime || 0).toLocaleString()} FCFA`} />
          </InfoCard>

          {membre.notes && (
            <InfoCard icon={<IconClip />} title="Notes" color="#6B7280">
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{membre.notes}</p>
            </InfoCard>
          )}
        </div>
      </div>

      {/* Documents */}
      <InfoCard icon={<IconDoc />} title="Documents justificatifs" color="#16A34A">
        <DocumentCard
          label="Copie pièce d'identité légalisée"
          url={membre.copie_piece_identite}
          hint="CNI, Passeport ou Permis"
        />
        <DocumentCard
          label="Justificatif de domicile"
          url={membre.justificatif_domicile}
          hint="Certificat de résidence, facture d'eau ou d'électricité"
        />
        {!membre.copie_piece_identite && !membre.justificatif_domicile && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '14px' }}>
            Aucun document disponible.
          </div>
        )}
      </InfoCard>

    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  loading: { padding: '40px', textAlign: 'center', color: '#6B7280' },
  pageHeader: { marginBottom: '24px' },
  btnBack: { padding: '8px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151', fontWeight: '500', marginBottom: '16px', display: 'inline-block' },
  heroCard: { background: 'linear-gradient(135deg, #1E3A5F 0%, #1A6FD4 100%)', borderRadius: '14px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: '0 4px 20px rgba(26,111,212,0.3)' },
  heroAvatar: { width: '64px', height: '64px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '800', border: '3px solid rgba(255,255,255,0.3)', flexShrink: 0 },
  heroName: { fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 },
  heroNumero: { fontSize: '13px', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '99px' },
  statutBadge: { padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600' },
  btnRecu: { padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  kpiCard: { background: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  kpiLabel: { fontSize: '12px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' },
  kpiValue: { fontSize: '16px', fontWeight: '700' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  col: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '0' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' },
  cardIcon: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 },
  cardBody: { padding: '12px 20px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F9FAFB' },
  rowLabel: { fontSize: '13px', color: '#6B7280' },
  rowValue: { fontSize: '13px', fontWeight: '600', textAlign: 'right', maxWidth: '60%' },
  docCard: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#F8FAFC', borderRadius: '10px', marginBottom: '10px', border: '1px solid #F1F5F9' },
  docIconBox: { width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
  docBtnBlue: { padding: '6px 12px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' },
  docBtnGreen: { padding: '6px 12px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' },
  docBtnGray: { padding: '6px 12px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
};
