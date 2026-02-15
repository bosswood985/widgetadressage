// app.js - Point d'entrée principal de l'application

document.addEventListener('DOMContentLoaded', function() {
    console.log('Widget d\'Adressage Patient - Initialisé');
    
    // Gestion du changement de motif d'adressage
    const referralReasonSelect = document.getElementById('referralReason');
    const letterContentTextarea = document.getElementById('letterContent');
    
    referralReasonSelect.addEventListener('change', function() {
        const selectedReason = this.value;
        if (selectedReason) {
            const template = getTemplate(selectedReason);
            letterContentTextarea.value = template;
        } else {
            letterContentTextarea.value = '';
        }
    });
    
    // Gestion du champ "Autre" pour le type de prise en charge
    const careTypeSelect = document.getElementById('careType');
    const careTypeOtherGroup = document.getElementById('careTypeOtherGroup');
    
    careTypeSelect.addEventListener('change', function() {
        if (this.value === 'other') {
            careTypeOtherGroup.style.display = 'block';
        } else {
            careTypeOtherGroup.style.display = 'none';
        }
    });
    
    // Validation du formulaire avant envoi
    function validateForm() {
        const patient = CSVParser.getSelectedPatient();
        if (!patient) {
            alert('Veuillez sélectionner un patient.');
            return false;
        }
        
        const urgency = document.getElementById('urgencyLevel').value;
        if (!urgency) {
            alert('Veuillez sélectionner un degré d\'urgence.');
            return false;
        }
        
        const careType = document.getElementById('careType').value;
        if (!careType) {
            alert('Veuillez sélectionner un type de prise en charge.');
            return false;
        }
        
        if (careType === 'other') {
            const careTypeOther = document.getElementById('careTypeOther').value.trim();
            if (!careTypeOther) {
                alert('Veuillez préciser le type de prise en charge.');
                return false;
            }
        }
        
        const reason = document.getElementById('referralReason').value;
        if (!reason) {
            alert('Veuillez sélectionner un motif d\'adressage.');
            return false;
        }
        
        const letterContent = document.getElementById('letterContent').value.trim();
        if (!letterContent) {
            alert('Veuillez saisir le contenu du courrier.');
            return false;
        }
        
        return true;
    }
    
    // Ajouter la validation au bouton d'envoi
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const originalSendHandler = sendEmailBtn.onclick;
    sendEmailBtn.onclick = function() {
        if (validateForm()) {
            EmailHandler.sendEmail();
        }
    };
    
    // Gestion du raccourci clavier Escape pour fermer les modales
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.active');
            modals.forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    // Aide contextuelle
    console.log('Instructions d\'utilisation :');
    console.log('1. Importer un fichier CSV Doctolib');
    console.log('2. Sélectionner un patient dans la liste');
    console.log('3. Remplir le formulaire d\'adressage');
    console.log('4. Prévisualiser ou envoyer par email');
    console.log('');
    console.log('Configurer les paramètres via le bouton en haut à droite.');
});
