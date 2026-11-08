/* =========================================================================
   apéruno — script Google Apps Script lié au Google Sheet de suivi.
   À coller dans le Sheet : Extensions → Apps Script (voir le README,
   « 📊 Suivi des salons »).

   1) doPost         → onglet « Salons » : une ligne au lancement d'une partie
                       (appelé par l'appli, src/analytics.js). Sans uid : ils
                       sont loggés en fin de partie dans « Parties ».
      doPost (event « suggestion ») → formulaire « Suggérer une amélioration »
                       de la home : ligne dans l'onglet « Suggestions » + mail
                       à SUGGEST_TO (src/analytics.js → sendSuggestion).
   2) logEndedRooms  → onglet « Parties » : une ligne par salon juste avant
                       sa suppression (TTL 12 h après la dernière activité).
                       À exécuter par un déclencheur horaire. Lit Firestore
                       avec le compte Google du propriétaire du script (il doit
                       avoir accès au projet Firebase).
   ========================================================================= */

var FIREBASE_PROJECT_ID = 'aperuno-spahd';
var PARTIES_SHEET = 'Parties';
var PARTIES_HEADERS = [
  'Code', 'Créée le', 'Mode', 'Nb joueurs', 'Cartes piochées', 'Partie finie',
  'Gagnant', 'Manches lancées', 'Début', 'Fin', 'Durée (min)', 'ID',
  'UIDs', 'UIDs arrivés en cours'
];
var PARTIES_ID_COL = 12; // colonne « ID » (sert à ne pas logger deux fois)
// Un salon est loggé quand il expire dans moins de 65 min (le déclencheur
// tourne toutes les heures) — ou s'il a déjà expiré sans être encore supprimé.
var LOG_BEFORE_EXPIRY_MS = 65 * 60 * 1000;

// Formulaire de suggestions.
var SUGGEST_TO = 'aperuno.app@gmail.com';
var SUGGEST_SHEET = 'Suggestions';
var SUGGEST_HEADERS = ['Date', 'Prénom', 'Contact', 'Message', 'Page', 'Navigateur'];
var SUGGEST_MAX_LEN = 3000;
var SUGGEST_MAX_PER_HOUR = 30; // garde-fou anti-spam global (quota Gmail ~100 mails/jour)

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  if (d.event === 'suggestion') return handleSuggestion_(d);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Salons') || ss.getSheets()[0];
  sheet.appendRow([
    new Date(d.at),                 // Date + heure
    d.code,                          // Code du salon
    d.mode,                          // chill / harr / premium
    d.playerCount,                   // Nombre de joueurs
    (d.players || []).join(', '),    // Pseudos (pas de photo — RGPD)
    d.id || '',                      // ID du salon (= colonne ID de « Parties »)
    d.accounts == null ? '' : d.accounts // nb de joueurs connectés à un compte
  ]);
  return ContentService.createTextOutput('ok');
}

function handleSuggestion_(d) {
  var ok = ContentService.createTextOutput('ok');
  if (d.website) return ok;                              // pot de miel rempli → robot
  var msg = String(d.message || '').trim().slice(0, SUGGEST_MAX_LEN);
  if (msg.length < 5) return ok;
  var name = String(d.name || '').trim().slice(0, 40);
  var contact = String(d.contact || '').trim().slice(0, 120);
  var page = String(d.page || '').slice(0, 200);
  var ua = String(d.ua || '').slice(0, 300);

  // Limite globale : au-delà de N suggestions / heure, on ignore.
  var cache = CacheService.getScriptCache();
  var count = Number(cache.get('suggest_count') || 0);
  if (count >= SUGGEST_MAX_PER_HOUR) return ok;
  cache.put('suggest_count', String(count + 1), 3600);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SUGGEST_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SUGGEST_SHEET);
    sheet.appendRow(SUGGEST_HEADERS);
    sheet.setFrozenRows(1);
  }
  // Préfixe « ' » : empêche l'interprétation de formules (=, +, -, @).
  var safe = function (v) { return /^[=+\-@]/.test(v) ? "'" + v : v; };
  sheet.appendRow([new Date(), safe(name), safe(contact), safe(msg), page, ua]);

  var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  var opts = {
    to: SUGGEST_TO,
    subject: '💡 apéruno — suggestion' + (name ? ' de ' + name : ''),
    body: msg + '\n\n— ' + (name || 'Anonyme') + (contact ? ' (' + contact + ')' : '') +
      '\nPage : ' + page + '\nNavigateur : ' + ua,
    name: 'apéruno'
  };
  if (isEmail) opts.replyTo = contact;                   // « Répondre » écrit directement au joueur
  MailApp.sendEmail(opts);
  return ok;
}

