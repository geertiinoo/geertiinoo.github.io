// ─────────────────────────────────────────────────────────────
//  CONFIGURATION DU SITE — le seul fichier à modifier
// ─────────────────────────────────────────────────────────────
//  La « base de données » du portfolio, c'est la chaîne YouTube :
//  chaque vidéo publique publiée sur la chaîne apparaît
//  automatiquement sur le site (de la plus récente à la plus ancienne).
//
//  ⚠ La clé API est restreinte par référent HTTP dans Google Cloud
//  Console. Si le nouveau site est servi depuis une autre adresse
//  (autre compte GitHub, domaine perso…), ajoute cette adresse
//  dans les restrictions de la clé, sinon les vidéos ne chargeront pas.
// ─────────────────────────────────────────────────────────────
window.SITE_CONFIG = {
  youtubeApiKey: 'AIzaSyBN7yFB3IiSgde6cliPlmJYnnhV0KexC1s',

  // Playlist « uploads » de la chaîne (= ID de chaîne avec « UU » au lieu de « UC »)
  uploadsPlaylistId: 'UUKHgYX0vGJ_hnzshUNARHXQ',


  // Vidéos à masquer du portfolio (IDs YouTube), ex. ['abc123XYZ']
  hiddenVideoIds: [],

  // Nombre de vidéos dans la bande « Dernières réalisations » de l'accueil
  homeLimit: 8,

  // Durée du cache navigateur (minutes) pour économiser le quota YouTube
  cacheMinutes: 30,
};
