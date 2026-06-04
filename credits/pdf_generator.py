from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from io import BytesIO
from datetime import date
import os

def get_logo_path():
    try:
        from core.models import Configuration
        config = Configuration.get()
        if config.logo:
            return config.logo.path
    except:
        pass
    return None

def build_header(nom_structure, titre, adresse_structure, telephone_structure):
    logo_path = get_logo_path()
    from reportlab.platypus import Table, TableStyle, Image, Paragraph, HRFlowable
    from reportlab.lib.units import cm
    elements = []
    if logo_path and os.path.exists(logo_path):
        header_data = [[
            Image(logo_path, width=4*cm, height=2*cm),
            Paragraph(
                f"<b>{nom_structure}</b><br/>"
                f"<font color='#1A6FD4' size=13>{titre}</font><br/>"
                f"<font size=8 color='#6B7280'>{adresse_structure} | Tél : {telephone_structure}</font>",
                ParagraphStyle("h", fontSize=14, fontName="Helvetica-Bold",
                               textColor=BLEU_FONCE, alignment=TA_LEFT, leading=22, spaceAfter=4)
            )
        ]]
        ht = Table(header_data, colWidths=[4.5*cm, 12.5*cm])
        ht.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (0,0), 0),
        ]))
        elements.append(ht)
    else:
        elements.append(Paragraph(nom_structure, ParagraphStyle(
            "T", fontSize=18, fontName="Helvetica-Bold",
            textColor=BLEU_FONCE, alignment=TA_CENTER, spaceBefore=28, spaceAfter=14
        )))
        elements.append(Paragraph(titre, ParagraphStyle(
            "ST", fontSize=13, fontName="Helvetica-Bold",
            textColor=BLEU_CTL, alignment=TA_CENTER, spaceAfter=14
        )))
        elements.append(Paragraph(
            f"{adresse_structure} | Tél : {telephone_structure}",
            ParagraphStyle("sub", fontSize=8, textColor=GRIS_TEXTE,
                           fontName="Helvetica", alignment=TA_CENTER)
        ))
    elements.append(HRFlowable(width="100%", thickness=2, color=BLEU_CTL, spaceAfter=16))
    return elements

def fmt_date(d):
    if not d:
        return '—'
    if hasattr(d, 'strftime'):
        return d.strftime('%d/%m/%Y')
    parts = str(d).split('-')
    if len(parts) == 3:
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return str(d)

# Couleurs CTL
BLEU_FONCE = colors.HexColor('#111827')
BLEU_CTL = colors.HexColor('#1A6FD4')
ORANGE_CTL = colors.HexColor('#F5A623')
VERT_CTL = colors.HexColor('#4BB543')
GRIS_CLAIR = colors.HexColor('#F3F4F6')
GRIS_TEXTE = colors.HexColor('#6B7280')


