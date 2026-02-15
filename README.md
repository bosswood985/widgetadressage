# Widget d'Adressage Patient - Ophtalmologie

Widget web simple pour l'adressage de patients en ophtalmologie. Permet d'importer un CSV patient depuis Doctolib, de sélectionner un patient, de générer un courrier d'adressage personnalisé et de l'envoyer par email.

## 🎯 Fonctionnalités

### 1. Import CSV Doctolib
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
Stockés dans le localStorage du navigateur :
- Nom du praticien expéditeur
- Spécialité
- Numéro RPPS
- Adresse du cabinet
- Téléphone
- Email du destinataire (ophtalmo)

## 📁 Structure du Projet

```
widgetadressage/
├── index.html              # Page principale
├── css/
│   └── style.css          # Styles (thème médical bleu)
├── js/
│   ├── app.js             # Application principale
│   ├── csv-parser.js      # Import et parsing CSV
│   ├── templates.js       # Templates de courrier
│   ├── email.js           # Génération et envoi email
│   └── settings.js        # Gestion des paramètres
└── README.md              # Documentation
```

## 🚀 Installation et Utilisation

### Installation
Aucune installation nécessaire ! Le widget fonctionne entièrement côté client.

1. Cloner ou télécharger le dépôt
2. Ouvrir `index.html` dans un navigateur web moderne
3. Configurer les paramètres (bouton ⚙️ en haut à droite)

### Utilisation

#### Étape 1 : Configuration initiale
1. Cliquer sur le bouton **⚙️ Paramètres**
2. Renseigner :
   - Nom du praticien
   - Email du destinataire (ophtalmo)
   - Autres informations optionnelles
3. Enregistrer

#### Étape 2 : Import CSV
1. Cliquer sur **📁 Importer un fichier CSV**
2. Sélectionner le fichier CSV exporté depuis Doctolib
3. La liste des patients s'affiche automatiquement

#### Étape 3 : Sélection du patient
1. Utiliser la barre de recherche pour filtrer (optionnel)
2. Cliquer sur le patient souhaité dans le tableau
3. Le formulaire d'adressage s'affiche avec les infos du patient

#### Étape 4 : Remplir le formulaire
1. Sélectionner le degré d'urgence
2. Choisir le type de prise en charge
3. Sélectionner le motif d'adressage
4. Un texte type est généré automatiquement
5. Personnaliser le texte en remplissant les champs entre crochets [...]

#### Étape 5 : Prévisualiser et envoyer
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
