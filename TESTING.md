# Testing Guide for Widget Adressage

## Chrome Extension Testing

### 1. Installation Test

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `widgetadressage` directory
5. **Expected Result**: Extension appears in the list with:
   - Name: "Widget Adressage Patient"
   - Version: "1.0.0"
   - Blue medical icon visible
   - No errors in the console

### 2. Extension Popup Test

1. Click on the extension icon in Chrome toolbar
2. **Expected Result**: Popup opens showing:
   - Header: "Widget d'Adressage Patient - Ophtalmologie"
   - Settings button (⚙️)
   - Section "1. Données Patient"
   - Message about importing CSV or using Doctolib
   - CSV upload button

### 3. Settings Test (Extension)

1. Click on extension icon
2. Click "⚙️ Paramètres"
3. Fill in test data:
   - Nom du praticien: "Dr. Test Médecin"
   - Spécialité: "Médecin généraliste"
   - RPPS: "12345678901"
   - Adresse: "123 Rue de Test, 75001 Paris"
   - Téléphone: "01 02 03 04 05"
   - Email du destinataire: "ophtalmo@test.com"
4. Click "💾 Enregistrer"
5. **Expected Result**: Alert "Paramètres enregistrés avec succès !"
6. Reopen settings
7. **Expected Result**: All fields still contain the saved values

### 4. Content Script Test on Mock Doctolib Page

Since we can't access real Doctolib pages, we'll create a mock page:

1. Create a local HTML file simulating a Doctolib patient page
2. Add patient data in DOM elements
3. Load the extension
4. **Expected Result**: Floating button "📋 Adresser ce patient" appears
5. Click the button
6. **Expected Result**: Notification appears "Données patient extraites !"

### 5. CSV Import Test (Fallback)

1. Click extension icon
2. Click "📁 Ou importer un fichier CSV"
3. Select a test CSV file with format:
   ```
   civilite,nom,prenom,date_naissance,telephone,email
   M.,DUPONT,Jean,01/01/1980,0601020304,jean.dupont@test.com
   Mme,MARTIN,Marie,15/03/1975,0605060708,marie.martin@test.com
   ```
4. **Expected Result**: 
   - "Section 2. Sélection du Patient" appears
   - Table shows 2 patients
   - Search bar is functional
5. Click on a patient
6. **Expected Result**: 
   - "Section 3. Formulaire d'Adressage" appears
   - Patient info is displayed correctly

### 6. Referral Form Test

1. After selecting a patient:
2. Select "Degré d'urgence": 🟠 Urgent
3. Select "Type de prise en charge": Avis spécialisé
4. Select "Motif d'adressage": Cataracte
5. **Expected Result**: Letter template appears in textarea with cataract text
6. Modify the template (fill in brackets)
7. Click "👁️ Prévisualiser"
8. **Expected Result**: Preview modal opens with formatted letter including:
   - Doctor info
   - Date
   - Patient info
   - Urgency level
   - Letter content
   - Footer with signature

### 7. Email Generation Test

1. After filling the form completely:
2. Click "📧 Envoyer par Email"
3. **Expected Result**: 
   - Default email client opens (or browser asks for permission)
   - Email has:
     - To: ophtalmo@test.com
     - Subject: "[🟠 Urgent] Adressage - Cataracte - Patient Jean DUPONT"
     - Body: Complete formatted letter

### 8. Validation Tests

Test that validation works:
1. Try to send email without selecting patient → Error message
2. Try to send without urgency → Error message
3. Try to send without care type → Error message
4. Try to send without reason → Error message
5. Try to send without letter content → Error message

## Standalone Version Testing

### 1. Loading Test

1. Open `index.html` in Chrome (without extension)
2. **Expected Result**: Page loads correctly with all UI elements

### 2. Settings Test (Standalone)

1. Click "⚙️ Paramètres"
2. Fill in test data
3. Save
4. Reload page
5. **Expected Result**: Settings are persisted in localStorage

### 3. CSV Import Test (Standalone)

Same as extension CSV test above.

### 4. Full Workflow Test (Standalone)

1. Configure settings
2. Import CSV
3. Select patient
4. Fill form
5. Preview
6. Send email
7. **Expected Result**: All features work without extension context

## Known Limitations

### Content Script (Doctolib Extraction)
- **Cannot be fully tested without access to real Doctolib pages**
- The extraction logic is based on common patterns but may need adjustment for:
  - Different Doctolib page layouts (www.doctolib.fr vs pro.doctolib.fr)
  - Changes in Doctolib DOM structure
  - Different patient page types

### Suggested Testing on Real Doctolib
When testing on actual Doctolib:
1. Check browser console for content script messages
2. Verify floating button appears on patient pages
3. Click button and check if data is extracted
4. Open extension popup to see if data appears
5. Report any missing fields or extraction errors

## Browser Compatibility

### Extension
- ✅ Chrome/Chromium (Manifest v3)
- ✅ Edge (Chromium-based)
- ❌ Firefox (requires Manifest v2 adaptation)
- ❌ Safari (requires different extension format)

### Standalone
- ✅ Chrome
- ✅ Firefox
- ✅ Edge
- ✅ Safari (modern versions)

## Security Considerations

### Tested
- ✅ No external data transmission
- ✅ chrome.storage for extension (local only)
- ✅ localStorage for standalone (local only)
- ✅ HTML sanitization in CSV parser
- ✅ No eval() or innerHTML with user data

### To Verify
- Input validation for all form fields
- XSS prevention in patient data display
- Email encoding for special characters

## Performance

### Expected Behavior
- Extension popup should open in < 500ms
- CSV parsing should handle files up to 1000 patients
- Search/filter should be instant (< 100ms)
- No memory leaks when switching patients

## Troubleshooting

### Extension doesn't load
- Check `chrome://extensions/` for errors
- Verify manifest.json is valid
- Check if icons exist

### Content script not working
- Check if URL matches pattern in manifest
- Look for console errors in page
- Verify permissions are granted

### Settings not saving
- Check browser console for storage errors
- Verify chrome.storage permission (extension)
- Check localStorage is enabled (standalone)

### Email not opening
- Verify default email client is configured
- Check if mailto: protocol is handled
- Try with a different email client
