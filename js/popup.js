// popup.js - Extension popup logic
// Handles auto-fill from Doctolib content script and CSV fallback

document.addEventListener('DOMContentLoaded', function() {
    console.log('Widget d\'Adressage Patient (Extension) - Initialisé');
    
    // Check if we have auto-extracted patient data from content script
    checkForAutoExtractedData();
    
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
    
    // Use auto-extracted data button
    document.getElementById('useAutoExtractedBtn')?.addEventListener('click', function() {
        chrome.storage.local.get(['lastExtractedPatient'], function(result) {
            if (result.lastExtractedPatient) {
                usePatientData(result.lastExtractedPatient);
            }
        });
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
    
    // Hook into the send email button to add validation
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    sendEmailBtn.addEventListener('click', function(e) {
        e.stopImmediatePropagation();
        if (validateForm()) {
            EmailHandler.sendEmail();
        }
    }, true);
    
    // Gestion du raccourci clavier Escape pour fermer les modales
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.active');
            modals.forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
});

// Check for auto-extracted patient data from content script
function checkForAutoExtractedData() {
    // Try to get data from chrome.storage
    chrome.storage.local.get(['lastExtractedPatient', 'extractionTimestamp'], function(result) {
        const dataSourceInfo = document.getElementById('dataSourceInfo');
        
        if (result.lastExtractedPatient) {
            const timestamp = result.extractionTimestamp || 0;
            const age = Date.now() - timestamp;
            
            // Only use data if it's less than 5 minutes old
            if (age < 5 * 60 * 1000) {
                console.log('Auto-extracted patient data found:', result.lastExtractedPatient);
                displayAutoExtractedData(result.lastExtractedPatient);
                dataSourceInfo.innerHTML = '✅ <strong>Données extraites depuis Doctolib</strong> - Cliquez sur "Utiliser ces données" ou importez un CSV.';
                dataSourceInfo.style.color = '#10B981';
                return;
            }
        }
        
        // No auto-extracted data or too old
        console.log('No recent auto-extracted data, will use CSV import');
        dataSourceInfo.innerHTML = '📁 Importez un fichier CSV Doctolib pour commencer, ou allez sur une page patient Doctolib et cliquez sur le bouton "📋 Adresser ce patient".';
        dataSourceInfo.style.color = '#6B7280';
    });
    
    // Also try to request from active tab (if it's a Doctolib page)
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('doctolib.fr')) {
            console.log('Active tab is Doctolib, trying to extract data...');
            chrome.tabs.sendMessage(tabs[0].id, {action: 'extractPatientData'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Could not communicate with content script:', chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success && response.data) {
                    console.log('Received patient data from content script:', response.data);
                    // Save to storage
                    chrome.storage.local.set({ 
                        lastExtractedPatient: response.data,
                        extractionTimestamp: Date.now()
                    });
                    displayAutoExtractedData(response.data);
                }
            });
        }
    });
}

// Display auto-extracted patient data
function displayAutoExtractedData(data) {
    const section = document.getElementById('autoExtractedSection');
    const infoDiv = document.getElementById('autoExtractedPatientInfo');
    
    let html = '';
    
    if (data.civilite || data.nom || data.prenom) {
        html += `<div class="patient-info-item"><span class="patient-info-label">Identité :</span> ${data.civilite || ''} ${data.prenom || ''} ${data.nom || ''}</div>`;
    }
    if (data.date_naissance) {
        html += `<div class="patient-info-item"><span class="patient-info-label">Date de naissance :</span> ${data.date_naissance}</div>`;
    }
    if (data.telephone) {
        html += `<div class="patient-info-item"><span class="patient-info-label">Téléphone :</span> ${data.telephone}</div>`;
    }
    if (data.email) {
        html += `<div class="patient-info-item"><span class="patient-info-label">Email :</span> ${data.email}</div>`;
    }
    if (data.adresse) {
        let address = data.adresse;
        if (data.code_postal) address += `, ${data.code_postal}`;
        if (data.ville) address += ` ${data.ville}`;
        html += `<div class="patient-info-item"><span class="patient-info-label">Adresse :</span> ${address}</div>`;
    }
    if (data.numero_secu) {
        html += `<div class="patient-info-item"><span class="patient-info-label">N° Sécu :</span> ${data.numero_secu}</div>`;
    }
    
    if (!html) {
        html = '<p class="help-text">Aucune donnée patient détectée. Vous pouvez importer un CSV à la place.</p>';
    }
    
    infoDiv.innerHTML = html;
    section.style.display = 'block';
}

// Use patient data (from auto-extraction or CSV)
function usePatientData(patientData) {
    console.log('Using patient data:', patientData);
    
    // Set the patient in CSVParser (reuse existing mechanism)
    CSVParser.selectedPatient = patientData;
    CSVParser.displaySelectedPatient();
    
    // Show the referral form
    document.getElementById('referralSection').style.display = 'block';
    document.getElementById('referralSection').scrollIntoView({ behavior: 'smooth' });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Popup received message:', request);
    
    if (request.action === 'patientDataExtracted') {
        displayAutoExtractedData(request.data);
        sendResponse({ success: true });
    }
    
    return true;
});
