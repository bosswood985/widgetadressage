# Widget d'Adressage Patient - Ophtalmologie

Widget web et extension Chrome pour l'adressage de patients en ophtalmologie. Permet d'**extraire automatiquement les données patient depuis Doctolib** ou d'importer un CSV patient, de générer un courrier d'adressage personnalisé et de l'envoyer par email.

## ✨ Nouveauté : Extension Chrome

L'outil est maintenant disponible en **deux versions** :

1. **🔌 Extension Chrome** (recommandée) : Extrait automatiquement les données patient directement depuis les pages Doctolib
2. **🌐 Version web standalone** : Fonctionne avec import CSV manuel

## 🎯 Fonctionnalités

### 🆕 Extension Chrome - Extraction Automatique depuis Doctolib
- **Détection automatique** des pages patient sur Doctolib (www.doctolib.fr et pro.doctolib.fr)
- **Bouton flottant "📋 Adresser ce patient"** sur les pages patient
- **Extraction automatique** des données patient depuis la page :
  - Nom, prénom, civilité
  - Date de naissance
  - Téléphone
  - Email
  - Adresse complète
  - Numéro de sécurité sociale
- **Pré-remplissage automatique** du formulaire d'adressage
- **Fallback CSV** : Import manuel toujours disponible

### 1. Import CSV Doctolib (Fallback)
- Import de fichiers CSV exportés depuis Doctolib
- Parsing automatique avec Papa Parse
- Affichage de la liste des patients dans un tableau
- Colonnes : Civilité, Nom, Prénom, Date de naissance, Téléphone, Email
- Support des différents formats de CSV Doctolib

### 2. Sélection du Patient
- Clic sur un patient pour le sélectionner
- Barre de recherche en temps réel (filtrage par nom/prénom)
- Affichage des informations complètes du patient sélectionné

### 3. Degré d'Urgence
5 niveaux d'urgence disponibles :
- 🔴 **Très Urgent** - Prise en charge immédiate nécessaire
- 🟠 **Urgent** - Sous 48h
- 🟡 **Semi-urgent** - Sous 1 semaine
- 🟢 **Normal** - Consultation programmée
- 🔵 **Suivi** - Consultation de suivi

### 4. Type de Prise en Charge
- Avis spécialisé
- Bilan complémentaire
- Prise en charge chirurgicale
- Injection intravitréenne
- Laser
- Exploration fonctionnelle
- Suivi post-opératoire
- Autre (champ libre)

### 5. Motifs d'Adressage avec Templates Automatiques
9 motifs ophtalmologiques prédéfinis avec textes types :
- **Cataracte**
- **Glaucome**
- **DMLA**
- **Rétinopathie diabétique**
- **Décollement de rétine** (URGENT)
- **Kératocône**
- **Strabisme**
- **Pathologie palpébrale**
- **Autre** (champ libre)

Chaque template contient des champs entre crochets [...] à personnaliser.

### 6. Génération et Envoi du Courrier
- Prévisualisation du courrier complet
- Génération automatique avec en-tête et pied de page
- Envoi par email via le client mail local (mailto:)
- Sujet formaté : `[URGENCE] Adressage - Motif - Patient Nom Prénom`

### 7. Paramètres Configurables
Stockés dans chrome.storage (extension) ou localStorage (standalone) :
- Nom du praticien expéditeur
- Spécialité
- Numéro RPPS
- Adresse du cabinet
- Téléphone
- Email du destinataire (ophtalmo)

## 📁 Structure du Projet

```
widgetadressage/
├── manifest.json           # 🆕 Chrome Extension manifest v3
├── popup.html              # 🆕 Extension popup (interface principale)
├── index.html              # Version standalone (web)
├── css/
│   ├── style.css          # Styles (thème médical bleu)
│   └── content-inject.css  # 🆕 Styles pour le bouton flottant Doctolib
├── js/
│   ├── content-script.js   # 🆕 Script d'extraction Doctolib
│   ├── popup.js            # 🆕 Logique de l'extension
│   ├── app.js             # Application standalone
│   ├── csv-parser.js      # Import et parsing CSV
│   ├── templates.js       # Templates de courrier
│   ├── email.js           # Génération et envoi email
│   └── settings.js        # Gestion des paramètres (chrome.storage + localStorage)
├── icons/                  # 🆕 Icônes de l'extension (16, 48, 128px)
└── README.md              # Documentation
```

## 🚀 Installation et Utilisation

### Option 1 : Extension Chrome (Recommandée)

#### Installation de l'extension

1. **Télécharger le code** :
   ```bash
   git clone https://github.com/bosswood985/widgetadressage.git
   # ou télécharger le ZIP depuis GitHub
   ```

2. **Ouvrir Chrome** et aller à `chrome://extensions/`

3. **Activer le mode développeur** (toggle en haut à droite)

4. **Cliquer sur "Charger l'extension non empaquetée"**

5. **Sélectionner le dossier** `widgetadressage/`

6. **L'extension est installée** ! Vous verrez l'icône 📋 dans la barre d'outils Chrome

#### Utilisation de l'extension

##### Première utilisation : Configuration
1. Cliquer sur l'icône de l'extension 📋 dans Chrome
2. Cliquer sur **⚙️ Paramètres**
3. Renseigner :
   - Nom du praticien
   - Email du destinataire (ophtalmo)
   - Autres informations optionnelles (RPPS, adresse, téléphone)
