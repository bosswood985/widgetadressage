// email.js - Gestion de la génération et envoi d'email

const EmailHandler = {
    // Mapper les valeurs d'urgence vers leur texte
    urgencyLabels: {
        'very-urgent': '🔴 Très Urgent - Prise en charge immédiate nécessaire',
        'urgent': '🟠 Urgent - Sous 48h',
        'semi-urgent': '🟡 Semi-urgent - Sous 1 semaine',
        'normal': '🟢 Normal - Consultation programmée',
        'follow-up': '🔵 Suivi - Consultation de suivi'
    },
    
    // Mapper les valeurs de type de prise en charge vers leur texte
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
    
    // Mapper les valeurs de motif vers leur texte
    reasonLabels: {
        'cataract': 'Cataracte',
        'glaucoma': 'Glaucome',
        'amd': 'DMLA',
        'diabetic-retinopathy': 'Rétinopathie diabétique',
        'retinal-detachment': 'Décollement de rétine',
        'keratoconus': 'Kératocône',
        'strabismus': 'Strabisme',
        'eyelid-pathology': 'Pathologie palpébrale',
        'other': 'Autre'
    },
    
    // Générer le courrier complet
    generateLetter() {
        const patient = CSVParser.getSelectedPatient();
        if (!patient) {
            alert('Veuillez sélectionner un patient.');
            return null;
        }
        
        const settings = Settings.load();
        const urgencyValue = document.getElementById('urgencyLevel').value;
        const careTypeValue = document.getElementById('careType').value;
        const letterContent = document.getElementById('letterContent').value;
        
        if (!urgencyValue || !careTypeValue || !letterContent) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return null;
        }
        
        const urgencyText = this.urgencyLabels[urgencyValue] || urgencyValue;
        let careTypeText = this.careTypeLabels[careTypeValue] || careTypeValue;
        
        // Si "Autre" est sélectionné, utiliser le champ personnalisé
        if (careTypeValue === 'other') {
            const otherText = document.getElementById('careTypeOther').value.trim();
            if (otherText) {
                careTypeText = otherText;
            }
        }
        
        const header = formatLetterHeader(settings, patient, urgencyText, careTypeText);
        const footer = formatLetterFooter(settings);
        
        return header + letterContent + footer;
    },
    
    // Prévisualiser le courrier
    preview() {
        const letter = this.generateLetter();
        if (!letter) return;
        
        const previewContent = document.getElementById('previewContent');
        previewContent.textContent = letter;
        
        document.getElementById('previewModal').classList.add('active');
    },
    
    // Envoyer par email (mailto:)
    sendEmail() {
        const patient = CSVParser.getSelectedPatient();
        if (!patient) {
            alert('Veuillez sélectionner un patient.');
            return;
        }
        
        const settings = Settings.load();
        if (!settings.recipientEmail) {
            alert('Veuillez configurer l\'email du destinataire dans les paramètres.');
            document.getElementById('settingsModal').classList.add('active');
            return;
        }
        
        const letter = this.generateLetter();
        if (!letter) return;
        
        const urgencyValue = document.getElementById('urgencyLevel').value;
        const reasonValue = document.getElementById('referralReason').value;
        
        const urgencyText = this.urgencyLabels[urgencyValue] || urgencyValue;
        const reasonText = this.reasonLabels[reasonValue] || reasonValue;
        
        const patientName = `${patient.prenom || ''} ${patient.nom || ''}`.trim();
        
        // Générer le sujet
        const subject = `[${urgencyText.split(' - ')[0]}] Adressage - ${reasonText} - Patient ${patientName}`;
        
        // Encoder le mailto
        const mailtoLink = `mailto:${encodeURIComponent(settings.recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(letter)}`;
        
        // Ouvrir le client mail
        window.location.href = mailtoLink;
    }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Bouton prévisualiser
    document.getElementById('previewBtn').addEventListener('click', function() {
        EmailHandler.preview();
    });
    
    // Bouton envoyer
    document.getElementById('sendEmailBtn').addEventListener('click', function() {
        EmailHandler.sendEmail();
    });
    
    // Boutons fermer prévisualisation
    document.getElementById('closePreviewBtn').addEventListener('click', function() {
        document.getElementById('previewModal').classList.remove('active');
    });
    
    document.getElementById('closePreviewBtn2').addEventListener('click', function() {
        document.getElementById('previewModal').classList.remove('active');
    });
    
    // Clic en dehors de la modale
    document.getElementById('previewModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});