function logEndedRooms() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    var sheet = partiesSheet_();
    var logged = loggedIds_(sheet);
    var limit = Date.now() + LOG_BEFORE_EXPIRY_MS;
    var rows = [];
    listRooms_().forEach(function (room) {
      var st = room.stats;
      if (!st || !st.startedAt) return;                 // jamais lancée
      if (!room.expireAt || room.expireAt.getTime() > limit) return; // encore active
      var id = room.code + '-' + room.createdAt;
      if (logged[id]) return;                            // déjà loggée
      var end = st.endedAt || st.lastAt || st.startedAt;
      var players = st.players || {};
      var late = st.late || {};
      // uid Firebase (= users/{uid}) ; `true` = ancien salon sans uid.
      var uidOf = function (pid) { return typeof players[pid] === 'string' ? players[pid] : ''; };
      var ids = Object.keys(players);
      rows.push([
        room.code,
        new Date(room.createdAt),
        room.mode || '',
        ids.length,
        st.draws || 0,
        (st.wins || 0) > 0 ? 'Oui' : 'Non',
        st.winner || '',
        st.games || 0,
        new Date(st.startedAt),
        new Date(end),
        Math.round((end - st.startedAt) / 60000),
        id,
        ids.map(uidOf).filter(String).join(', '),
        Object.keys(late).map(uidOf).filter(String).join(', ')
      ]);
      logged[id] = true;
    });
    if (rows.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, PARTIES_HEADERS.length).setValues(rows);
    }
  } finally {
    lock.releaseLock();
  }
}

function partiesSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PARTIES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PARTIES_SHEET);
    sheet.appendRow(PARTIES_HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() < PARTIES_HEADERS.length) {
    // Onglet créé avant l'ajout de colonnes : on complète les en-têtes.
    sheet.getRange(1, 1, 1, PARTIES_HEADERS.length).setValues([PARTIES_HEADERS]);
  }
  return sheet;
}

function loggedIds_(sheet) {
  var ids = {};
  var n = sheet.getLastRow() - 1;
  if (n < 1) return ids;
  sheet.getRange(2, PARTIES_ID_COL, n, 1).getValues().forEach(function (r) {
    if (r[0]) ids[r[0]] = true;
  });
  return ids;
}

/* Liste les salons via l'API REST Firestore (sans les mains ni les photos). */
function listRooms_() {
  var base = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID +
    '/databases/(default)/documents/rooms';
  var fields = ['code', 'mode', 'createdAt', 'expireAt', 'stats'];
  var mask = fields.map(function (f) { return 'mask.fieldPaths=' + f; }).join('&');
  var token = ScriptApp.getOAuthToken();
  var rooms = [];
  var pageToken = '';
  do {
    var url = base + '?pageSize=300&' + mask + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
    var res = UrlFetchApp.fetch(url, {
      // X-Goog-User-Project : facture/quota sur le projet Firebase (sinon
      // Google exige d'activer Firestore dans le projet caché d'Apps Script).
      headers: { Authorization: 'Bearer ' + token, 'X-Goog-User-Project': FIREBASE_PROJECT_ID },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) throw new Error('Firestore ' + res.getResponseCode() + ' : ' + res.getContentText());
    var body = JSON.parse(res.getContentText());
    (body.documents || []).forEach(function (doc) {
      rooms.push(decodeFields_(doc.fields || {}));
    });
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return rooms;
}

function decodeFields_(fields) {
  var out = {};
  Object.keys(fields).forEach(function (k) { out[k] = decodeValue_(fields[k]); });
  return out;
}

function decodeValue_(v) {
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return new Date(v.timestampValue);
  if ('mapValue' in v) return decodeFields_(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue_);
  return null;
}
