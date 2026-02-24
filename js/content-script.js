// content-script.js
(function () {
    'use strict';

    const BUTTON_ID = 'widget-adressage-btn';
    const BUTTON_CONTAINER_ID = 'widget-adressage-container';

    function log(...args) { try { console.log('[Widget Adressage]', ...args); } catch (e) { } }

    function safeText(el) {
        if (!el) return null;
        try {
            if (el.nodeType !== 1) return null;
            const tag = el.tagName.toLowerCase();
            if (['script', 'style', 'iframe', 'noscript'].includes(tag)) return null;
            const txt = (el.textContent || '').replace(/\u00A0/g, ' ').trim();
            if (!txt) return null;
            if (/Rendez-?vous|VU PAR|Agenda|Historique|Statut du rendez/i.test(txt)) return null;
            return txt;
        } catch (e) { return null; }
    }

    function getCivilite() {
        const h3 = document.querySelector('.dl-left-panel-patient-card-info h3, .patient-card .dl-text-title, .patient-identity h3, .dl-left-panel-patient-card-info > h3');
        const txt = safeText(h3);
        if (!txt) return '';
        if (/madame/i.test(txt)) return 'Madame';
        if (/monsieur|m\.|mr\b/i.test(txt)) return 'Monsieur';
        return txt;
    }

    function getName() {
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
        const m1 = textToSearch.match(/(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b)/);
        if (m1) return m1[1].trim();
        const m2 = textToSearch.match(/\b(\d{1,2}\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4})\b/i);
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
        if (mail) return (mail.getAttribute('href') || '').replace(/^mailto:/i, '').split('?')[0].trim();
        const leftPanel = document.querySelector('.dl-left-panel-patient-card-info, .patient-card, .patient-info');
        if (leftPanel) {
            const emailLabel = Array.from(leftPanel.querySelectorAll('div,span,label,dt,dd')).find(el => {
                const t = (el.textContent || '').toLowerCase();
                return t.includes('e-mail') || t.includes('email');
            });
            if (emailLabel) {
                const next = emailLabel.nextElementSibling;
                if (next) return (next.textContent || '').trim();
                const m = (emailLabel.textContent || '').match(/[:\uff1a]\s*(\S+@\S+\.\S+)/);
                if (m) return m[1];
            }
        }
        const m = (document.body.innerText || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        return m ? m[0] : '';
    }

    function extractPatient() {
        const name = getName();
        return {
            civilite: getCivilite() || '',
            prenom: (name.prenom || '').trim(),
            nom: (name.nom || '').trim(),
            date_naissance: getDateNaissance() || '',
            telephone: getTelephone() || '',
            email: getEmail() || ''
        };
    }

    function createFloatingButton() {
        if (document.getElementById(BUTTON_CONTAINER_ID)) return;

        const container = document.createElement('div');
        container.id = BUTTON_CONTAINER_ID;
        // Position fixe en haut à gauche, sous la barre de navigation Doctolib
        Object.assign(container.style, {
            position: 'fixed',
            top: '108px',
            left: '8px',
            zIndex: '999999',
            width: '290px'
        });

        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.textContent = '\uD83D\uDCCB Adresser ce patient';
        Object.assign(btn.style, {
            background: '#DC2626',
            color: '#fff',
            border: 'none',
            padding: '9px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            width: '100%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            letterSpacing: '0.3px'
        });

        btn.addEventListener('mouseenter', () => { btn.style.background = '#B91C1C'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#DC2626'; });

        btn.addEventListener('click', () => {
            const data = extractPatient();
            try {
                chrome.storage.local.set({ lastExtractedPatient: data, extractionTimestamp: Date.now() });
            } catch (e) { }
            try {
                if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ action: 'patientDataExtracted', data });
                }
            } catch (e) { }
            // Feedback visuel bref
            const n = document.createElement('div');
            n.style.cssText = 'position:fixed;top:148px;left:8px;background:#15803d;color:#fff;padding:6px 14px;border-radius:6px;z-index:999999;font-weight:bold;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.3);';
            n.textContent = '\u2713 Patient extrait — ouvrez le widget';
            document.body.appendChild(n);
            setTimeout(() => n.remove(), 2500);
        });

        container.appendChild(btn);
        document.body.appendChild(container);
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
            if (req && req.action === 'extractPatientData') {
                sendResponse({ success: true, data: extractPatient() });
            }
            return true;
        });
    }

    try {
        if ((/\/patients\/\d+|\/patient\/|\/dossier|\/appointments\//i).test(location.href)) {
            createFloatingButton();
        }
        let lastUrl = location.href;
        setInterval(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                const existing = document.getElementById(BUTTON_CONTAINER_ID);
                if (existing) existing.remove();
                setTimeout(() => {
                    if ((/\/patients\/\d+|\/patient\/|\/dossier|\/appointments\//i).test(location.href)) createFloatingButton();
                }, 700);
            }
        }, 500);
    } catch (e) { log('init error', e); }

})();
