# Gertino — Portfolio monteur & vidéaste

Site statique (HTML/CSS/JS, sans framework ni serveur), prêt pour GitHub Pages.

## Fichiers
- `index.html` : accueil (vidéo de fond, à propos + vidéo de présentation, réalisations, spécialités, processus, contact)
- `portfolio.html` : toutes les vidéos, avec recherche
- `style.css` : tout le design (couleur d'accent : `--accent` dans le bloc « Thème rouge néon »)
- `script.js` : chargement des vidéos YouTube, défilement fluide, animations, formulaire
- `player.js` : lecteur vidéo maison (vidéo de présentation + vidéos YouTube)
- `config.js` : **les réglages** (clé API, playlist, vidéos à masquer, nombre de vidéos sur l'accueil)
- `assets/` : vidéo de fond (`fond-loop.mp4`), vidéo de présentation (`presentation.mp4`) et leurs images d'attente

## La « base de données » = la chaîne YouTube
Les vidéos publiques de la chaîne s'affichent automatiquement, de la plus récente à la plus ancienne.
Pour ajouter une vidéo : la publier sur YouTube, c'est tout.
Pour en cacher une : ajouter son ID dans `hiddenVideoIds` (config.js).

## Mise en ligne sur GitHub Pages
1. Sur github.com : **New repository** → nom au choix → **Public** → Create.
   (Nommé `NOMDUCOMPTE.github.io`, le site sera à la racine : https://NOMDUCOMPTE.github.io)
2. **Add file → Upload files** → glisser TOUT le contenu de ce dossier (y compris le dossier `assets`) → Commit.
3. **Settings → Pages** → Source : « Deploy from a branch » → Branch `main` / `/ (root)` → Save.
4. Attendre 1 à 2 minutes : l'adresse du site s'affiche en haut de la page Settings → Pages.

## ⚠ Important : clé API YouTube
La clé est limitée aux adresses autorisées. Si le nouveau site a une autre adresse que
`gertinovideaste.github.io`, ajoute-la sinon **les vidéos ne s'afficheront pas** :
Google Cloud Console → API et services → Identifiants → la clé → Restrictions d'application →
Référents HTTP → ajouter `https://NOMDUCOMPTE.github.io/*` → Enregistrer (effet sous ~5 min).

## Formulaire de contact
Pas de serveur : le formulaire ouvre un e-mail Gmail ou un message WhatsApp pré-rempli.
