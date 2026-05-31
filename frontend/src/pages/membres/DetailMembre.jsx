import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMembre, getMembreUrl } from '../../api/membres';

export default function DetailMembre() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membre, setMembre] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMembre(id).then(res => {
      setMembre(res.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!membre) return <div style={styles.loading}>Membre introuvable.</div>;

  const statutColor = {
    ACTIF: '#4BB543', EN_ATTENTE: '#F5A623',
    SUSPENDU: '#EF4444', EXCLU: '#6B7280',
  };

  const Row = ({ label, value }) => (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value || '—'}</span>
    </div>
  );

  const DocumentCard = ({ label, url, hint }) => {
    if (!url) return null;
    const fullUrl = url.startsWith('http') ? url : `http://192.168.1.8${url}`;
    const isPdf = url.endsWith('.pdf');

    const handlePrint = () => {
      const win = window.open(fullUrl, '_blank');
      win.onload = () => win.print();
    };

    return (
      <div style={styles.docCard}>
        <div style={styles.docIcon}>{isPdf ? '📄' : '🖼️'}</div>
        <div style={styles.docInfo}>
          <div style={styles.docLabel}>{label}</div>
          {hint && <div style={styles.docHint}>{hint}</div>}
        </div>
        <div style={styles.docActions}>
          <a href={fullUrl} target="_blank" rel="noreferrer"
            style={styles.docBtn}>
            👁 Voir
          </a>
          <a href={fullUrl} download style={styles.docBtn}>
            ⬇ Télécharger
          </a>
          <button onClick={handlePrint} style={styles.docBtn}>
            🖨 Imprimer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/membres')}>
          ← Retour
        </button>
        <div>
          <h1 style={styles.title}>{membre.nom} {membre.prenom}</h1>
          <span style={styles.numero}>{membre.numero_membre}</span>
        </div>
        <span style={{
          ...styles.statut,
          background: (statutColor[membre.statut] || '#6B7280') + '20',
          color: statutColor[membre.statut] || '#6B7280',
        }}>
          {membre.statut}
        </span>
      </div>

      <div style={styles.grid}>
        {/* Colonne gauche */}
        <div style={styles.col}>

          {/* Identité */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>👤 Identité</h2>
            <Row label="Nom complet" value={`${membre.nom} ${membre.prenom}`} />
            <Row label="Sexe" value={membre.sexe === 'M' ? 'Masculin' : 'Féminin'} />
            <Row label="Date de naissance" value={membre.date_naissance} />
            <Row label="Lieu de naissance" value={membre.lieu_naissance} />
          </div>

          {/* Contact */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📞 Contact</h2>
            <Row label="Téléphone" value={membre.telephone} />
            <Row label="Adresse" value={membre.adresse} />
            <Row label="Email" value={membre.email} />
          </div>

          {/* Bénéficiaire */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>👨‍👩‍👧 Bénéficiaire</h2>
            <Row label="Nom" value={membre.beneficiaire_nom} />
            <Row label="Téléphone" value={membre.beneficiaire_telephone} />
            <Row label="Lien" value={membre.beneficiaire_lien} />
          </div>
        </div>

        {/* Colonne droite */}
        <div style={styles.col}>

          {/* Adhésion */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📋 Adhésion</h2>
            <Row label="Date d'adhésion" value={membre.date_adhesion} />
            <Row label="Frais d'adhésion" value={`${Number(membre.frais_adhesion).toLocaleString()} FCFA`} />
            <Row label="Frais payés" value={membre.frais_adhesion_paye ? '✅ Oui' : '❌ Non'} />
            <Row label="Crédit actif" value={membre.a_credit_actif ? '💳 Oui' : '—'} />
          </div>

          {/* Pièce d'identité */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🪪 Pièce d'identité</h2>
            <Row label="Type" value={membre.type_piece} />
            <Row label="Numéro" value={membre.numero_piece} />
            <Row label="Expiration" value={membre.date_expiration_piece} />
          </div>

          {/* Activité */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>💼 Activité économique</h2>
            <Row label="Profession" value={membre.profession} />
            <Row label="Secteur" value={membre.secteur_activite} />
            <Row label="Revenu mensuel estimé" value={`${Number(membre.revenu_mensuel_estime || 0).toLocaleString()} FCFA`} />
          </div>
        </div>
      </div>

      {/* Documents */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📁 Documents justificatifs</h2>
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
          <div style={styles.noDoc}>Aucun document disponible.</div>
        )}
      </div>

      {/* Notes */}
      {membre.notes && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📝 Notes</h2>
          <p style={{ color: '#374151', fontSize: '14px' }}>{membre.notes}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', background: '#F9FAFB', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  loading: { padding: '40px', textAlign: 'center', color: '#6B7280' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  btnBack: { padding: '8px 16px', background: 'transparent', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#111827', margin: 0 },
  numero: { fontSize: '13px', color: '#6B7280' },
  statut: { padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginLeft: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  col: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '0' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #F3F4F6' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F9FAFB' },
  rowLabel: { fontSize: '13px', color: '#6B7280' },
  rowValue: { fontSize: '13px', color: '#111827', fontWeight: '500', textAlign: 'right', maxWidth: '60%' },
  docCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', marginBottom: '12px' },
  docIcon: { fontSize: '28px' },
  docInfo: { flex: 1 },
  docLabel: { fontSize: '14px', fontWeight: '500', color: '#111827' },
  docHint: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
  docActions: { display: 'flex', gap: '8px' },
  docBtn: { padding: '6px 12px', background: '#1A6FD4', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', textDecoration: 'none', display: 'inline-block' },
  noDoc: { textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: '14px' },
};
