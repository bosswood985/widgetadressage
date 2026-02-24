// templates.js - Template unique pour tous les motifs

// Un seul template universel
const ReferralTemplates = {
    'default': 'Cher Confrere,\n\nJe vous remercie de convoquer [PATIENT] pour [MOTIF] dans [DELAI].\n\nBien cordialement,'
};

function getTemplate(reason) {
    return ReferralTemplates['default'];
}

// Formate l'en-tete du courrier
function formatLetterHeader(settings, patientInfo, urgencyText) {
    const date = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    let header = '';
    if (settings.doctorName)    header += settings.doctorName + '\n';
    if (settings.doctorSpecialty) header += settings.doctorSpecialty + '\n';
    if (settings.doctorRPPS)    header += 'RPPS : ' + settings.doctorRPPS + '\n';
    if (settings.practiceAddress) header += settings.practiceAddress + '\n';
    if (settings.practicePhone) header += 'Tel : ' + settings.practicePhone + '\n';
    header += '\nLe ' + date + '\n\n';
    header += "Objet : Adressage patient - " + urgencyText + '\n\n';
    return header;
}

// Formate le pied de page
function formatLetterFooter(settings) {
    let footer = '\n';
    if (settings.doctorName) footer += settings.doctorName;
    return footer;
}
