// settings.js - Gestion des paramètres utilisateur avec chrome.storage ou localStorage

const Settings = {
    // Clé storage
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
    
    // Detect if chrome.storage is available (extension context)
    isExtension() {
        return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    },
    
    // Charger les paramètres
    load(callback) {
        // If callback is provided, use async mode (for extension)
        // If not, use sync mode (for standalone)
        
        if (this.isExtension()) {
            // Extension mode: use chrome.storage.local (async)
            if (callback) {
                chrome.storage.local.get([this.STORAGE_KEY], (result) => {
                    const settings = result[this.STORAGE_KEY] || {};
                    callback({ ...this.defaults, ...settings });
                });
            } else {
                // Synchronous fallback for compatibility
                console.warn('load() called without callback in extension mode, returning defaults');
                return { ...this.defaults };
            }
        } else {
            // Standalone mode: use localStorage (sync)
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                const settings = stored ? JSON.parse(stored) : {};
                const result = { ...this.defaults, ...settings };
                if (callback) {
                    callback(result);
                }
                return result;
            } catch (e) {
                console.error('Erreur lors du chargement des paramètres:', e);
                const result = { ...this.defaults };
                if (callback) {
                    callback(result);
                }
                return result;
            }
        }
    },
    
    // Sauvegarder les paramètres
    save(settings, callback) {
        if (this.isExtension()) {
            // Extension mode: use chrome.storage.local
            chrome.storage.local.set({ [this.STORAGE_KEY]: settings }, () => {
                console.log('Paramètres sauvegardés dans chrome.storage');
                if (callback) callback(true);
            });
        } else {
            // Standalone mode: use localStorage
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
                if (callback) callback(true);
                return true;
            } catch (e) {
                console.error('Erreur lors de la sauvegarde des paramètres:', e);
                if (callback) callback(false);
                return false;
            }
        }
    },
    
    // Initialiser l'interface des paramètres
    initUI() {
        this.load((settings) => {
            // Remplir les champs du formulaire
            document.getElementById('doctorName').value = settings.doctorName || '';
            document.getElementById('doctorSpecialty').value = settings.doctorSpecialty || 'Médecin généraliste';
            document.getElementById('doctorRPPS').value = settings.doctorRPPS || '';
            document.getElementById('practiceAddress').value = settings.practiceAddress || '';
            document.getElementById('practicePhone').value = settings.practicePhone || '';
            document.getElementById('recipientEmail').value = settings.recipientEmail || '';
        });
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
    
    // Vérifier si un email est valide (improved regex)
    isValidEmail(email) {
        // More comprehensive email validation
        const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
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
        
        Settings.save(settings, (success) => {
            if (success) {
                alert('Paramètres enregistrés avec succès !');
                document.getElementById('settingsModal').classList.remove('active');
            } else {
                alert('Erreur lors de la sauvegarde des paramètres.');
            }
        });
    });
    
    // Vérifier si les paramètres sont configurés au démarrage
    Settings.load((settings) => {
        if (!settings.doctorName || !settings.recipientEmail) {
            // Show settings modal after a short delay
            setTimeout(() => {
                Settings.initUI();
                document.getElementById('settingsModal').classList.add('active');
            }, 1000);
        }
    });
});
