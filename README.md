# R.Lynx™ RestFast — Application Web

Application de point de vente (PDV) pour restaurant, reconstruite en HTML/CSS/JS pur,
basée sur les fichiers de configuration `RLPOS.ini`, `RLPOSManager.ini` et `Uninstall.ini`.

---

## 📁 Structure des fichiers

```
restfast/
├── index.html          ← Page de connexion (login)
├── pos.html            ← Terminal de caisse (PDV)
├── manager.html        ← Back-office manager
│
├── css/
│   ├── style.css       ← Styles globaux, variables, boutons, modals
│   ├── login.css       ← Styles de la page de connexion
│   ├── pos.css         ← Styles du terminal PDV
│   └── manager.css     ← Styles du back-office
│
└── js/
    ├── db.js           ← Base de données locale (localStorage) + données démo
    ├── app.js          ← Authentification, Toast, Modal, Format, Sound, Clock
    ├── pos.js          ← Logique PDV: table, panier, paiement
    └── manager.js      ← Logique manager: dashboard, articles, rapports...
```

---

## 🚀 Démarrage rapide

1. Ouvrez `index.html` dans un navigateur moderne
2. Connexion avec les comptes démo:
   - **Manager**: `admin` / `1234`
   - **Caissier**: `caisse1` / `1111`
   - **Caissier 2**: `caisse2` / `2222`

---

## 🖥 Module PDV (pos.html)

- Sélection de table (20 tables)
- Navigation par catégories avec barre de recherche
- Mode geste (swipe vers le haut) pour le panneau de tâches
- Gestion du panier (ajouter, modifier quantité, supprimer)
- Paiement: Espèces, Carte, Mobile
- Impression de ticket (fenêtre navigateur)
- Reprise des commandes ouvertes

## 📊 Module Manager (manager.html)

- **Dashboard**: CA du jour, nb commandes, ticket moyen, graphiques
- **Commandes**: Historique complet
- **Tables**: Statut en temps réel, libération manuelle
- **Articles**: CRUD complet (ajouter, modifier, supprimer)
- **Catégories**: CRUD complet avec icône et couleur
- **Rapports**: Filtre par date, répartition paiements, meilleures ventes
- **Utilisateurs**: Gestion des comptes et rôles
- **Paramètres**: Nom restaurant, devise, TVA, options

---

## 💾 Stockage

Toutes les données sont stockées dans `localStorage` du navigateur.
Aucun serveur ni base de données externe n'est requis.

Pour réinitialiser: Paramètres → Réinitialiser (ou vider le localStorage)

---

## 🔧 Technologies

- HTML5 / CSS3 / JavaScript ES6+ (Vanilla)
- Polices: Rajdhani (display), IBM Plex Mono (mono), Nunito (body)
- Thème: Dark industriel / Accent ambre
- Aucune dépendance externe (fonctionnel hors-ligne)