def generer_contrat_credit(dossier):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title=f"Contrat de Crédit {dossier.numero_dossier}",
    )

    styles = getSampleStyleSheet()
    elements = []

    # Style personnalisés
    titre_style = ParagraphStyle(
        'TitreDoc', fontSize=16, textColor=BLEU_FONCE,
        fontName='Helvetica-Bold', alignment=TA_CENTER, spaceBefore=28, spaceAfter=14
    )
    sous_titre_style = ParagraphStyle(
        'SousTitre', fontSize=11, textColor=BLEU_CTL,
        fontName='Helvetica', alignment=TA_CENTER, spaceAfter=14
    )
    section_style = ParagraphStyle(
        'Section', fontSize=11, textColor=colors.white,
        fontName='Helvetica-Bold', alignment=TA_LEFT,
        spaceBefore=12, spaceAfter=6
    )
    normal_style = ParagraphStyle(
        'Normal2', fontSize=9, textColor=BLEU_FONCE,
        fontName='Helvetica', leading=14
    )
    small_style = ParagraphStyle(
        'Small', fontSize=8, textColor=GRIS_TEXTE,
        fontName='Helvetica', leading=12, alignment=TA_JUSTIFY
    )

    params = None
    try:
        from rapports.models import ParametresMicrofinance
        params = ParametresMicrofinance.get_instance()
    except:
        pass

    nom_structure = params.nom_structure if params else 'Microfinance+'
    adresse_structure = params.adresse if params else 'Sénégal'
    telephone_structure = params.telephone if params else ''

    # ===== EN-TÊTE =====
    for el in build_header(nom_structure, f"CONTRAT DE CRÉDIT N° {dossier.numero_dossier}", adresse_structure, telephone_structure):
        elements.append(el)


    # ===== TITRE =====
    elements.append(Paragraph("CONTRAT DE PRÊT", titre_style))
    genre = "L'Emprunteuse" if dossier.membre.sexe == "F" else "L'Emprunteur"
    elements.append(Paragraph(
        f"Entre {nom_structure} et {dossier.membre.prenom} {dossier.membre.nom}",
        sous_titre_style
    ))
    elements.append(Spacer(1, 0.3*cm))

    # ===== SECTION 1 : PARTIES =====
    def section_header(titre):
        t = Table([[Paragraph(f"  {titre}", section_style)]],
                  colWidths=[17*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BLEU_CTL),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [BLEU_CTL]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        return t

    def info_table(data):
        t = Table(data, colWidths=[6*cm, 11*cm])
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), GRIS_TEXTE),
            ('TEXTCOLOR', (1, 0), (1, -1), BLEU_FONCE),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, GRIS_CLAIR]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ]))
        return t

    elements.append(section_header("ARTICLE 1 — IDENTIFICATION DES PARTIES"))
    elements.append(Spacer(1, 0.2*cm))

    # Prêteur
    elements.append(Paragraph("<b>Le Prêteur :</b>", normal_style))
    elements.append(info_table([
        ["Dénomination", nom_structure],
        ["Adresse", adresse_structure],
        ["Téléphone", telephone_structure],
        ["Représenté par", "Le Directeur Général"],
    ]))
    elements.append(Spacer(1, 0.3*cm))

    # Emprunteur
    elements.append(Paragraph(f"<b>{genre} :</b>", normal_style))
    elements.append(info_table([
        ["Nom et Prénom", f"{dossier.membre.prenom} {dossier.membre.nom}"],
        ["N° Membre", dossier.membre.numero_membre],
        ["Téléphone", dossier.membre.telephone],
        ["Adresse", dossier.membre.adresse],
        ["Pièce d'identité", f"{dossier.membre.type_piece} N° {dossier.membre.numero_piece}"],
        ["Profession", dossier.membre.profession],
    ]))
    elements.append(Spacer(1, 0.3*cm))

    # ===== SECTION 2 : CONDITIONS =====
    elements.append(section_header("ARTICLE 2 — CONDITIONS DU CRÉDIT"))
    elements.append(Spacer(1, 0.2*cm))
    elements.append(info_table([
        ["Numéro de dossier", dossier.numero_dossier],
        ["Montant accordé", f"{int(dossier.montant_accorde):,} FCFA".replace(',', ' ')],
        ["FRG retenu (1/6)", f"{int(dossier.frg):,} FCFA".replace(',', ' ')],
        ["Montant débloqué", f"{int(dossier.montant_net_debloque):,} FCFA".replace(',', ' ')],
        ["FRG à verser (avant clôture)", f"{int(dossier.frg):,} FCFA".replace(',', ' ')],
        ["Fréquence", dossier.get_frequence_remboursement_display()],
        ["Nombre d'échéances", str(dossier.nombre_echeances)],
        ["Mode de déblocage", dossier.get_mode_deblocage_display()],
        ["Date de déblocage", fmt_date(dossier.date_deblocage)],
        ["Date échéance finale", fmt_date(dossier.date_echeance_finale)],
        ["Pénalité de retard", "2 000 FCFA par jour de retard (J+1)"],
        ["Taux d'intérêt", "Aucun (financement solidaire)"],
    ]))
    elements.append(Spacer(1, 0.3*cm))

    # ===== SECTION 3 : ÉCHÉANCIER =====
    elements.append(section_header("ARTICLE 3 — ÉCHÉANCIER DE REMBOURSEMENT"))
    elements.append(Spacer(1, 0.2*cm))

    echeancier = dossier.echeancier.all().order_by('numero_echeance')
    if echeancier.exists():
        ech_data = [["N°", "Date d'échéance", "Montant (FCFA)", "Statut"]]
        for e in echeancier:
            ech_data.append([
                str(e.numero_echeance),
                fmt_date(e.date_echeance),
                f"{int(e.montant_echeance):,}".replace(',', ' '),
                e.get_statut_display(),
            ])

        ech_table = Table(ech_data, colWidths=[2*cm, 5*cm, 5*cm, 5*cm])
        ech_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BLEU_CTL),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, GRIS_CLAIR]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(ech_table)
    elements.append(Spacer(1, 0.3*cm))

    # ===== SECTION 4 : CLAUSES =====
    elements.append(section_header("ARTICLE 4 — ENGAGEMENTS ET CLAUSES"))
    elements.append(Spacer(1, 0.2*cm))
    clauses = [
        "L'emprunteur s'engage à rembourser le montant du crédit selon l'échéancier défini à l'Article 3.",
        "Tout retard de paiement entraîne automatiquement l'application d'une pénalité de 2 000 FCFA par jour de retard, applicable dès le lendemain (J+1) de la date d'échéance.",
        "Le Fonds de Risques et de Garantie (FRG) représentant 1/6 du montant accordé doit être versé par l'emprunteur avant la clôture définitive du crédit. Ce montant constitue la garantie de la structure et ne peut être restitué.",
        "En cas de défaut de paiement persistant, la structure se réserve le droit d'engager une procédure de recouvrement pouvant aller jusqu'à des mesures légales.",
        "L'emprunteur certifie que les informations fournies sont exactes et s'engage à informer la structure de tout changement de situation.",
        "Le présent contrat est régi par les dispositions de la réglementation BCEAO relative aux Systèmes Financiers Décentralisés (SFD) en vigueur au Sénégal.",
    ]
    for i, clause in enumerate(clauses, 1):
        elements.append(Paragraph(
            f"{i}. {clause}", small_style
        ))
        elements.append(Spacer(1, 0.15*cm))

    elements.append(Spacer(1, 0.5*cm))

    # ===== SIGNATURES =====
    elements.append(section_header("SIGNATURES"))
    elements.append(Spacer(1, 0.3*cm))

    sig_data = [[
        Paragraph(
            f"<b>L'Emprunteur</b><br/><br/>"
            f"{dossier.membre.prenom} {dossier.membre.nom}<br/><br/><br/><br/>"
            f"Signature :<br/>______________________",
            ParagraphStyle('sig', fontSize=9, fontName='Helvetica', alignment=TA_CENTER)
        ),
        Paragraph(
            f"<b>Le Directeur Général</b><br/><br/>"
            f"{nom_structure}<br/><br/><br/><br/>"
            f"Signature & Cachet :<br/>______________________",
            ParagraphStyle('sig', fontSize=9, fontName='Helvetica', alignment=TA_CENTER)
        ),
    ]]
    sig_table = Table(sig_data, colWidths=[8.5*cm, 8.5*cm])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (0, 0), 1, colors.HexColor('#E5E7EB')),
        ('BOX', (1, 0), (1, 0), 1, colors.HexColor('#E5E7EB')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(sig_table)

    elements.append(Spacer(1, 0.3*cm))
    elements.append(HRFlowable(width="100%", thickness=1,
                                color=GRIS_TEXTE, spaceAfter=6))
    elements.append(Paragraph(
        f"Document généré le {date.today().strftime('%d/%m/%Y')} — "
        f"{nom_structure}",
        ParagraphStyle('footer', fontSize=7, textColor=GRIS_TEXTE,
                       fontName='Helvetica', alignment=TA_CENTER)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generer_recu_deblocage(dossier):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title=f"Reçu de Déblocage {dossier.numero_dossier}",
    )

    styles = getSampleStyleSheet()
    elements = []

    try:
        from rapports.models import ParametresMicrofinance
        params = ParametresMicrofinance.get_instance()
        nom_structure = params.nom_structure
    except:
        nom_structure = 'Microfinance+'

    titre_style = ParagraphStyle(
        'T', fontSize=18, textColor=colors.HexColor('#111827'),
        fontName='Helvetica-Bold', alignment=TA_CENTER, spaceBefore=28, spaceAfter=14
    )
    normal_style = ParagraphStyle(
        'N', fontSize=10, textColor=colors.HexColor('#111827'),
        fontName='Helvetica', leading=16
    )

    try:
        adresse_deb = params.adresse if params else ""
        tel_deb = params.telephone if params else ""
    except:
        adresse_deb = ""
        tel_deb = ""
    for el in build_header(nom_structure, "REÇU DE DÉBLOCAGE DE CRÉDIT", adresse_deb, tel_deb):
        elements.append(el)

    data = [
        ["N° Dossier", dossier.numero_dossier],
        ["Membre", f"{dossier.membre.prenom} {dossier.membre.nom}"],
        ["N° Membre", dossier.membre.numero_membre],
        ["Téléphone", dossier.membre.telephone],
        ["Montant accordé", f"{int(dossier.montant_accorde):,} FCFA".replace(',', ' ')],
        ["FRG retenu", f"{int(dossier.frg):,} FCFA".replace(',', ' ')],
        ["Montant net reçu", f"{int(dossier.montant_net_debloque):,} FCFA".replace(',', ' ')],
        ["Mode de paiement", dossier.get_mode_deblocage_display()],
        ["Date de déblocage", fmt_date(dossier.date_deblocage)],
        ["Nombre d'échéances", str(dossier.nombre_echeances)],
        ["Première échéance", fmt_date(dossier.echeancier.first().date_echeance) if dossier.echeancier.exists() else "—"],
        ["Dernière échéance", fmt_date(dossier.date_echeance_finale)],
    ]

    t = Table(data, colWidths=[6*cm, 11*cm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), GRIS_TEXTE),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#111827')),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, GRIS_CLAIR]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 1*cm))

    # Montant en gros
    elements.append(Table([[
        Paragraph(
            f"Montant net reçu :<br/>"
            f"<font size=20 color='#4BB543'><b>{int(dossier.montant_net_debloque):,} FCFA</b></font>".replace(',', ' '),
            ParagraphStyle('M', fontSize=12, fontName='Helvetica-Bold',
                           alignment=TA_CENTER, leading=28)
        )
    ]], colWidths=[17*cm]))

    elements.append(Spacer(1, 1*cm))

    sig_data = [[
        Paragraph(
            "<b>Signature de l'emprunteur</b><br/><br/><br/><br/>"
            "______________________",
            ParagraphStyle('s', fontSize=9, fontName='Helvetica', alignment=TA_CENTER)
        ),
        Paragraph(
            "<b>Cachet et signature</b><br/><b>de la structure</b><br/><br/><br/>"
            "______________________",
            ParagraphStyle('s', fontSize=9, fontName='Helvetica', alignment=TA_CENTER)
        ),
    ]]
    sig_t = Table(sig_data, colWidths=[8.5*cm, 8.5*cm])
    sig_t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(sig_t)

    elements.append(Spacer(1, 0.5*cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=GRIS_TEXTE, spaceAfter=6))
    elements.append(Paragraph(
        f"Document généré le {date.today().strftime('%d/%m/%Y')} — {nom_structure}",
        ParagraphStyle('f', fontSize=7, textColor=GRIS_TEXTE,
                       fontName='Helvetica', alignment=TA_CENTER)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generer_recu_remboursement(remboursement):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title=f"Reçu {remboursement.numero_remboursement}",
    )
    elements = []

    try:
        from rapports.models import ParametresMicrofinance
        params = ParametresMicrofinance.get_instance()
        nom_structure = params.nom_structure
        telephone_structure = params.telephone
        adresse_structure = params.adresse
    except:
        nom_structure = "Microfinance+"
        telephone_structure = ""
        adresse_structure = ""

    # En-tête
    for el in build_header(nom_structure, "REÇU DE REMBOURSEMENT", adresse_structure, telephone_structure):
        elements.append(el)

    # Numéro et date en évidence
    elements.append(Table([[
        Paragraph(
            f"N° <b>{remboursement.numero_remboursement}</b>",
            ParagraphStyle("n", fontSize=12, fontName="Helvetica-Bold",
                           textColor=BLEU_CTL, alignment=TA_LEFT)
        ),
        Paragraph(
            f"Date : <b>{remboursement.date_paiement.strftime('%d/%m/%Y') if hasattr(remboursement.date_paiement, 'strftime') else str(remboursement.date_paiement)}</b>",
            ParagraphStyle("d", fontSize=12, fontName="Helvetica-Bold",
                           textColor=BLEU_FONCE, alignment=TA_RIGHT)
        ),
    ]], colWidths=[8.5*cm, 8.5*cm]))
    elements.append(Spacer(1, 0.4*cm))

    # Informations
    data = [
        ["Dossier de crédit", remboursement.dossier.numero_dossier],
        ["Membre", f"{remboursement.dossier.membre.prenom} {remboursement.dossier.membre.nom}"],
        ["N° Membre", remboursement.dossier.membre.numero_membre],
        ["Téléphone", remboursement.dossier.membre.telephone],
        ["Mode de paiement", remboursement.get_mode_paiement_display()],
        ["Référence transaction", remboursement.reference_paiement or "—"],
        ["Saisi par", remboursement.saisi_par.get_full_name() or remboursement.saisi_par.username],
    ]

    t = Table(data, colWidths=[6*cm, 11*cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GRIS_TEXTE),
        ("TEXTCOLOR", (1, 0), (1, -1), BLEU_FONCE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, GRIS_CLAIR]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # Montants en évidence
    montants_data = [[
        Paragraph(
            f"Montant versé<br/><font size=20 color=#1A6FD4><b>{int(remboursement.montant_verse):,} FCFA</b></font>".replace(",", " "),
            ParagraphStyle("m", fontSize=11, fontName="Helvetica-Bold",
                           alignment=TA_CENTER, leading=28)
        ),
        Paragraph(
            f"dont Principal<br/><font size=16 color=#4BB543><b>{int(remboursement.montant_principal):,} FCFA</b></font>".replace(",", " "),
            ParagraphStyle("m2", fontSize=10, fontName="Helvetica",
                           alignment=TA_CENTER, leading=24)
        ),
        Paragraph(
            f"dont Pénalité<br/><font size=16 color=#EF4444><b>{int(remboursement.montant_penalite):,} FCFA</b></font>".replace(",", " "),
            ParagraphStyle("m3", fontSize=10, fontName="Helvetica",
                           alignment=TA_CENTER, leading=24)
        ),
    ]]
    mt = Table(montants_data, colWidths=[6*cm, 5.5*cm, 5.5*cm])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#EFF6FF")),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#F0FDF4")),
        ("BACKGROUND", (2, 0), (2, 0), colors.HexColor("#FEF2F2")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#E5E7EB")),
        ("ROUNDEDCORNERS", [6]),
    ]))
    elements.append(mt)
    elements.append(Spacer(1, 0.5*cm))

    # Situation après paiement
    elements.append(Paragraph("Situation du crédit après ce paiement :", ParagraphStyle(
        "s", fontSize=10, fontName="Helvetica-Bold",
        textColor=BLEU_FONCE, spaceAfter=8
    )))
    sit_data = [
        ["Montant accordé", f"{int(remboursement.dossier.montant_accorde):,} FCFA".replace(",", " ")],
        ["Total remboursé", f"{int(remboursement.dossier.montant_rembourse):,} FCFA".replace(",", " ")],
        ["Montant restant", f"{int(remboursement.dossier.montant_restant):,} FCFA".replace(",", " ")],
    ]
    st = Table(sit_data, colWidths=[6*cm, 11*cm])
    st.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GRIS_TEXTE),
        ("TEXTCOLOR", (1, 0), (1, -1), BLEU_FONCE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, GRIS_CLAIR]),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
    ]))
    elements.append(st)
    elements.append(Spacer(1, 0.8*cm))

    # Signatures
    sig_data = [[
        Paragraph(
            "<b>Signature du membre</b><br/><br/><br/><br/>______________________",
            ParagraphStyle("s", fontSize=9, fontName="Helvetica", alignment=TA_CENTER)
        ),
        Paragraph(
            "<b>Signature du caissier</b><br/><br/><br/><br/>______________________",
            ParagraphStyle("s", fontSize=9, fontName="Helvetica", alignment=TA_CENTER)
        ),
    ]]
    sig_t = Table(sig_data, colWidths=[8.5*cm, 8.5*cm])
    sig_t.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (0, 0), 1, colors.HexColor("#E5E7EB")),
        ("BOX", (1, 0), (1, 0), 1, colors.HexColor("#E5E7EB")),
    ]))
    elements.append(sig_t)

    elements.append(Spacer(1, 0.4*cm))
    elements.append(HRFlowable(width="100%", thickness=1,
                                color=GRIS_TEXTE, spaceAfter=6))
    elements.append(Paragraph(
        f"Document généré le {date.today().strftime('%d/%m/%Y')} — {nom_structure}",
        ParagraphStyle("f", fontSize=7, textColor=GRIS_TEXTE,
                       fontName="Helvetica", alignment=TA_CENTER)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generer_recu_adhesion(membre):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title=f"Reçu Adhésion {membre.numero_membre}",
    )
    elements = []

    try:
        from rapports.models import ParametresMicrofinance
        params = ParametresMicrofinance.get_instance()
        nom_structure = params.nom_structure
        telephone_structure = params.telephone
        adresse_structure = params.adresse
    except:
        nom_structure = "Microfinance+"
        telephone_structure = ""
        adresse_structure = ""

    # En-tête avec logo
    logo_path = get_logo_path()
    if logo_path and os.path.exists(logo_path):
        header_data = [[
            Image(logo_path, width=4*cm, height=2*cm),
            Paragraph(
                f"<b>{nom_structure}</b><br/>"
                f"<font color='#1A6FD4' size=13>REÇU D\'ADHÉSION</font><br/>"
                f"<font size=8 color='#6B7280'>{adresse_structure} | Tél : {telephone_structure}</font>",
                ParagraphStyle("h", fontSize=14, fontName="Helvetica-Bold",
                               textColor=BLEU_FONCE, alignment=TA_LEFT, leading=22, spaceAfter=4)
            )
        ]]
        ht = Table(header_data, colWidths=[4.5*cm, 12.5*cm])
        ht.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (0,0), 0),
        ]))
        elements.append(ht)
    else:
        elements.append(Paragraph(nom_structure, ParagraphStyle(
            "T", fontSize=18, fontName="Helvetica-Bold",
            textColor=BLEU_FONCE, alignment=TA_CENTER,
            spaceBefore=28, spaceAfter=14
        )))
        elements.append(Paragraph("REÇU D\'ADHÉSION", ParagraphStyle(
            "ST", fontSize=13, fontName="Helvetica-Bold",
            textColor=BLEU_CTL, alignment=TA_CENTER, spaceAfter=14
        )))
        elements.append(Paragraph(
            f"{adresse_structure} | Tél : {telephone_structure}",
            ParagraphStyle("sub", fontSize=8, textColor=GRIS_TEXTE,
                           fontName="Helvetica", alignment=TA_CENTER)
        ))
    elements.append(HRFlowable(width="100%", thickness=2,
                                color=BLEU_CTL, spaceAfter=16))

    # Numéro et date
    elements.append(Table([[
        Paragraph(
            f"N° Membre : <b>{membre.numero_membre}</b>",
            ParagraphStyle("n", fontSize=12, fontName="Helvetica-Bold",
                           textColor=BLEU_CTL, alignment=TA_LEFT)
        ),
        Paragraph(
            f"Date : <b>{membre.date_paiement_frais.strftime('%d/%m/%Y') if membre.date_paiement_frais else str(membre.date_adhesion)}</b>",
            ParagraphStyle("d", fontSize=12, fontName="Helvetica-Bold",
                           textColor=BLEU_FONCE, alignment=TA_RIGHT)
        ),
    ]], colWidths=[8.5*cm, 8.5*cm]))
    elements.append(Spacer(1, 0.4*cm))

    # Informations membre
    data = [
        ["Nom et Prénom", f"{membre.prenom} {membre.nom}"],
        ["Date de naissance", fmt_date(membre.date_naissance)],
        ["Lieu de naissance", membre.lieu_naissance],
        ["Téléphone", membre.telephone],
        ["Adresse", membre.adresse],
        ["Profession", membre.profession],
        ["Pièce d'identité", f"{membre.type_piece} N° {membre.numero_piece}"],
        ["Date d'adhésion", fmt_date(membre.date_adhesion)],
        ["Mode de paiement", dict([('ESPECES', 'Espèces'), ('MOBILE_MONEY', 'Mobile Money')]).get(membre.mode_paiement_frais, 'Espèces')],
    ]

    t = Table(data, colWidths=[6*cm, 11*cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GRIS_TEXTE),
        ("TEXTCOLOR", (1, 0), (1, -1), BLEU_FONCE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, GRIS_CLAIR]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # Montant en évidence
    elements.append(Table([[
        Paragraph(
            f"Frais d'adhésion versés<br/>"
            f"<font size=22 color=#4BB543><b>{int(membre.frais_adhesion):,} FCFA</b></font>".replace(",", " "),
            ParagraphStyle("m", fontSize=12, fontName="Helvetica-Bold",
                           alignment=TA_CENTER, leading=32)
        )
    ]], colWidths=[17*cm]))
    elements.append(Spacer(1, 0.8*cm))

    # Signatures
    sig_data = [[
        Paragraph(
            "<b>Signature du membre</b><br/><br/><br/><br/>______________________",
            ParagraphStyle("s", fontSize=9, fontName="Helvetica", alignment=TA_CENTER)
        ),
        Paragraph(
            "<b>Cachet et signature</b><br/><b>de la structure</b><br/><br/><br/>______________________",
            ParagraphStyle("s", fontSize=9, fontName="Helvetica", alignment=TA_CENTER)
        ),
    ]]
    sig_t = Table(sig_data, colWidths=[8.5*cm, 8.5*cm])
    sig_t.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (0, 0), 1, colors.HexColor("#E5E7EB")),
        ("BOX", (1, 0), (1, 0), 1, colors.HexColor("#E5E7EB")),
    ]))
    elements.append(sig_t)

    elements.append(Spacer(1, 0.4*cm))
    elements.append(HRFlowable(width="100%", thickness=1,
                                color=GRIS_TEXTE, spaceAfter=6))
    elements.append(Paragraph(
        f"Document généré le {date.today().strftime('%d/%m/%Y')} — {nom_structure}",
        ParagraphStyle("f", fontSize=7, textColor=GRIS_TEXTE,
                       fontName="Helvetica", alignment=TA_CENTER)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
