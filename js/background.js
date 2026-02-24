// background.js - Service worker
// Ecoute la demande d'ouverture du popup depuis le content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        // Sauvegarde les donnees patient avant d'ouvrir
        if (request.data) {
            chrome.storage.local.set({
                lastExtractedPatient: request.data,
                extractionTimestamp: Date.now()
            });
        }
        // Ouvre le popup de l'extension
        try {
            chrome.action.openPopup();
        } catch(e) {
            // fallback : ouvre popup.html dans un nouvel onglet si openPopup echoue
            chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
        }
        sendResponse({ success: true });
    }
    return true;
});
