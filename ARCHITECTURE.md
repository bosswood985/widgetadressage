# Architecture & Workflow

## 📁 Project Structure

```
widgetadressage/
│
├── 📄 manifest.json                    # Chrome Extension configuration
├── 📄 index.html                       # Standalone web version (original)
├── 📄 popup.html                       # Extension popup interface
│
├── 📁 js/
│   ├── content-script.js               # 🆕 Runs on Doctolib pages, extracts data
│   ├── popup.js                        # 🆕 Extension popup logic
│   ├── app.js                          # Standalone app logic (original)
│   ├── settings.js                     # 🔄 Settings (chrome.storage + localStorage)
│   ├── email.js                        # 🔄 Email generation (async compatible)
│   ├── csv-parser.js                   # CSV import (shared by both)
│   └── templates.js                    # Letter templates (shared by both)
│
├── 📁 css/
│   ├── style.css                       # Main styles (shared by both)
│   └── content-inject.css              # 🆕 Floating button styles
│
├── 📁 icons/
│   ├── icon16.png                      # 🆕 Extension icon 16x16
│   ├── icon48.png                      # 🆕 Extension icon 48x48
│   └── icon128.png                     # 🆕 Extension icon 128x128
│
└── 📁 docs/
    ├── README.md                       # 🔄 User guide (both versions)
    ├── TESTING.md                      # 🆕 Testing procedures
    └── SUMMARY.md                      # 🆕 Implementation summary

Legend:
🆕 = New file
🔄 = Modified file
(original) = Unchanged from original
```

## 🔄 Data Flow Diagrams

### Extension Mode - Auto-Extraction from Doctolib

```
┌─────────────────────────────────────────────────────────────┐
│                   1. User on Doctolib                        │
│         https://www.doctolib.fr/patients/12345               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              2. Content Script Activated                     │
│                 (content-script.js)                          │
│                                                              │
│  • Detects patient page                                     │
│  • Adds floating button "📋 Adresser ce patient"           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ User clicks button
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              3. Data Extraction                              │
│                                                              │
│  Scrapes from DOM:                                          │
│  • Name (h1, headers)                                       │
│  • Date of birth (labeled fields)                          │
│  • Phone, Email (input fields)                             │
│  • Address (structured data)                               │
│  • SSN (labeled fields)                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ chrome.runtime.sendMessage()
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              4. Store in chrome.storage                      │
│                                                              │
│  {                                                           │
│    lastExtractedPatient: { ... },                           │
│    extractionTimestamp: 1234567890                          │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Notification: "Données extraites!"
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              5. User Opens Extension                         │
│                 (clicks extension icon)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              6. Extension Popup Opens                        │
│                    (popup.html)                              │
│                                                              │
│  • Retrieves data from chrome.storage                       │
│  • Displays patient info                                    │
│  • Shows "✓ Utiliser ces données" button                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ User clicks "Use data"
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              7. Form Pre-filled                              │
│                                                              │
│  • Patient section: ✓ Filled                               │
│  • Urgency: Select                                          │
│  • Care type: Select                                        │
│  • Reason: Select → Template auto-filled                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              8. Generate & Send                              │
│                                                              │
│  • Customize letter                                         │
│  • Preview                                                  │
│  • Send via mailto:                                        │
└─────────────────────────────────────────────────────────────┘
```

### Standalone Mode - CSV Import

