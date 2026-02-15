// settings.js - Gestion des paramètres utilisateur avec localStorage

const Settings = {
    // Clé localStorage
    STORAGE_KEY: 'widgetAdressageSettings',
    
    // Paramètres par défaut
    defaults: {
        doctorName: '',
        doctorSpecialty: 'Médecin généraliste',
        doctorRPPS: '',
        practiceAddress: '',
        practicePhone: '',
        recipientEmail: ''
    },
    
    // Charger les paramètres
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return { ...this.defaults, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Erreur lors du chargement des paramètres:', e);
        }
        return { ...this.defaults };
    },
    
    // Sauvegarder les paramètres
    save(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Erreur lors de la sauvegarde des paramètres:', e);
            return false;
        }
    },
    
    // Initialiser l'interface des paramètres
    initUI() {
        const settings = this.load();
        
        // Remplir les champs du formulaire
        document.getElementById('doctorName').value = settings.doctorName || '';
        document.getElementById('doctorSpecialty').value = settings.doctorSpecialty || 'Médecin généraliste';
        document.getElementById('doctorRPPS').value = settings.doctorRPPS || '';
        document.getElementById('practiceAddress').value = settings.practiceAddress || '';
        document.getElementById('practicePhone').value = settings.practicePhone || '';
        document.getElementById('recipientEmail').value = settings.recipientEmail || '';
    },
    
    // Récupérer les paramètres depuis le formulaire
    getFromForm() {
        return {
            doctorName: document.getElementById('doctorName').value.trim(),
            doctorSpecialty: document.getElementById('doctorSpecialty').value.trim(),
            doctorRPPS: document.getElementById('doctorRPPS').value.trim(),
            practiceAddress: document.getElementById('practiceAddress').value.trim(),
            practicePhone: document.getElementById('practicePhone').value.trim(),
            recipientEmail: document.getElementById('recipientEmail').value.trim()
        };
    },
    
    // Valider les paramètres
    validate(settings) {
        const errors = [];
        
        if (!settings.doctorName) {
            errors.push('Le nom du praticien est requis');
        }
        
        if (!settings.recipientEmail) {
            errors.push('L\'email du destinataire est requis');
        } else if (!this.isValidEmail(settings.recipientEmail)) {
            errors.push('L\'email du destinataire n\'est pas valide');
        }
        
        return errors;
    },
    
    // Vérifier si un email est valide
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Bouton ouvrir les paramètres
    document.getElementById('settingsBtn').addEventListener('click', function() {
        Settings.initUI();
        document.getElementById('settingsModal').classList.add('active');
    });
    
    // Boutons fermer les paramètres
    document.getElementById('closeSettingsBtn').addEventListener('click', function() {
        document.getElementById('settingsModal').classList.remove('active');
    });
    
    // Clic en dehors de la modale
    document.getElementById('settingsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
    
    // Bouton sauvegarder
    document.getElementById('saveSettingsBtn').addEventListener('click', function() {
        const settings = Settings.getFromForm();
        const errors = Settings.validate(settings);
        
        if (errors.length > 0) {
            alert('Erreurs de validation :\n\n' + errors.join('\n'));
            return;
        }
        
        if (Settings.save(settings)) {
            alert('Paramètres enregistrés avec succès !');
            document.getElementById('settingsModal').classList.remove('active');
        } else {
            alert('Erreur lors de la sauvegarde des paramètres.');
        }
    });
    
    // Vérifier si les paramètres sont configurés au démarrage
    const settings = Settings.load();
    if (!settings.doctorName || !settings.recipientEmail) {
        setTimeout(() => {
            if (confirm('Paramètres non configurés. Voulez-vous les configurer maintenant ?')) {
                Settings.initUI();
                document.getElementById('settingsModal').classList.add('active');
            }
        }, 1000);
    }
});
