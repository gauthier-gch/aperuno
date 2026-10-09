/* =========================================================================
   apéruno — script Google Apps Script lié au Google Sheet de suivi.
   À coller dans le Sheet : Extensions → Apps Script (voir le README,
   « 📊 Suivi des salons »).

   1) doPost         → onglet « Salons » : une ligne au lancement d'une partie
                       (appelé par l'appli, src/analytics.js).
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
  'Gagnant', 'Manches lancées', 'Début', 'Fin', 'Durée (min)', 'ID'
];
// Un salon est loggé quand il expire dans moins de 65 min (le déclencheur
// tourne toutes les heures) — ou s'il a déjà expiré sans être encore supprimé.
var LOG_BEFORE_EXPIRY_MS = 65 * 60 * 1000;

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Salons') || ss.getSheets()[0];
  var d = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(d.at),                 // Date + heure
    d.code,                          // Code du salon
    d.mode,                          // chill / harr / premium
    d.playerCount,                   // Nombre de joueurs
    (d.players || []).join(', '),    // Pseudos (pas de photo — RGPD)
    d.id || ''                       // ID du salon (= colonne ID de « Parties »)
  ]);
  return ContentService.createTextOutput('ok');
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
      rows.push([
        room.code,
        new Date(room.createdAt),
        room.mode || '',
        Object.keys(st.players || {}).length,
        st.draws || 0,
        (st.wins || 0) > 0 ? 'Oui' : 'Non',
        st.winner || '',
        st.games || 0,
        new Date(st.startedAt),
        new Date(end),
        Math.round((end - st.startedAt) / 60000),
        id
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
  }
  return sheet;
}

function loggedIds_(sheet) {
  var ids = {};
  var n = sheet.getLastRow() - 1;
  if (n < 1) return ids;
  sheet.getRange(2, PARTIES_HEADERS.length, n, 1).getValues().forEach(function (r) {
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