4. **Enregistrer**

##### Utilisation quotidienne sur Doctolib
1. **Aller sur Doctolib** (www.doctolib.fr ou pro.doctolib.fr)
2. **Ouvrir le dossier d'un patient**
3. Un **bouton flottant "📋 Adresser ce patient"** apparaît en bas à droite
4. **Cliquer sur le bouton** → Les données sont extraites automatiquement
5. **Cliquer sur l'icône de l'extension** dans Chrome
6. **Cliquer sur "✓ Utiliser ces données"** pour pré-remplir le formulaire
7. **Sélectionner** :
   - Degré d'urgence
   - Type de prise en charge
   - Motif d'adressage
8. Le **texte type est généré automatiquement**
9. **Personnaliser** le texte (compléter les champs entre [...])
10. **Prévisualiser** ou **Envoyer par email** 📧

##### Fallback : Import CSV
Si l'extraction automatique ne fonctionne pas :
1. Cliquer sur **"📁 Ou importer un fichier CSV"**
2. Sélectionner le fichier CSV exporté depuis Doctolib
3. Continuer normalement avec la sélection du patient

### Option 2 : Version Web Standalone

#### Installation
Aucune installation nécessaire ! Le widget fonctionne entièrement côté client.

1. Cloner ou télécharger le dépôt
2. Ouvrir `index.html` dans un navigateur web moderne
3. Configurer les paramètres (bouton ⚙️ en haut à droite)

#### Utilisation

##### Étape 1 : Configuration initiale
1. Cliquer sur le bouton **⚙️ Paramètres**
2. Renseigner :
   - Nom du praticien
   - Email du destinataire (ophtalmo)
   - Autres informations optionnelles
3. Enregistrer

##### Étape 2 : Import CSV
1. Cliquer sur **📁 Importer un fichier CSV**
2. Sélectionner le fichier CSV exporté depuis Doctolib
3. La liste des patients s'affiche automatiquement

##### Étape 3 : Sélection du patient
1. Utiliser la barre de recherche pour filtrer (optionnel)
2. Cliquer sur le patient souhaité dans le tableau
3. Le formulaire d'adressage s'affiche avec les infos du patient

##### Étape 4 : Remplir le formulaire
1. Sélectionner le degré d'urgence
2. Choisir le type de prise en charge
3. Sélectionner le motif d'adressage
4. Un texte type est généré automatiquement
5. Personnaliser le texte en remplissant les champs entre crochets [...]

##### Étape 5 : Prévisualiser et envoyer
1. Cliquer sur **👁️ Prévisualiser** pour voir le courrier complet
2. Cliquer sur **📧 Envoyer par Email**
3. Votre client mail s'ouvre avec le courrier prêt à envoyer

## 🎨 Design

Thème professionnel bleu médical :
- Background : bleu très clair (#EFF6FF)
- Header : bleu foncé (#1E3A5F)
- Accent : bleu médical (#2563EB)
- Cards avec coins arrondis et ombres douces
- Badges colorés pour les niveaux d'urgence
- Interface responsive (mobile-friendly)

## 🛠️ Technologies

- **HTML5** - Structure
- **CSS3** - Styles et mise en page
- **JavaScript Vanilla** - Logique (pas de framework)
- **Papa Parse 5.4.1** - Parsing CSV (via CDN)
- **localStorage** - Stockage des paramètres
- **mailto:** - Envoi d'email

## 📝 Format CSV Doctolib

Le CSV Doctolib doit contenir au minimum les colonnes suivantes (l'ordre et la casse peuvent varier) :
- `civilite` / `Civilité`
- `nom` / `Nom`
- `prenom` / `Prénom` / `prénom`
- `date_naissance` / `Date de naissance`
- `telephone` / `Téléphone`
- `email` / `Email`

Colonnes optionnelles supportées :
- `adresse` / `Adresse`
- `code_postal` / `Code postal`
- `ville` / `Ville`
- `numero_secu` / `Numéro sécurité sociale`

## 🔒 Sécurité et Confidentialité

- ✅ **100% côté client** : Aucune donnée n'est envoyée à un serveur
- ✅ **Pas de backend** : Tout le traitement se fait dans le navigateur
- ✅ **localStorage** : Les paramètres restent sur votre appareil
- ✅ **Pas de cookies tiers**
- ⚠️ **Important** : Les données CSV restent dans la mémoire du navigateur tant que la page est ouverte. Fermer l'onglet supprime toutes les données.

## 🌐 Navigateurs Supportés

- Chrome / Edge (recommandé)
- Firefox
- Safari
- Opera

Nécessite un navigateur moderne avec support de :
- ES6+ JavaScript
- localStorage
- FileReader API
- mailto: protocol handler

## 📱 Responsive

Le widget est entièrement responsive et s'adapte aux écrans :
- Desktop (> 768px)
- Tablette (768px - 1024px)
- Mobile (< 768px)

## 🤝 Contribution

Ce projet est open source. Les contributions sont les bienvenues !

## 📄 Licence

MIT License - Libre d'utilisation

## ⚕️ Usage Médical

Ce widget est un outil d'aide à la rédaction de courriers médicaux. Il ne remplace pas le jugement clinique du praticien. Toutes les informations doivent être vérifiées avant envoi.