```
┌─────────────────────────────────────────────────────────────┐
│                   1. User Opens index.html                   │
│                  (in any web browser)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              2. Click "Import CSV"                           │
│                 (app.js + csv-parser.js)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Select file
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              3. Parse CSV with Papa Parse                    │
│                                                              │
│  civilite,nom,prenom,date_naissance,...                     │
│  M.,DUPONT,Jean,01/01/1980,...                              │
│  Mme,MARTIN,Marie,15/03/1975,...                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              4. Display Patients Table                       │
│                                                              │
│  [Search bar]                                               │
│  ┌────────┬───────┬────────┬──────────┬─────────┐         │
│  │ Civ.   │ Nom   │ Prénom │ Date     │ Tel     │         │
│  ├────────┼───────┼────────┼──────────┼─────────┤         │
│  │ M.     │ DUPON │ Jean   │ 01/01/80 │ 0601... │ ◄ Click│
│  │ Mme    │ MARTI │ Marie  │ 15/03/75 │ 0605... │         │
│  └────────┴───────┴────────┴──────────┴─────────┘         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Click on patient
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              5. Form Displayed with Patient Data             │
│                                                              │
│  Same workflow as Extension Mode (steps 7-8)                │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Permission & Storage Model

### Extension Permissions
```javascript
{
  "permissions": [
    "activeTab",      // Access current tab when user clicks
    "storage"         // Save settings locally
  ],
  "host_permissions": [
    "https://*.doctolib.fr/*"  // Only Doctolib domains
  ]
}
```

### Storage Comparison

| Feature | Extension Mode | Standalone Mode |
|---------|---------------|-----------------|
| **API** | `chrome.storage.local` | `localStorage` |
| **Async** | Yes (callback/promise) | No (synchronous) |
| **Scope** | Per Chrome profile | Per browser origin |
| **Sync** | Can sync across devices | Local only |
| **Encryption** | Yes (Chrome managed) | Browser dependent |
| **Size Limit** | ~10MB | ~5-10MB |

### Settings Storage

```javascript
// Extension Mode
chrome.storage.local.set({
  widgetAdressageSettings: {
    doctorName: "Dr. Test",
    recipientEmail: "ophtalmo@test.com",
    // ... other settings
  }
});

// Standalone Mode  
localStorage.setItem('widgetAdressageSettings', JSON.stringify({
  doctorName: "Dr. Test",
  recipientEmail: "ophtalmo@test.com",
  // ... other settings
}));
```

## 🎭 Component Interaction

### Message Passing (Extension)

```
┌──────────────────┐          ┌──────────────────┐
│  Content Script  │          │   Popup Script   │
│  (Doctolib page) │          │   (popup.js)     │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         │ chrome.runtime.sendMessage()│
         │────────────────────────────▶│
         │  { action: "patientData",   │
         │    data: {...} }            │
         │                             │
         │ chrome.storage.local.set()  │
         │────────────────────────────▶│
         │                    Store    │
         │                             │
         │◀────────────────────────────│
         │  { success: true }          │
         └─────────────────────────────┘
```

### Module Dependencies

```
Templates ───┐
             ▼
Settings ────┼──▶ Email ──▶ Popup/App
             ▲              (Main Logic)
CSV Parser ──┘
```

## 🧩 Code Reuse Strategy

| Module | Used By Extension | Used By Standalone | Shared? |
|--------|------------------|--------------------|---------|
| `templates.js` | ✅ | ✅ | ✅ 100% |
| `csv-parser.js` | ✅ | ✅ | ✅ 100% |
| `settings.js` | ✅ | ✅ | ✅ Dual mode |
| `email.js` | ✅ | ✅ | ✅ Async compatible |
| `style.css` | ✅ | ✅ | ✅ 100% |
| `content-script.js` | ✅ | ❌ | Extension only |
| `popup.js` | ✅ | ❌ | Extension only |
| `app.js` | ❌ | ✅ | Standalone only |

## 🔄 Backward Compatibility Layer

The key to maintaining both versions is the **dual-mode Settings module**:

```javascript
// settings.js - Dual mode implementation

