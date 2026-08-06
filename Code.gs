/**
 * ================================================================
 *  DIGITAL WEDDING INVITATION — GOOGLE APPS SCRIPT BACKEND
 *  Achmad Dairobbi & Indah Ambarwati
 * ================================================================
 *  What this does:
 *   - GET  request  -> returns all guestbook entries as JSON
 *   - POST request  -> saves a new RSVP / wish as a new sheet row
 *
 *  SETUP:
 *   1. Buat Google Spreadsheet baru (mis. "RSVP Undangan Achmad & Indah").
 *   2. Buka menu Extensions > Apps Script.
 *   3. Hapus kode default, tempel seluruh isi file ini, lalu simpan.
 *   4. Ganti nilai SHEET_ID di bawah dengan ID spreadsheet Anda
 *      (ambil dari URL: docs.google.com/spreadsheets/d/SHEET_ID/edit).
 *   5. Klik Deploy > New deployment.
 *      - Select type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   6. Klik Deploy, izinkan akses saat diminta, lalu salin URL Web App.
 *   7. Tempel URL tersebut ke CONFIG.GAS_URL pada file script.js.
 *   8. Setiap kali kode ini diubah, buat deployment baru (Manage
 *      deployments > Edit > New version) agar perubahan berlaku.
 * ================================================================
 */

const SHEET_ID = 'https://docs.google.com/spreadsheets/d/1JznmXTJH2j0RgQkM0dit1luSOSdBuPBC13v3ssZAL0Y/edit?gid=0#gid=0';
const SHEET_NAME = 'RSVP';

function doGet(e) {
  return respond(getGuestbook());
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    return respond(saveRSVP(payload));
  } catch (err) {
    return respond({ status: 'error', message: 'Data tidak valid: ' + err.message });
  }
}

/** Returns the target sheet, creating it with a header row on first use. */
function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Name', 'Attendance', 'Guests', 'Message']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Validates and appends one RSVP row. Uses a lock to avoid race conditions
 *  when multiple guests submit at nearly the same time. */
function saveRSVP(data) {
  const name = (data.name || '').toString().trim();
  const attendance = (data.attendance || '').toString().trim();
  const guests = parseInt(data.guests, 10) || 0;
  const message = (data.message || '').toString().trim();

  if (!name) return { status: 'error', message: 'Nama wajib diisi.' };
  if (attendance !== 'hadir' && attendance !== 'tidak_hadir') {
    return { status: 'error', message: 'Status kehadiran tidak valid.' };
  }
  if (name.length > 100) return { status: 'error', message: 'Nama terlalu panjang.' };
  if (message.length > 500) return { status: 'error', message: 'Pesan terlalu panjang.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet();
    sheet.appendRow([new Date(), name, attendance, guests, message]);
  } finally {
    lock.releaseLock();
  }

  return { status: 'success', message: 'Terima kasih, konfirmasi Anda telah kami terima.' };
}

/** Reads all rows (minus header) and returns them newest-first. */
function getGuestbook() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  values.shift(); // drop header row

  const data = values
    .filter((row) => row[1]) // must have a name
    .map((row) => ({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      name: row[1],
      attendance: row[2],
      guests: row[3],
      message: row[4],
    }))
    .reverse();

  return { status: 'success', data: data };
}

/** Wraps a plain object as a JSON ContentService response. */
function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
