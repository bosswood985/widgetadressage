// settings.js - Gestion des paramètres utilisateur
// EMAIL DESTINATAIRE hardcodé dans email.js — supprimé ici

const Settings = {
    STORAGE_KEY: 'widgetAdressageSettings',

    defaults: {
        doctorName: '',
        doctorSpecialty: 'Ophtalmologue',
        doctorRPPS: '',
        practiceAddress: '',
        practicePhone: '',
        recipientEmail: 'ghorayebra@gmail.com'  // toujours forcé
    },

    isExtension() {
        return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    },

    load(callback) {
        if (this.isExtension()) {
            if (callback) {
                chrome.storage.local.get([this.STORAGE_KEY], (result) => {
                    const settings = result[this.STORAGE_KEY] || {};
                    // On force toujours recipientEmail
                    callback({ ...this.defaults, ...settings, recipientEmail: 'ghorayebra@gmail.com' });
                });
            } else {
                return { ...this.defaults, recipientEmail: 'ghorayebra@gmail.com' };
            }
        } else {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                const settings = stored ? JSON.parse(stored) : {};
                const result = { ...this.defaults, ...settings, recipientEmail: 'ghorayebra@gmail.com' };
                if (callback) callback(result);
                return result;
            } catch (e) {
                const result = { ...this.defaults, recipientEmail: 'ghorayebra@gmail.com' };
                if (callback) callback(result);
                return result;
            }
        }
    },

    save(settings, callback) {
        // On ne sauvegarde jamais recipientEmail
        const toSave = { ...settings };
        delete toSave.recipientEmail;
        if (this.isExtension()) {
            chrome.storage.local.set({ [this.STORAGE_KEY]: toSave }, () => {
                if (callback) callback(true);
            });
        } else {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
                if (callback) callback(true);
                return true;
            } catch (e) {
                if (callback) callback(false);
                return false;
            }
        }
    },

    initUI() {
        this.load((settings) => {
            document.getElementById('doctorName').value = settings.doctorName || '';
            document.getElementById('doctorSpecialty').value = settings.doctorSpecialty || 'Ophtalmologue';
            document.getElementById('doctorRPPS').value = settings.doctorRPPS || '';
            document.getElementById('practiceAddress').value = settings.practiceAddress || '';
            document.getElementById('practicePhone').value = settings.practicePhone || '';
            // recipientEmail n'a plus de champ HTML — on ne fait rien
        });
    },

    getFromForm() {
        return {
            doctorName: document.getElementById('doctorName').value.trim(),
            doctorSpecialty: document.getElementById('doctorSpecialty').value.trim(),
            doctorRPPS: document.getElementById('doctorRPPS').value.trim(),
            practiceAddress: document.getElementById('practiceAddress').value.trim(),
            practicePhone: document.getElementById('practicePhone').value.trim()
            // recipientEmail intentionnellement absent
        };
    },

    validate(settings) {
        const errors = [];
        if (!settings.doctorName) errors.push('Le nom du praticien est requis');
        // recipientEmail n'est plus validé ici
        return errors;
    },

    isValidEmail(email) {
        const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return re.test(email);
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // settingsBtn n'existe plus dans le HTML — ce listener ne fait rien de mal s'il est absent
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function () {
            Settings.initUI();
            document.getElementById('settingsModal').classList.add('active');
        });
    }

    document.getElementById('closeSettingsBtn').addEventListener('click', function () {
        document.getElementById('settingsModal').classList.remove('active');
    });

    document.getElementById('settingsModal').addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('active');
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', function () {
        const settings = Settings.getFromForm();
        const errors = Settings.validate(settings);
        if (errors.length > 0) {
            alert('Erreurs :\n\n' + errors.join('\n'));
            return;
        }
        Settings.save(settings, (success) => {
            if (success) {
                alert('Paramètres enregistrés !');
                document.getElementById('settingsModal').classList.remove('active');
            } else {
                alert('Erreur lors de la sauvegarde.');
            }
        });
    });

    // Au démarrage : ouvrir modal seulement si nom manquant (plus de vérification email)
    Settings.load((settings) => {
        if (!settings.doctorName) {
            setTimeout(() => {
                Settings.initUI();
                document.getElementById('settingsModal').classList.add('active');
            }, 1000);
        }
    });
});
