// email.js - Destinataire fixe hardcode : ghorayebra@gmail.com

const FIXED_RECIPIENT = 'ghorayebra@gmail.com';

const reasonLabels = {
    'refractive': 'chirurgie réfractive',
    'cataract': 'chirurgie de la cataracte',
    'intravitreal-injection': 'injection intravitréenne (IVT)',
    'glaucoma': 'glaucome',
    'vitreoretinal': 'chirurgie vitréorétinienne',
    'laser': 'laser (YAG / Argon)',
    'other': 'motif ophtalmologique'
};

// Delai en texte pur — sans emoji ni couleur
const urgencyDelai = {
    'very-urgent': 'dans la semaine',
    'urgent': 'sous 2 semaines',
    'normal': 'dans le mois'
};

// Pour le SUJET uniquement (avec emoji)
const urgencyEmojis = {
    'very-urgent': '🔴 Urgent',
    'urgent': '🟠 Semi-urgent',
    'normal': '🟢 Normal'
};

const EmailHandler = {

    sendEmail() {
        const patient = CSVParser.getSelectedPatient();
        if (!patient) {
            alert('Aucun patient sélectionné. Cliquez d\'abord sur "✓ Utiliser ces données".');
            return;
        }

        const urgencyValue = document.getElementById('urgencyLevel').value;
        const reasonValue  = document.getElementById('referralReason').value;

        if (!urgencyValue) { alert('Veuillez sélectionner le degré d\'urgence.'); return; }
        if (!reasonValue)  { alert('Veuillez sélectionner le motif d\'adressage.'); return; }

        Settings.load((settings) => {
            const patientName  = [patient.civilite, patient.prenom, patient.nom].filter(Boolean).join(' ');
            const motif        = reasonLabels[reasonValue] || reasonValue;
            const delai        = urgencyDelai[urgencyValue] || urgencyValue;   // texte pur, sans emoji
            const urgencyEmoji = urgencyEmojis[urgencyValue] || urgencyValue;

            // En-tete praticien
            let header = '';
            if (settings.doctorName)      header += settings.doctorName + '\n';
            if (settings.doctorSpecialty) header += settings.doctorSpecialty + '\n';
            if (settings.doctorRPPS)      header += 'RPPS : ' + settings.doctorRPPS + '\n';
            if (settings.practiceAddress) header += settings.practiceAddress + '\n';
            if (settings.practicePhone)   header += 'Tél : ' + settings.practicePhone + '\n';
            const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            header += '\nLe ' + date + '\n\n';

            // Corps — texte pur, aucun emoji
            const body =
                header +
                'Cher Confrère,\n\n' +
                'Je vous remercie de convoquer ' + patientName + ' pour ' + motif + ' ' + delai + '.\n\n' +
                'Bien cordialement,\n' +
                (settings.doctorName || '');

            // Sujet (emoji uniquement ici)
            const subject = '[' + urgencyEmoji + '] Adressage — ' + motif + ' — ' + patientName;

            window.location.href =
                'mailto:' + encodeURIComponent(FIXED_RECIPIENT) +
                '?subject=' + encodeURIComponent(subject) +
                '&body='    + encodeURIComponent(body);
        });
    },

    preview() {},
    generateLetter(cb) { if (cb) cb(null); }
};

document.addEventListener('DOMContentLoaded', function () {
    const sendBtn = document.getElementById('sendEmailBtn');
    if (sendBtn) sendBtn.addEventListener('click', () => EmailHandler.sendEmail());

    const cp1 = document.getElementById('closePreviewBtn');
    const cp2 = document.getElementById('closePreviewBtn2');
    if (cp1) cp1.addEventListener('click', () => document.getElementById('previewModal').style.display = 'none');
    if (cp2) cp2.addEventListener('click', () => document.getElementById('previewModal').style.display = 'none');
});
