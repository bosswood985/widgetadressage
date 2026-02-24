// email.js - Destinataire fixe hardcode : ghorayebra@gmail.com

const FIXED_RECIPIENT = 'ghorayebra@gmail.com';

const reasonLabels = {
    'refractive': 'chirurgie réfractive',
    'cataract': 'chirurgie de la cataracte',
    'intravitreal-injection': 'injection intravi tréenne (IVT)',
    'glaucoma': 'glaucome',
    'vitreoretinal': 'chirurgie vitréorétinienne',
    'laser': 'laser (YAG / Argon)',
    'other': 'motif ophtalmologique'
};

const urgencyLabels = {
    'very-urgent': '🔴 Rouge — dans la semaine',
    'urgent': '🟠 Orange — sous 2 semaines',
    'normal': '🟢 Vert — dans le mois'
};

const urgencyEmojis = {
    'very-urgent': '🔴 Rouge',
    'urgent': '🟠 Orange',
    'normal': '🟢 Vert'
};

const EmailHandler = {

    sendEmail() {
        const patient = CSVParser.getSelectedPatient();
        if (!patient) {
            alert('Aucun patient sélectionné. Cliquez d\'abord sur "✓ Utiliser ces données".');
            return;
        }

        const urgencyValue  = document.getElementById('urgencyLevel').value;
        const reasonValue   = document.getElementById('referralReason').value;

        if (!urgencyValue) { alert('Veuillez sélectionner le degré d\'urgence.'); return; }
        if (!reasonValue)  { alert('Veuillez sélectionner le motif d\'adressage.');  return; }

        Settings.load((settings) => {
            const patientName = [patient.civilite, patient.prenom, patient.nom].filter(Boolean).join(' ');
            const motif       = reasonLabels[reasonValue]  || reasonValue;
            const delai       = urgencyLabels[urgencyValue] || urgencyValue;
            const urgencyEmoji = urgencyEmojis[urgencyValue] || urgencyValue;

            // En-tete
            let header = '';
            if (settings.doctorName)     header += settings.doctorName + '\n';
            if (settings.doctorSpecialty) header += settings.doctorSpecialty + '\n';
            if (settings.doctorRPPS)     header += 'RPPS : ' + settings.doctorRPPS + '\n';
            if (settings.practiceAddress) header += settings.practiceAddress + '\n';
            if (settings.practicePhone)  header += 'Tél : ' + settings.practicePhone + '\n';
            const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            header += '\nLe ' + date + '\n\n';

            // Corps du message
            const body =
                header +
                'Cher Confrère,\n\n' +
                'Je vous remercie de convoquer ' + patientName + ' pour ' + motif + ' ' + delai + '.\n\n' +
                'Bien cordialement,\n' +
                (settings.doctorName || '');

            // Sujet
            const subject = '[' + urgencyEmoji + '] Adressage — ' + (reasonLabels[reasonValue] || reasonValue) + ' — ' + patientName;

            window.location.href = 'mailto:' + encodeURIComponent(FIXED_RECIPIENT) +
                '?subject=' + encodeURIComponent(subject) +
                '&body='    + encodeURIComponent(body);
        });
    },

    // Conserve pour compatibilite avec popup.js existant
    preview() {},
    generateLetter(cb) { if (cb) cb(null); }
};

document.addEventListener('DOMContentLoaded', function () {
    const sendBtn = document.getElementById('sendEmailBtn');
    if (sendBtn) sendBtn.addEventListener('click', () => EmailHandler.sendEmail());

    // Boutons fermer preview (préservés au cas où)
    const cp1 = document.getElementById('closePreviewBtn');
    const cp2 = document.getElementById('closePreviewBtn2');
    if (cp1) cp1.addEventListener('click', () => document.getElementById('previewModal').style.display = 'none');
    if (cp2) cp2.addEventListener('click', () => document.getElementById('previewModal').style.display = 'none');
});
