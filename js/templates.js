// templates.js - Gestion des templates de courrier d'adressage

const ReferralTemplates = {
    'cataract': `Je vous adresse ce patient pour prise en charge d'une cataracte [œil droit/gauche/bilatérale]. L'acuité visuelle est de [AV œil droit] à droite et [AV œil gauche] à gauche. Le patient présente une gêne fonctionnelle significative dans ses activités quotidiennes.

Examen :
- [Description examen]

Cordialement.`,

    'glaucoma': `Je vous adresse ce patient pour avis/prise en charge d'un glaucome. La PIO mesurée est de [valeur OD] mmHg à droite et [valeur OG] mmHg à gauche. Le champ visuel montre [description].

Antécédents ophtalmologiques :
- [Antécédents]

Traitement actuel :
- [Traitement]

Cordialement.`,

    'amd': `Je vous adresse ce patient pour prise en charge d'une DMLA [forme sèche/humide/mixte]. L'OCT montre [description]. L'acuité visuelle actuelle est de [AV OD] à droite et [AV OG] à gauche.

Antécédents :
- [Antécédents]

Traitement actuel :
- [Traitement]

Cordialement.`,

    'diabetic-retinopathy': `Je vous adresse ce patient diabétique de type [1/2] depuis [durée] pour prise en charge d'une rétinopathie diabétique [stade : non proliférante/proliférante].

Bilan diabète :
- HbA1c : [valeur]
- Équilibre glycémique : [description]

Fond d'œil :
- [Description]

Cordialement.`,

    'retinal-detachment': `⚠️ URGENT - Je vous adresse ce patient en urgence pour suspicion de décollement de rétine. Le patient présente [symptômes : phosphènes, myodésopsies, amputation du champ visuel] depuis [durée].

Examen :
- Acuité visuelle : [AV]
- [Description examen]

Merci de votre prise en charge rapide.

Cordialement.`,

    'keratoconus': `Je vous adresse ce patient pour prise en charge d'un kératocône [stade]. La topographie cornéenne montre [description].

Réfraction :
- OD : [valeur]
- OG : [valeur]

Acuité visuelle :
- [Description]

Cordialement.`,

    'strabismus': `Je vous adresse ce patient pour avis sur un strabisme [type : convergent/divergent/vertical]. La déviation mesurée est de [valeur] dioptries prismatiques.

Examen :
- [Description]

Antécédents :
- [Antécédents]

Cordialement.`,

    'eyelid-pathology': `Je vous adresse ce patient pour prise en charge d'un(e) [pathologie : chalazion/ptosis/entropion/ectropion/tumeur] palpébral(e).

Description :
- [Description détaillée]

Évolution :
- [Durée et évolution]

Cordialement.`,

    'other': `Je vous adresse ce patient pour [motif].

Anamnèse :
- [Description]

Examen :
- [Description]

Cordialement.`
};

// Fonction pour obtenir le template selon le motif
function getTemplate(reason) {
    return ReferralTemplates[reason] || ReferralTemplates['other'];
}

// Fonction pour formater le texte avec les informations du praticien
function formatLetterHeader(settings, patientInfo, urgencyText, careTypeText) {
    const date = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    let header = '';
    
    // En-tête praticien
    if (settings.doctorName) {
        header += `${settings.doctorName}\n`;
    }
    if (settings.doctorSpecialty) {
        header += `${settings.doctorSpecialty}\n`;
    }
    if (settings.doctorRPPS) {
        header += `RPPS : ${settings.doctorRPPS}\n`;
    }
    if (settings.practiceAddress) {
        header += `${settings.practiceAddress}\n`;
    }
    if (settings.practicePhone) {
        header += `Tél : ${settings.practicePhone}\n`;
    }
    
    header += `\nLe ${date}\n\n`;
    header += `À l'attention du Service d'Ophtalmologie\n\n`;
    header += `Objet : Demande d'adressage patient\n\n`;
    
    // Informations patient
    header += `Cher(e) Confrère,\n\n`;
    header += `Patient(e) : ${patientInfo.civilite || ''} ${patientInfo.prenom} ${patientInfo.nom}\n`;
    if (patientInfo.date_naissance) {
        header += `Date de naissance : ${patientInfo.date_naissance}\n`;
    }
    if (patientInfo.telephone) {
        header += `Téléphone : ${patientInfo.telephone}\n`;
    }
    if (patientInfo.email) {
        header += `Email : ${patientInfo.email}\n`;
    }
    if (patientInfo.adresse) {
        let address = patientInfo.adresse;
        if (patientInfo.code_postal) address += `, ${patientInfo.code_postal}`;
        if (patientInfo.ville) address += ` ${patientInfo.ville}`;
        header += `Adresse : ${address}\n`;
    }
    if (patientInfo.numero_secu) {
        header += `N° Sécurité sociale : ${patientInfo.numero_secu}\n`;
    }
    
    header += `\nDegré d'urgence : ${urgencyText}\n`;
    header += `Type de prise en charge : ${careTypeText}\n\n`;
    
    return header;
}

// Fonction pour formater le pied de page
function formatLetterFooter(settings) {
    let footer = '\n\n';
    footer += 'Je reste à votre disposition pour tout renseignement complémentaire.\n\n';
    footer += 'Avec mes remerciements et mes salutations confraternelles.\n\n';
    
    if (settings.doctorName) {
        footer += settings.doctorName;
    }
    
    return footer;
}
