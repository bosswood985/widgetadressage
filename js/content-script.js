// content-script.js - Extraction simple : civilite, prenom, nom, date_naissance, telephone, email
// - Préfère sélecteurs structurés (data-test-id) et évite d'agréger tout le DOM
// - Renvoie le téléphone avec l'indicatif tel qu'il apparaît dans href ("tel:+...") si disponible
(function () {
    'use strict';

    const BUTTON_ID = 'widget-adressage-btn';
    const BUTTON_CONTAINER_ID = 'widget-adressage-container';

    function log(...args) { try { console.log('[Widget Adressage]', ...args); } catch (e) { } }

    // util : texte visible et non bruyant
    function safeText(el) {
        if (!el) return null;
        try {
            if (el.nodeType !== 1) return null;
            const tag = el.tagName.toLowerCase();
            if (['script', 'style', 'iframe', 'noscript'].includes(tag)) return null;
            const txt = (el.textContent || '').replace(/\u00A0/g, ' ').trim();
            if (!txt) return null;
            // filter obvious UI noise
            if (/Rendez-?vous|VU PAR|Agenda|Historique|Statut du rendez/i.test(txt)) return null;
            return txt;
        } catch (e) { return null; }
    }

    // récupère la civilité depuis un élément (e.g. "Madame", "Monsieur")
    function getCivilite() {
        const h3 = document.querySelector('.dl-left-panel-patient-card-info h3, .patient-card .dl-text-title, .patient-identity h3, .dl-left-panel-patient-card-info > h3');
        const txt = safeText(h3);
        if (!txt) return '';
        if (/madame/i.test(txt)) return 'Madame';
        if (/monsieur|m\.|mr\b|monsieur/i.test(txt)) return 'Monsieur';
        return txt;
    }

    // récupère nom/prenom : privilégie deux h1 consécutifs (ex: NOM / Prénom) ou h1 splitted
    function getName() {
        // try container first
        const container = document.querySelector('.dl-left-panel-patient-card-info, .patient-card, .patient-header, .dl-profile-header');
        if (container) {
            // find h1 inside container
            const h1s = Array.from(container.querySelectorAll('h1')).map(s => (s.textContent || '').trim()).filter(Boolean);
            if (h1s.length >= 2) {
                // common pattern: first = NOM (uppercase), second = prenom
                const nom = h1s[0];
                const prenom = h1s[1];
                return { nom, prenom };
            }
            if (h1s.length === 1) {
                const txt = h1s[0];
                // If the h1 contains newline pieces, split
                const pieces = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                if (pieces.length >= 2) return { nom: pieces[0], prenom: pieces[1] };
                // otherwise split on space: last token as nom, rest as prenom
                const parts = txt.split(/\s+/).filter(Boolean);
                if (parts.length === 1) return { nom: parts[0], prenom: '' };
                return { prenom: parts.slice(0, -1).join(' '), nom: parts.slice(-1).join(' ') };
            }
        }

        // fallback: global h1s on page
        const globalH1s = Array.from(document.querySelectorAll('h1')).map(s => (s.textContent || '').trim()).filter(Boolean);
        if (globalH1s.length >= 2) return { nom: globalH1s[0], prenom: globalH1s[1] };
        if (globalH1s.length === 1) {
            const txt = globalH1s[0];
            const parts = txt.split(/\s+/).filter(Boolean);
            if (parts.length === 1) return { nom: parts[0], prenom: '' };
            return { prenom: parts.slice(0, -1).join(' '), nom: parts.slice(-1).join(' ') };
        }
        return { nom: '', prenom: '' };
    }

    // récupérer date de naissance : recherche un pattern date typique dans la zone gauche
    function getDateNaissance() {
        // search near patient card
        const leftPanel = document.querySelector('.dl-left-panel-patient-card-info, .dl-left-panel-content, .patient-info, .patient-card');
        const textToSearch = leftPanel ? (leftPanel.innerText || '') : (document.body.innerText || '');
        if (!textToSearch) return '';
        // match dd/mm/yyyy or d/m/yyyy, or "20 novembre 1981" style
        const dateRegex1 = /(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b)/;
        const m1 = textToSearch.match(dateRegex1);
        if (m1) return m1[1].trim();
        // try verbose month names (fr)
        const dateRegex2 = /\b(\d{1,2}\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4})\b/i;
        const m2 = textToSearch.match(dateRegex2);
        if (m2) return m2[1].trim();
        // fallback: look for pattern "F, 20/11/1981"
        const m3 = textToSearch.match(/([FM]\s*,\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        if (m3) return m3[1].trim();
        return '';
    }

    // telephone : retourne le numéro tel:+... si disponible, sinon le texte visible (espaces normalisés)
    function getTelephone() {
        const a = document.querySelector('[data-test-id="phone_number"], a[href^="tel:"]');
        if (!a) return '';
        const href = a.getAttribute('href') || '';
        if (href && href.toLowerCase().startsWith('tel:')) {
            // return with +country if present (strip the "tel:")
            return href.replace(/^tel:/i, '');
        }
        // fallback displayed text
        const displayed = (a.textContent || '').replace(/\u00A0/g, ' ').trim();
        return displayed;
    }

    // email : prefer mailto:, else nearest labelled value
    function getEmail() {
        const mail = document.querySelector('a[href^="mailto:"]');
        if (mail) {
            const h = mail.getAttribute('href') || '';
            const addr = h.replace(/^mailto:/i, '').split('?')[0];
            return addr.trim();
        }
        // else search label "E-mail" near left panel
        const leftPanel = document.querySelector('.dl-left-panel-patient-card-info, .patient-card, .patient-info');
        if (leftPanel) {
            const emailLabel = Array.from(leftPanel.querySelectorAll('div,span,label,dt,dd')).find(el => {
                const t = (el.textContent || '').toLowerCase();
                return t.includes('e-mail') || t.includes('email') || t.includes('e mail');
            });
            if (emailLabel) {
                // next sibling or child
                const next = emailLabel.nextElementSibling;
                if (next) return (next.textContent || '').trim();
                // try within same element after colon
                const txt = (emailLabel.textContent || '');
                const m = txt.match(/[:：]\s*(\S+@\S+\.\S+)/);
                if (m) return m[1];
            }
        }
        // last resort: search body for an email
        const bodyText = document.body.innerText || '';
        const m = bodyText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        return m ? m[0] : '';
    }

    // build final object
    function extractPatient() {
        const civilite = getCivilite();
        const name = getName();
        const date_naissance = getDateNaissance();
        const telephone = getTelephone();
        const email = getEmail();

        return {
            civilite: civilite || '',
            prenom: (name.prenom || '').trim(),
            nom: (name.nom || '').trim(),
            date_naissance: date_naissance || '',
            telephone: telephone || '',
            email: email || ''
        };
    }

    // Crée le bouton ROUGE positionné dans le panneau gauche patient (haut gauche)
    function createFloatingButton() {
        if (document.getElementById(BUTTON_CONTAINER_ID)) return;

        const container = document.createElement('div');
        container.id = BUTTON_CONTAINER_ID;

        // Essaye d'insérer le bouton DANS le panneau gauche patient (juste après l'avatar/photo)
        // Sélecteurs connus du panneau gauche Doctolib
        const targetPanel = document.querySelector(
            '.dl-left-panel-patient-card-info, .dl-left-panel-patient-card, .patient-card-header, .patient-identity'
        );

        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.textContent = '📋 Adresser ce patient';
        Object.assign(btn.style, {
            background: '#DC2626',       // Rouge
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'block',
            width: '100%',
            marginTop: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
        });

        btn.addEventListener('mouseenter', () => { btn.style.background = '#B91C1C'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#DC2626'; });

        btn.addEventListener('click', () => {
            const data = extractPatient();
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ action: 'patientDataExtracted', data });
                }
            } catch (e) { }
            try { chrome.storage.local.set({ lastExtractedPatient: data, extractionTimestamp: Date.now() }); } catch (e) { }
            // quick visual feedback
            const n = document.createElement('div');
            n.style.cssText = 'position:fixed;top:60px;left:20px;background:#DC2626;color:#fff;padding:8px 14px;border-radius:6px;z-index:999999;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3);';
            n.textContent = '✓ Données patient extraites';
            document.body.appendChild(n);
            setTimeout(() => n.remove(), 2000);
        });

        container.appendChild(btn);

        if (targetPanel) {
            // Insertion dans le panneau gauche = apparaît exactement là où est le cercle rouge
            targetPanel.appendChild(container);
        } else {
            // Fallback : coin supérieur gauche en position fixe si le panneau n'est pas trouvé
            Object.assign(container.style, {
                position: 'fixed',
                top: '80px',
                left: '70px',
                zIndex: '999999'
            });
            document.body.appendChild(container);
        }
    }

    // expose message listener for popup sendMessage
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
            if (req && req.action === 'extractPatientData') {
                const data = extractPatient();
                sendResponse({ success: true, data });
            }
            return true;
        });
    }

    // init: add button if on patient page
    try {
        if ((/\/patients\/\d+|\/patient\/|\/dossier|\/appointments\//i).test(location.href)) {
            createFloatingButton();
        }
        // SPA navigation: simple url polling
        let lastUrl = location.href;
        setInterval(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                const existing = document.getElementById(BUTTON_CONTAINER_ID);
                if (existing) existing.remove();
                setTimeout(() => { if ((/\/patients\/\d+|\/patient\/|\/dossier|\/appointments\//i).test(location.href)) createFloatingButton(); }, 700);
            }
        }, 500);
    } catch (e) { log('init error', e); }

})();
