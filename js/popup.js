// popup.js - Extension popup logic (modifié)
// - Ajout : peupler les dropdowns (motif, urgence) selon tes demandes
// - Ajout : listener pour "✓ Utiliser ces données" qui récupère lastExtractedPatient
//           et remplit le formulaire / sélectionne le patient (via CSVParser).
// - Conserve la logique d'extraction (sendMessage / inject / executeScript)
// Usage : remplacer complètement js/popup.js par ce fichier puis reload l'extension.
(function () {
    'use strict';

    // Petit utilitaire DOM
    function q(sel) { return document.querySelector(sel); }
    function log(...args) { try { console.log('[Popup]', ...args); } catch (e) { } }

    // Populate les selects selon ta demande
    function populateSelects() {
        // Motifs demandés (labels utilisateur). Les valeurs doivent correspondre aux clés
        // connues par templates.js / EmailHandler quand possible, sinon 'other'.
        const motifs = [
            { value: 'other', label: 'Chirurgie réfractive' },           // pas de template dédié -> other
            { value: 'cataract', label: 'Chirurgie de la cataracte' },   // utilise template 'cataract'
            { value: 'intravitreal-injection', label: 'IVT (Injection intravitréenne)' }, // existing key
            { value: 'glaucoma', label: 'Glaucome' },                   // existing key
            { value: 'other', label: 'Chirurgie vitréorétinienne' },    // pas de template dédié -> other
            { value: 'laser', label: 'Laser (YAG / Argon)' },           // utilise template 'laser'
            { value: 'other', label: 'Autre (à préciser)' }            // fallback
        ];

        const referralReasonSelect = document.getElementById('referralReason');
        if (referralReasonSelect) {
            // vider existant
            referralReasonSelect.innerHTML = '';
            // ajouter option vide
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = '-- Sélectionner --';
            referralReasonSelect.appendChild(emptyOpt);

            motifs.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.value;
                opt.textContent = m.label;
                referralReasonSelect.appendChild(opt);
            });
        }

        // Urgences demandées : mapping sur valeurs existantes (très-urgent/urgent/normal)
        // pour rester compatibles avec EmailHandler (qui attend keys comme 'very-urgent', 'urgent', ...)
        const urgences = [
            { value: 'very-urgent', label: '🔴 Rouge - Rapide (dans la semaine)' }, // map to very-urgent
            { value: 'urgent', label: '🟠 Orange - 2 semaines' },                  // map to urgent
            { value: 'normal', label: '🟢 Vert - Dans le mois' }                   // map to normal
        ];

        const urgencySelect = document.getElementById('urgencyLevel');
        if (urgencySelect) {
            // garder la première option vide puis remplacer le reste
            const currentEmpty = urgencySelect.querySelector('option[value=""]');
            urgencySelect.innerHTML = '';
            urgencySelect.appendChild(currentEmpty || (function () {
                const e = document.createElement('option'); e.value = ''; e.textContent = '-- Sélectionner --'; return e;
            })());
            urgences.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.value;
                opt.textContent = u.label;
                urgencySelect.appendChild(opt);
            });
        }
    }

    // Affiche les données extraites dans le popup
    function displayAutoExtractedData(data) {
        const section = q('#autoExtractedSection');
        const infoDiv = q('#autoExtractedPatientInfo');
        let html = '';

        if (data && (data.civilite || data.nom || data.prenom)) {
            html += `<div class="patient-info-item"><span class="patient-info-label">Identité :</span> ${data.civilite || ''} ${data.prenom || ''} ${data.nom || ''}</div>`;
        }
        if (data && data.date_naissance) {
            html += `<div class="patient-info-item"><span class="patient-info-label">Date de naissance :</span> ${data.date_naissance}</div>`;
        }
        if (data && data.telephone) {
            html += `<div class="patient-info-item"><span class="patient-info-label">Téléphone :</span> ${data.telephone}</div>`;
        }
        if (data && data.email) {
            html += `<div class="patient-info-item"><span class="patient-info-label">Email :</span> ${data.email}</div>`;
        }

        if (!html) {
            html = '<p class="help-text">Aucune donnée patient détectée. Vous pouvez importer un CSV à la place.</p>';
        }

        if (infoDiv) infoDiv.innerHTML = html;
        if (section) section.style.display = 'block';
    }

    // Envoi d'un message au content script
    function sendExtractMessage(tabId) {
        return new Promise((resolve) => {
            try {
                chrome.tabs.sendMessage(tabId, { action: 'extractPatientData' }, (response) => {
                    if (chrome.runtime.lastError) {
                        log('sendMessage error:', chrome.runtime.lastError.message);
                        resolve({ ok: false, error: chrome.runtime.lastError });
                        return;
                    }
                    if (!response) {
                        resolve({ ok: false, error: 'no-response' });
                        return;
                    }
                    resolve({ ok: true, data: response.data });
                });
            } catch (err) {
                resolve({ ok: false, error: err });
            }
        });
    }

    // Inject content-script.js explicitement (fallback)
    function injectContentScript(tabId) {
        return new Promise((resolve) => {
            try {
                chrome.scripting.executeScript(
                    { target: { tabId: tabId }, files: ['js/content-script.js'] },
                    (injectionResults) => {
                        if (chrome.runtime.lastError) {
                            log('scripting.executeScript inject error:', chrome.runtime.lastError.message);
                            resolve({ ok: false, error: chrome.runtime.lastError });
                            return;
                        }
                        log('content-script injected (or already present)');
                        resolve({ ok: true });
                    }
                );
            } catch (err) {
                resolve({ ok: false, error: err });
            }
        });
    }

    // Fonction d'extraction à exécuter dans le contexte de la page (fallback fiable)
    // Renvoie { civilite, prenom, nom, date_naissance, telephone, email }
    function pageExtractionFunction() {
        function safeText(el) {
            if (!el) return null;
            try {
                const tag = el.tagName ? el.tagName.toLowerCase() : '';
                if (['script', 'style', 'iframe', 'noscript'].includes(tag)) return null;
                const txt = (el.textContent || '').replace(/\u00A0/g, ' ').trim();
                if (!txt) return null;
                if (/Rendez-?vous|VU PAR|Agenda|Historique|Statut du rendez/i.test(txt)) return null;
                return txt;
            } catch (e) { return null; }
        }

        function getCivilite() {
            const h3 = document.querySelector('.dl-left-panel-patient-card-info h3, .patient-identity h3, .dl-left-panel-patient-card-info > h3');
            const txt = safeText(h3);
            if (!txt) return '';
            if (/madame/i.test(txt)) return 'Madame';
            if (/monsieur|m\.|mr\b|monsieur/i.test(txt)) return 'Monsieur';
            return txt;
        }

        function getName() {
            // 1) container known
            const container = document.querySelector('.dl-left-panel-patient-card-info, .patient-card, .patient-header, .dl-profile-header');
            if (container) {
                const h1s = Array.from(container.querySelectorAll('h1')).map(s => (s.textContent || '').trim()).filter(Boolean);
                if (h1s.length >= 2) return { nom: h1s[0], prenom: h1s[1] };
                if (h1s.length === 1) {
                    const txt = h1s[0];
                    const pieces = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                    if (pieces.length >= 2) return { nom: pieces[0], prenom: pieces[1] };
                    const parts = txt.split(/\s+/).filter(Boolean);
                    if (parts.length === 1) return { nom: parts[0], prenom: '' };
                    return { prenom: parts.slice(0, -1).join(' '), nom: parts.slice(-1).join(' ') };
                }
            }
            // 2) global h1 fallback
            const globalH1s = Array.from(document.querySelectorAll('h1')).map(s => (s.textContent || '').trim()).filter(Boolean);
            if (globalH1s.length >= 2) return { nom: globalH1s[0], prenom: globalH1s[1] };
            if (globalH1s.length === 1) {
                const parts = globalH1s[0].split(/\s+/).filter(Boolean);
                if (parts.length === 1) return { nom: parts[0], prenom: '' };
                return { prenom: parts.slice(0, -1).join(' '), nom: parts.slice(-1).join(' ') };
            }
            return { nom: '', prenom: '' };
        }

        function getDateNaissance() {
            const leftPanel = document.querySelector('.dl-left-panel-patient-card-info, .dl-left-panel-content, .patient-info, .patient-card');
            const textToSearch = leftPanel ? (leftPanel.innerText || '') : (document.body.innerText || '');
            if (!textToSearch) return '';
            const dateRegex1 = /(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b)/;
            const m1 = textToSearch.match(dateRegex1);
            if (m1) return m1[1].trim();
            const dateRegex2 = /\b(\d{1,2}\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4})\b/i;
            const m2 = textToSearch.match(dateRegex2);
            if (m2) return m2[1].trim();
            const m3 = textToSearch.match(/([FM]\s*,\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
            if (m3) return m3[1].trim();
            return '';
        }

        function getTelephone() {
            const a = document.querySelector('[data-test-id="phone_number"], a[href^="tel:"]');
            if (!a) return '';
            const href = a.getAttribute('href') || '';
            if (href && href.toLowerCase().startsWith('tel:')) return href.replace(/^tel:/i, '');
            return (a.textContent || '').replace(/\u00A0/g, ' ').trim();
        }

        function getEmail() {
            const mail = document.querySelector('a[href^="mailto:"]');
            if (mail) {
                const h = mail.getAttribute('href') || '';
                return h.replace(/^mailto:/i, '').split('?')[0].trim();
            }
            const leftPanel = document.querySelector('.dl-left-panel-patient-card-info, .patient-card, .patient-info');
            if (leftPanel) {
                const emailLabel = Array.from(leftPanel.querySelectorAll('div,span,label,dt,dd')).find(el => {
                    const t = (el.textContent || '').toLowerCase();
                    return t.includes('e-mail') || t.includes('email') || t.includes('e mail');
                });
                if (emailLabel) {
                    const next = emailLabel.nextElementSibling;
                    if (next) return (next.textContent || '').trim();
                    const txt = (emailLabel.textContent || '');
                    const m = txt.match(/[:：]\s*(\S+@\S+\.\S+)/);
                    if (m) return m[1];
                }
            }
            const bodyText = document.body.innerText || '';
            const m = bodyText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
            return m ? m[0] : '';
        }

        try {
            const name = getName();
            return {
                civilite: getCivilite() || '',
                prenom: (name.prenom || '').trim(),
                nom: (name.nom || '').trim(),
                date_naissance: getDateNaissance() || '',
                telephone: getTelephone() || '',
                email: getEmail() || ''
            };
        } catch (e) {
            return { civilite: '', prenom: '', nom: '', date_naissance: '', telephone: '', email: '' };
        }
    }

    // Execute the pageExtractionFunction inside the active tab
    function runPageExtraction(tabId) {
        return new Promise((resolve) => {
            try {
                chrome.scripting.executeScript(
                    { target: { tabId: tabId }, func: pageExtractionFunction },
                    (injectionResults) => {
                        if (chrome.runtime.lastError) {
                            log('executeScript(func) error:', chrome.runtime.lastError.message);
                            resolve({ ok: false, error: chrome.runtime.lastError });
                            return;
                        }
                        if (!injectionResults || !injectionResults[0]) {
                            resolve({ ok: false, error: 'no-result' });
                            return;
                        }
                        resolve({ ok: true, data: injectionResults[0].result });
                    }
                );
            } catch (err) {
                resolve({ ok: false, error: err });
            }
        });
    }

    // Orchestration: try message, else inject + page extraction
    async function tryAutoExtract() {
        try {
            const tabs = await new Promise((res) => chrome.tabs.query({ active: true, currentWindow: true }, res));
            if (!tabs || tabs.length === 0) {
                log('No active tab found');
                return;
            }
            const tab = tabs[0];
            log('Active tab:', tab.url);

            // 1) try direct message
            let attempt = await sendExtractMessage(tab.id);
            if (attempt.ok && attempt.data) {
                log('Received patient data (direct):', attempt.data);
                chrome.storage.local.set({ lastExtractedPatient: attempt.data, extractionTimestamp: Date.now() });
                displayAutoExtractedData(attempt.data);
                return;
            }

            // 2) try injection of content script (best-effort)
            log('Direct message failed, trying injection + page extraction...');
            const injected = await injectContentScript(tab.id);
            if (!injected.ok) log('Injection failed (continuing):', injected.error);

            // 3) execute inline extraction function
            const pageAttempt = await runPageExtraction(tab.id);
            if (pageAttempt.ok && pageAttempt.data) {
                log('Received patient data (page extraction):', pageAttempt.data);
                chrome.storage.local.set({ lastExtractedPatient: pageAttempt.data, extractionTimestamp: Date.now() });
                displayAutoExtractedData(pageAttempt.data);
                return;
            } else {
                log('Page extraction failed:', pageAttempt.error);
            }
        } catch (err) {
            log('tryAutoExtract error:', err);
        }
    }

    // Listener messages pushed depuis content script (si le content-script pousse la data)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            log('Popup received message:', request);
            if (request.action === 'patientDataExtracted' && request.data) {
                displayAutoExtractedData(request.data);
                sendResponse({ success: true });
            }
            return true;
        });
    }

    // Récupère lastExtractedPatient et applique au formulaire / CSVParser
    function applyExtractedPatientAndOpenForm(data) {
        if (!data) return;
        try {
            // Si CSVParser disponible, on lui donne le patient et on appelle l'affichage
            if (typeof CSVParser !== 'undefined' && typeof CSVParser.normalizePatientData === 'function') {
                // normaliser si possible (pour garder clefs attendues)
                const normalized = CSVParser.normalizePatientData(data);
                CSVParser.selectedPatient = normalized;
                // Mettre à jour l'affichage via CSVParser
                if (typeof CSVParser.displaySelectedPatient === 'function') {
                    CSVParser.displaySelectedPatient();
                }
            } else if (typeof CSVParser !== 'undefined') {
                CSVParser.selectedPatient = data;
                if (typeof CSVParser.displaySelectedPatient === 'function') CSVParser.displaySelectedPatient();
            } else {
                // fallback: remplir zone selectedPatientInfo directement
                const infoDiv = document.getElementById('selectedPatientInfo');
                if (infoDiv) {
                    let html = '';
                    html += `<div class="patient-info-item"><span class="patient-info-label">Identité :</span> ${data.civilite || ''} ${data.prenom || ''} ${data.nom || ''}</div>`;
                    if (data.date_naissance) html += `<div class="patient-info-item"><span class="patient-info-label">Date de naissance :</span> ${data.date_naissance}</div>`;
                    if (data.telephone) html += `<div class="patient-info-item"><span class="patient-info-label">Téléphone :</span> ${data.telephone}</div>`;
                    if (data.email) html += `<div class="patient-info-item"><span class="patient-info-label">Email :</span> ${data.email}</div>`;
                    infoDiv.innerHTML = html;
                }
            }

            // Ouvrir la section formulaire et scroller
            const referralSection = document.getElementById('referralSection');
            if (referralSection) {
                referralSection.style.display = 'block';
                referralSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Pré-remplir motif & degré d'urgence par défaut
            const referralReasonSelect = document.getElementById('referralReason');
            const urgencySelect = document.getElementById('urgencyLevel');
            const letterContent = document.getElementById('letterContent');

            if (referralReasonSelect) {
                // par défaut sélectionne 'cataract' si la page contient 'cataract' dans le nom/métadonnees,
                // sinon 'other'
                const lname = ((data.nom || '') + ' ' + (data.prenom || '') + ' ' + (data.date_naissance || '') + ' ' + (data.email || '')).toLowerCase();
                if (lname.includes('cataract') || lname.includes('cataracte')) {
                    referralReasonSelect.value = 'cataract';
                } else if (lname.includes('glaucome') || lname.includes('glaucoma')) {
                    referralReasonSelect.value = 'glaucoma';
                } else {
                    referralReasonSelect.value = 'other';
                }
                // remplir lettre si possible
                if (typeof getTemplate === 'function' && letterContent) {
                    letterContent.value = getTemplate(referralReasonSelect.value);
                }
            }

            if (urgencySelect) {
                // par défaut 'normal' -> vert (dans le mois)
                urgencySelect.value = 'normal';
            }
        } catch (e) {
            console.error('applyExtractedPatientAndOpenForm error', e);
        }
    }

    // DOM ready
    document.addEventListener('DOMContentLoaded', function () {
        log('Popup DOMContentLoaded - init');

        // Peupler les selects personnalisés
        populateSelects();

        // Essayer d'extraire automatiquement les données (content script / fallback)
        tryAutoExtract();

        // Hooker le bouton "Utiliser ces données"
        const useBtn = document.getElementById('useAutoExtractedBtn');
        if (useBtn) {
            useBtn.addEventListener('click', function () {
                try {
                    // récupérer depuis chrome.storage.local (clé lastExtractedPatient)
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.get(['lastExtractedPatient'], (res) => {
                            const data = res && res.lastExtractedPatient ? res.lastExtractedPatient : null;
                            if (!data) {
                                alert("Aucune donnée patient disponible à utiliser.");
                                return;
                            }
                            applyExtractedPatientAndOpenForm(data);
                        });
                    } else {
                        // fallback localStorage
                        const stored = localStorage.getItem('lastExtractedPatient');
                        const data = stored ? JSON.parse(stored) : null;
                        if (!data) {
                            alert("Aucune donnée patient disponible à utiliser.");
                            return;
                        }
                        applyExtractedPatientAndOpenForm(data);
                    }
                } catch (err) {
                    console.error('useAutoExtractedBtn click error', err);
                    alert('Erreur interne lors de l\'utilisation des données.');
                }
            });
        }

        // UI hooks : mise à jour du textarea lorsque le motif change (utilise getTemplate si présent)
        const referralReasonSelect = document.getElementById('referralReason');
        const letterContentTextarea = document.getElementById('letterContent');
        if (referralReasonSelect && letterContentTextarea && typeof getTemplate === 'function') {
            referralReasonSelect.addEventListener('change', function () {
                const selectedReason = this.value;
                if (selectedReason) {
                    try {
                        const template = getTemplate(selectedReason);
                        letterContentTextarea.value = template;
                    } catch (e) {
                        // si getTemplate ne gère pas la clé, propose vide
                        letterContentTextarea.value = '';
                    }
                } else {
                    letterContentTextarea.value = '';
                }
            });
        }

        // Hook sur le bouton envoyer (conserve comportement existant)
        const sendEmailBtn = document.getElementById('sendEmailBtn');
        if (sendEmailBtn) {
            sendEmailBtn.addEventListener('click', function (e) {
                e.stopImmediatePropagation();
                if (typeof EmailHandler !== 'undefined' && EmailHandler.sendEmail) {
                    EmailHandler.sendEmail();
                }
            }, true);
        }
    });

})();