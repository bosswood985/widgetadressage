// email.js
// DESTINATAIRE FIXE hardcodé : ghorayebra@gmail.com — non modifiable

const EmailHandler = {
    urgencyLabels: {
        'very-urgent': '🔴 Rouge - Rapide (dans la semaine)',
        'urgent': '🟠 Orange - 2 semaines',
        'normal': '🟢 Vert - Dans le mois'
    },
    urgencyEmojis: {
        'very-urgent': '🔴 Rouge',
        'urgent': '🟠 Orange',
        'normal': '🟢 Vert'
    },
    careTypeLabels: {
        'specialized-advice': 'Avis spécialisé',
        'complementary-assessment': 'Bilan complémentaire',
        'surgical-care': 'Prise en charge chirurgicale',
        'intravitreal-injection': 'Injection intravitréenne',
        'laser': 'Laser',
        'functional-exploration': 'Exploration fonctionnelle',
        'post-operative-follow-up': 'Suivi post-opératoire',
        'other': 'Autre'
    },
    reasonLabels: {
        'cataract': 'Chirurgie de la cataracte',
        'glaucoma': 'Glaucome',
        'amd': 'DMLA',
        'diabetic-retinopathy': 'Rétinopathie diabétique',
        'retinal-detachment': 'Décollement de rétine',
        'keratoconus': 'Kératocône',
        'strabismus': 'Strabisme',
        'eyelid-pathology': 'Pathologie palpébrale',
        'intravitreal-injection': 'IVT (Injection intravitréenne)',
        'laser': 'Laser (YAG / Argon)',
        'other': 'Autre'
    },

    generateLetter(callback) {
        const patient = CSVParser.getSelectedPatient();
        if (!patient) {
            alert('Veuillez sélectionner un patient.');
            if (callback) callback(null);
            return null;
        }

        Settings.load((settings) => {
            const urgencyValue = document.getElementById('urgencyLevel').value;
            const careTypeValue = document.getElementById('careType').value;
            const letterContent = document.getElementById('letterContent').value;

            if (!urgencyValue || !careTypeValue || !letterContent) {
                alert('Veuillez remplir tous les champs obligatoires.');
                if (callback) callback(null);
                return;
            }

            const urgencyText = this.urgencyLabels[urgencyValue] || urgencyValue;
            let careTypeText = this.careTypeLabels[careTypeValue] || careTypeValue;
            if (careTypeValue === 'other') {
                const otherText = document.getElementById('careTypeOther').value.trim();
                if (otherText) careTypeText = otherText;
            }

            const header = formatLetterHeader(settings, patient, urgencyText, careTypeText);
            const footer = formatLetterFooter(settings);
            const letter = header + letterContent + footer;
            if (callback) callback(letter);
        });
    },

    preview() {
        this.generateLetter((letter) => {
            if (!letter) return;
            document.getElementById('previewContent').textContent = letter;
            document.getElementById('previewModal').classList.add('active');
        });
    },

    sendEmail() {
        const patient = CSVParser.getSelectedPatient();
        if (!patient) {
            alert('Veuillez sélectionner un patient.');
            return;
        }

        this.generateLetter((letter) => {
            if (!letter) return;

            const urgencyValue = document.getElementById('urgencyLevel').value;
            const reasonValue = document.getElementById('referralReason').value;
            const urgencyText = this.urgencyEmojis[urgencyValue] || urgencyValue;
            const reasonText = this.reasonLabels[reasonValue] || reasonValue;
            const patientName = `${patient.prenom || ''} ${patient.nom || ''}`.trim();

            const subject = `[${urgencyText}] Adressage - ${reasonText} - Patient ${patientName}`;

            // DESTINATAIRE FIXE — jamais modifiable
            const mailtoLink = `mailto:${encodeURIComponent('ghorayebra@gmail.com')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(letter)}`;
            window.location.href = mailtoLink;
        });
    }
};

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('previewBtn').addEventListener('click', function () {
        EmailHandler.preview();
    });

    document.getElementById('sendEmailBtn').addEventListener('click', function () {
        EmailHandler.sendEmail();
    });

    document.getElementById('closePreviewBtn').addEventListener('click', function () {
        document.getElementById('previewModal').classList.remove('active');
    });

    document.getElementById('closePreviewBtn2').addEventListener('click', function () {
        document.getElementById('previewModal').classList.remove('active');
    });

    document.getElementById('previewModal').addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('active');
    });
});
