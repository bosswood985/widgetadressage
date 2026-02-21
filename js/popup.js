// popup.js - Extension popup logic (complet, prêt à coller)
//
// Comportement :
// - Au chargement du popup, tente d'extraire automatiquement les données patient.
// - Stratégie : sendMessage -> inject content-script -> executeScript(func) (fallback).
// - Affiche les champs : civilite, prenom, nom, date_naissance, telephone, email.
// - Stocke le résultat dans chrome.storage.local[lastExtractedPatient].
//
// Remplace complètement js/popup.js par ce fichier puis reload l'extension.
(function () {
    'use strict';

    // Petit utilitaire DOM
    function q(sel) { return document.querySelector(sel); }
    function log(...args) { try { console.log('[Popup]', ...args); } catch (e) { } }

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

    // Listen for pushed messages from content script (if content script pushes data)
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

    // DOM ready
    document.addEventListener('DOMContentLoaded', function () {
        log('Popup DOMContentLoaded - try auto extract');
        tryAutoExtract();

        // UI hooks: template select and send button (if present)
        const referralReasonSelect = document.getElementById('referralReason');
        const letterContentTextarea = document.getElementById('letterContent');
        if (referralReasonSelect && letterContentTextarea && typeof getTemplate === 'function') {
            referralReasonSelect.addEventListener('change', function () {
                const selectedReason = this.value;
                if (selectedReason) {
                    const template = getTemplate(selectedReason);
                    letterContentTextarea.value = template;
                } else {
                    letterContentTextarea.value = '';
                }
            });
        }

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