// csv-parser.js - Gestion de l'import et parsing CSV Doctolib

const CSVParser = {
    patients: [],
    filteredPatients: [],
    selectedPatient: null,
    
    // Initialiser les événements
    init() {
        // Bouton d'upload
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('csvFileInput').click();
        });
        
        // Import du fichier
        document.getElementById('csvFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.parseCSV(file);
            }
        });
        
        // Recherche
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterPatients(e.target.value);
        });
    },
    
    // Parser le fichier CSV avec Papa Parse
    parseCSV(file) {
        // Check if Papa Parse is available, otherwise use fallback
        if (typeof Papa !== 'undefined') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                encoding: 'UTF-8',
                complete: (results) => {
                    this.patients = results.data;
                    this.filteredPatients = [...this.patients];
                    this.displayPatients();
                    this.showPatientsSection();
                },
                error: (error) => {
                    alert('Erreur lors de l\'import du CSV : ' + error.message);
                }
            });
        } else {
            // Fallback: simple CSV parser
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const results = this.parseCSVManually(csv);
                    this.patients = results;
                    this.filteredPatients = [...this.patients];
                    this.displayPatients();
                    this.showPatientsSection();
                } catch (error) {
                    alert('Erreur lors de l\'import du CSV : ' + error.message);
                }
            };
            reader.readAsText(file, 'UTF-8');
        }
    },
    
    // Simple CSV parser fallback
    parseCSVManually(csv) {
        const lines = csv.split('\n');
        if (lines.length < 2) return [];
        
        // Get headers
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Parse rows
        const results = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            results.push(row);
        }
        
        return results;
    },
    
    // Afficher la section patients
    showPatientsSection() {
        document.getElementById('patientsSection').style.display = 'block';
        document.getElementById('patientsSection').scrollIntoView({ behavior: 'smooth' });
    },
    
    // Afficher les patients dans le tableau
    displayPatients() {
        const tbody = document.getElementById('patientsTableBody');
        tbody.innerHTML = '';
        
        if (this.filteredPatients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucun patient trouvé</td></tr>';
            this.updatePatientCount(0);
            return;
        }
        
        this.filteredPatients.forEach((patient, index) => {
            const row = document.createElement('tr');
            row.dataset.index = index;
            
            // Normaliser les noms de colonnes (minuscules, sans accents)
            const normalizedPatient = this.normalizePatientData(patient);
            
            row.innerHTML = `
                <td>${this.sanitize(normalizedPatient.civilite || '')}</td>
                <td>${this.sanitize(normalizedPatient.nom || '')}</td>
                <td>${this.sanitize(normalizedPatient.prenom || '')}</td>
                <td>${this.sanitize(normalizedPatient.date_naissance || '')}</td>
                <td>${this.sanitize(normalizedPatient.telephone || '')}</td>
                <td>${this.sanitize(normalizedPatient.email || '')}</td>
            `;
            
            row.addEventListener('click', () => {
                this.selectPatient(normalizedPatient, row);
            });
            
            tbody.appendChild(row);
        });
        
        this.updatePatientCount(this.filteredPatients.length);
    },
    
    // Normaliser les données du patient (gérer les différents formats de colonnes)
    normalizePatientData(patient) {
        const normalized = {};
        
        // Mapper les clés possibles
        const keyMappings = {
            civilite: ['civilite', 'Civilité', 'civilité', 'Civilite'],
            nom: ['nom', 'Nom', 'last_name', 'lastname'],
            prenom: ['prenom', 'prénom', 'Prénom', 'Prenom', 'first_name', 'firstname'],
            date_naissance: ['date_naissance', 'date de naissance', 'Date de naissance', 'birthdate', 'birth_date'],
            telephone: ['telephone', 'téléphone', 'Téléphone', 'phone', 'tel', 'Tel'],
            email: ['email', 'Email', 'mail', 'Mail'],
            adresse: ['adresse', 'Adresse', 'address', 'Address'],
            code_postal: ['code_postal', 'code postal', 'Code postal', 'zipcode', 'zip'],
            ville: ['ville', 'Ville', 'city', 'City'],
            numero_secu: ['numero_secu', 'numéro sécurité sociale', 'numero de securite sociale', 'social_security', 'nir']
        };
        
        // Pour chaque clé normalisée, chercher la valeur correspondante
        for (const [normalizedKey, possibleKeys] of Object.entries(keyMappings)) {
            for (const key of possibleKeys) {
                if (patient[key]) {
                    normalized[normalizedKey] = patient[key];
                    break;
                }
            }
        }
        
        return normalized;
    },
    
    // Filtrer les patients par nom/prénom
    filterPatients(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredPatients = [...this.patients];
        } else {
            this.filteredPatients = this.patients.filter(patient => {
                const normalized = this.normalizePatientData(patient);
                const nom = (normalized.nom || '').toLowerCase();
                const prenom = (normalized.prenom || '').toLowerCase();
                return nom.includes(term) || prenom.includes(term);
            });
        }
        
        this.displayPatients();
    },
    
    // Sélectionner un patient
    selectPatient(patient, rowElement) {
        this.selectedPatient = patient;
        
        // Mettre à jour l'affichage de sélection
        document.querySelectorAll('#patientsTableBody tr').forEach(tr => {
            tr.classList.remove('selected');
        });
        rowElement.classList.add('selected');
        
        // Afficher les infos du patient sélectionné
        this.displaySelectedPatient();
        
        // Afficher la section formulaire
        document.getElementById('referralSection').style.display = 'block';
        document.getElementById('referralSection').scrollIntoView({ behavior: 'smooth' });
    },
    
    // Afficher le patient sélectionné dans le formulaire
    displaySelectedPatient() {
        const infoDiv = document.getElementById('selectedPatientInfo');
        const p = this.selectedPatient;
        
        let html = '';
        
        if (p.civilite || p.nom || p.prenom) {
            html += `<div class="patient-info-item"><span class="patient-info-label">Identité :</span> ${p.civilite || ''} ${p.prenom || ''} ${p.nom || ''}</div>`;
        }
        if (p.date_naissance) {
            html += `<div class="patient-info-item"><span class="patient-info-label">Date de naissance :</span> ${p.date_naissance}</div>`;
        }
        if (p.telephone) {
            html += `<div class="patient-info-item"><span class="patient-info-label">Téléphone :</span> ${p.telephone}</div>`;
        }
        if (p.email) {
            html += `<div class="patient-info-item"><span class="patient-info-label">Email :</span> ${p.email}</div>`;
        }
        if (p.adresse) {
            let address = p.adresse;
            if (p.code_postal) address += `, ${p.code_postal}`;
            if (p.ville) address += ` ${p.ville}`;
            html += `<div class="patient-info-item"><span class="patient-info-label">Adresse :</span> ${address}</div>`;
        }
        if (p.numero_secu) {
            html += `<div class="patient-info-item"><span class="patient-info-label">N° Sécu :</span> ${p.numero_secu}</div>`;
        }
        
        infoDiv.innerHTML = html;
    },
    
    // Mettre à jour le compteur de patients
    updatePatientCount(count) {
        const countDiv = document.getElementById('patientCount');
        countDiv.textContent = `${count} patient${count > 1 ? 's' : ''} affiché${count > 1 ? 's' : ''}`;
    },
    
    // Sanitize HTML pour éviter les injections
    sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    // Obtenir le patient sélectionné
    getSelectedPatient() {
        return this.selectedPatient;
    }
};

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    CSVParser.init();
});