const Settings = {
  isExtension() {
    return typeof chrome !== 'undefined' && chrome.storage;
  },
  
  load(callback) {
    if (this.isExtension()) {
      // Extension mode: async with chrome.storage
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        callback(result[this.STORAGE_KEY] || this.defaults);
      });
    } else {
      // Standalone mode: sync with localStorage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const settings = stored ? JSON.parse(stored) : this.defaults;
      callback(settings);
    }
  },
  
  save(settings, callback) {
    if (this.isExtension()) {
      chrome.storage.local.set({ [this.STORAGE_KEY]: settings }, () => {
        callback(true);
      });
    } else {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      callback(true);
    }
  }
};
```

This pattern allows the same codebase to run in both contexts!

## 🎨 UI/UX Flow

### Extension Popup UI States

```
State 1: No Data
┌─────────────────────────────────┐
│ Widget d'Adressage Patient      │
│ ⚙️  Paramètres                  │
├─────────────────────────────────┤
│ 1. Données Patient              │
│                                 │
│ 📁 Importez un fichier CSV      │
│ ou allez sur une page patient   │
│ Doctolib                        │
│                                 │
│ [📁 Importer un fichier CSV]   │
└─────────────────────────────────┘

State 2: Data Extracted
┌─────────────────────────────────┐
│ Widget d'Adressage Patient      │
│ ⚙️  Paramètres                  │
├─────────────────────────────────┤
│ 1. Données Patient              │
│                                 │
│ ✅ Données extraites Doctolib   │
│                                 │
│ ┌───────────────────────────┐  │
│ │ M. Jean DUPONT            │  │
│ │ Né le: 01/01/1980         │  │
│ │ Tel: 06 01 02 03 04       │  │
│ └───────────────────────────┘  │
│                                 │
│ [✓ Utiliser ces données]       │
│ [📁 Ou importer un CSV]        │
└─────────────────────────────────┘

State 3: Form Active
┌─────────────────────────────────┐
│ 3. Formulaire d'Adressage       │
├─────────────────────────────────┤
│ Patient: M. Jean DUPONT         │
│                                 │
│ Degré d'urgence *               │
│ [🟠 Urgent - Sous 48h      ▼]  │
│                                 │
│ Type de prise en charge *       │
│ [Avis spécialisé           ▼]  │
│                                 │
│ Motif d'adressage *             │
│ [Cataracte                 ▼]  │
│                                 │
│ Courrier d'adressage *          │
│ [Template text here...]         │
│                                 │
│ [👁️  Prévisualiser]            │
│ [📧 Envoyer par Email]         │
└─────────────────────────────────┘
```

### Floating Button on Doctolib

```
Doctolib Patient Page
┌──────────────────────────────────────────────┐
│ [Doctolib Header]                            │
│                                              │
│ Dossier Patient: M. Jean DUPONT             │
│ ┌──────────────────────────────────────┐    │
│ │ Informations personnelles            │    │
│ │ Date de naissance: 01/01/1980        │    │
│ │ Téléphone: 06 01 02 03 04            │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ [Patient medical history...]                │
│                                              │
│                                              │
│                     ┌───────────────────┐   │
│                     │ 📋 Adresser ce    │ ◄─┤── Floating Button
│                     │    patient         │   │   (bottom right)
│                     └───────────────────┘   │
└──────────────────────────────────────────────┘
```

## 🎯 Performance Considerations

### Content Script Optimization
- URL polling every 500ms (instead of MutationObserver on all DOM)
- Targeted DOM queries (not entire document)
- Lazy initialization (button only on patient pages)
- Data caching (5-minute expiration)

### Memory Management
- No memory leaks (event listeners cleaned up)
- Popup state resets on close
- Content script state isolated per page

### Load Times
- Manifest v3: Fast service worker
- Minimal permissions: Quick approval
- Lazy loading: Resources loaded as needed
- CDN for Papa Parse: Fast download

## 🔮 Future Enhancements

Possible improvements (not in current scope):
1. **Offline support**: Service worker caching
2. **Multi-language**: i18n support
3. **Firefox port**: Manifest v2 adaptation
4. **Advanced scraping**: ML-based field detection
5. **Batch processing**: Multiple patients
6. **PDF export**: Direct PDF generation
7. **Cloud sync**: Settings across devices
8. **Analytics**: Usage tracking (privacy-preserving)

---

For detailed testing procedures, see [TESTING.md](TESTING.md)

For user guide, see [README.md](README.md)

For implementation summary, see [SUMMARY.md](SUMMARY.md)
