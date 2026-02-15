// content-script.js - Scrape patient data from Doctolib pages
// This script runs on all Doctolib pages and extracts patient information

(function() {
    'use strict';
    
    console.log('Widget Adressage - Content script loaded on Doctolib');
    
    // Configuration
    const BUTTON_ID = 'widget-adressage-btn';
    const BUTTON_CONTAINER_ID = 'widget-adressage-container';
    
    // State
    let floatingButton = null;
    let patientData = null;
    
    // Detect if we're on a patient page
    function isPatientPage() {
        // Check URL patterns
        const url = window.location.href;
        const patientPagePatterns = [
            /\/patients\/\d+/,
            /\/patient\//,
            /\/dossier/,
            /\/medical-record/
        ];
        
        return patientPagePatterns.some(pattern => pattern.test(url));
    }
    
    // Extract patient data from the DOM
    function extractPatientData() {
        console.log('Attempting to extract patient data...');
        
        const data = {
            civilite: '',
            nom: '',
            prenom: '',
            date_naissance: '',
            telephone: '',
            email: '',
            adresse: '',
            code_postal: '',
            ville: '',
            numero_secu: ''
        };
        
        // Strategy 1: Look for patient info in header/title areas
        // Doctolib typically shows patient name in page header
        const titleSelectors = [
            'h1',
            '.patient-name',
            '.patient-header',
            '[data-test-id="patient-name"]',
            '.dl-profile-header h1',
            '.patient-identity h1',
            '.appointment-patient-name'
        ];
        
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                const nameText = element.textContent.trim();
                // Parse name (typically "Prénom NOM" or "M./Mme NOM Prénom")
                const nameParts = parseNameFromText(nameText);
                if (nameParts.nom || nameParts.prenom) {
                    Object.assign(data, nameParts);
                    break;
                }
            }
        }
        
        // Strategy 2: Look for labeled fields
        const fieldMappings = {
            'date de naissance': 'date_naissance',
            'né(e) le': 'date_naissance',
            'birthdate': 'date_naissance',
            'téléphone': 'telephone',
            'phone': 'telephone',
            'mobile': 'telephone',
            'email': 'email',
            'e-mail': 'email',
            'adresse': 'adresse',
            'address': 'adresse',
            'code postal': 'code_postal',
            'ville': 'ville',
            'city': 'ville',
            'sécurité sociale': 'numero_secu',
            'n° sécu': 'numero_secu',
            'nir': 'numero_secu'
        };
        
        // Search for all text nodes that might be labels
        const allElements = document.querySelectorAll('div, span, p, td, th, label, dt, dd');
        
        allElements.forEach(element => {
            const text = element.textContent.toLowerCase().trim();
            
            for (const [label, field] of Object.entries(fieldMappings)) {
                if (text.includes(label) && !data[field]) {
                    // Look for value in next sibling or child
                    const value = findValueNearElement(element, label);
                    if (value) {
                        data[field] = value;
                    }
                }
            }
        });
        
        // Strategy 3: Look for input fields with patient data
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
        inputs.forEach(input => {
            const name = (input.name || input.id || '').toLowerCase();
            const value = input.value.trim();
            
            if (!value) return;
            
            if ((name.includes('firstname') || name.includes('prenom')) && !data.prenom) {
                data.prenom = value;
            } else if ((name.includes('lastname') || name.includes('nom')) && !data.nom) {
                data.nom = value;
            } else if (name.includes('birth') && !data.date_naissance) {
                data.date_naissance = value;
            } else if ((name.includes('phone') || name.includes('tel')) && !data.telephone) {
                data.telephone = value;
            } else if (name.includes('email') && !data.email) {
                data.email = value;
            } else if (name.includes('address') && !data.adresse) {
                data.adresse = value;
            } else if ((name.includes('zip') || name.includes('postal')) && !data.code_postal) {
                data.code_postal = value;
            } else if (name.includes('city') && !data.ville) {
                data.ville = value;
            }
        });
        
        console.log('Extracted patient data:', data);
        return data;
    }
    
    // Parse name from text (handles various formats)
    function parseNameFromText(text) {
        const result = { civilite: '', nom: '', prenom: '' };
        
        // Remove common prefixes
        text = text.replace(/^(Patient|Dossier|Medical record)\s*:\s*/i, '').trim();
        
        // Check for civility (M., Mme, etc.)
        const civilityMatch = text.match(/^(M\.|Mme|Mlle|Mr|Mrs|Ms)\.?\s+/i);
        if (civilityMatch) {
            result.civilite = civilityMatch[1];
            text = text.substring(civilityMatch[0].length).trim();
        }
        
        // Split by spaces
        const parts = text.split(/\s+/).filter(p => p.length > 0);
        
        if (parts.length >= 2) {
            // Assume "Prénom NOM" or "NOM Prénom"
            // French names: typically uppercase = NOM, mixed case = Prénom
            if (parts[parts.length - 1] === parts[parts.length - 1].toUpperCase()) {
                // Last part is uppercase, likely NOM
                result.nom = parts[parts.length - 1];
                result.prenom = parts.slice(0, -1).join(' ');
            } else if (parts[0] === parts[0].toUpperCase()) {
                // First part is uppercase, likely NOM
                result.nom = parts[0];
                result.prenom = parts.slice(1).join(' ');
            } else {
                // Default: assume "Prénom NOM"
                result.prenom = parts.slice(0, -1).join(' ');
                result.nom = parts[parts.length - 1];
            }
        } else if (parts.length === 1) {
            result.nom = parts[0];
        }
        
        return result;
    }
    
    // Find value near a label element
    function findValueNearElement(element, label) {
        // Try next sibling
        let sibling = element.nextElementSibling;
        if (sibling && sibling.textContent.trim() && !sibling.textContent.toLowerCase().includes(label)) {
            return sibling.textContent.trim();
        }
        
        // Try parent's next sibling
        const parent = element.parentElement;
        if (parent) {
            sibling = parent.nextElementSibling;
            if (sibling && sibling.textContent.trim()) {
                return sibling.textContent.trim();
            }
        }
        
        // Try looking in the same row (table structure)
        const row = element.closest('tr');
        if (row) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                return cells[1].textContent.trim();
            }
        }
        
        // Try looking within the element itself (after the label)
        const fullText = element.textContent.trim();
        if (fullText.length > label.length + 2) {
            const afterLabel = fullText.substring(fullText.toLowerCase().indexOf(label) + label.length).trim();
            // Remove common separators
            return afterLabel.replace(/^[:：\s]+/, '').trim();
        }
        
        return null;
    }
    
    // Create floating button
    function createFloatingButton() {
        // Check if button already exists
        if (document.getElementById(BUTTON_CONTAINER_ID)) {
            return;
        }
        
        // Create container
        const container = document.createElement('div');
        container.id = BUTTON_CONTAINER_ID;
        
        // Create button
        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.innerHTML = '📋 Adresser ce patient';
        button.title = 'Ouvrir le widget d\'adressage avec les données du patient';
        
        button.addEventListener('click', () => {
            handleButtonClick();
        });
        
        container.appendChild(button);
        document.body.appendChild(container);
        
        floatingButton = button;
        console.log('Floating button created');
    }
    
    // Handle button click
    function handleButtonClick() {
        console.log('Button clicked - extracting patient data');
        patientData = extractPatientData();
        
        // Send message to extension popup
        chrome.runtime.sendMessage({
            action: 'patientDataExtracted',
            data: patientData
        }, (response) => {
            console.log('Message sent to extension:', response);
        });
        
        // Also store in chrome.storage for popup to retrieve
        chrome.storage.local.set({ 
            lastExtractedPatient: patientData,
            extractionTimestamp: Date.now()
        }, () => {
            console.log('Patient data saved to storage');
            // Show feedback
            showNotification('Données patient extraites ! Cliquez sur l\'icône de l\'extension.');
        });
    }
    
    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'widget-adressage-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Initialize
    function init() {
        console.log('Initializing content script...');
        
        // Check if we're on a patient page
        if (isPatientPage()) {
            console.log('Patient page detected');
            createFloatingButton();
        } else {
            console.log('Not a patient page, button not created');
        }
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'extractPatientData') {
                console.log('Received request to extract patient data');
                const data = extractPatientData();
                sendResponse({ success: true, data: data });
            }
            return true; // Keep channel open for async response
        });
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also watch for dynamic page changes (SPA navigation)
    let lastUrl = window.location.href;
    new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log('URL changed, re-initializing...');
            // Remove old button
            const oldButton = document.getElementById(BUTTON_CONTAINER_ID);
            if (oldButton) oldButton.remove();
            // Re-initialize
            setTimeout(init, 1000); // Wait for page to load
        }
    }).observe(document, { subtree: true, childList: true });
    
})();
