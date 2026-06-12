/*******************************************************
 * STAVIAN LME DASHBOARD - GOOGLE APPS SCRIPT BACKEND
 *
 * Cách dùng:
 * 1) Nếu Apps Script được mở từ chính file Google Sheet Stavian
 *    thì có thể để SPREADSHEET_ID = ''.
 * 2) Nếu Apps Script là project riêng/standalone, hãy paste ID
 *    của Google Sheet Stavian vào SPREADSHEET_ID.
 *    ID nằm trong URL Google Sheet:
 *    https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
 *******************************************************/

const SPREADSHEET_ID = ''; // <-- Dán Google Sheet ID tại đây nếu project Apps Script không gắn trực tiếp với Sheet.
const DEFAULT_SHEET = 'News';

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const sheetName = params.sheet || DEFAULT_SHEET;
    const callback = params.callback || '';

    let payload;
    if (sheetName === 'News') {
      payload = getNewsData_();
    } else {
      payload = getGenericSheetData_(sheetName);
    }

    payload.success = true;
    payload.sheet = sheetName;
    payload.updatedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

    return output_(payload, callback);
  } catch (err) {
    const callback = e && e.parameter ? (e.parameter.callback || '') : '';
    return output_({
      success: false,
      error: String(err && err.message ? err.message : err),
      updatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss')
    }, callback);
  }
}

/**
 * API cho sheet News.
 * Format sheet theo ảnh:
 * A: Ngày
 * B-D: Nhôm | Tóm tắt / Nguồn / Thời gian
 * E-G: Đồng | Tóm tắt / Nguồn / Thời gian
 * H-J: Kẽm  | Tóm tắt / Nguồn / Thời gian
 * Dữ liệu bắt đầu từ hàng 3.
 */
function getNewsData_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName('News');
  if (!sheet) throw new Error('Không tìm thấy sheet "News". Kiểm tra đúng tên sheet trong Google Sheets.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 3) {
    return {
      type: 'news',
      rows: [],
      dates: [],
      count: 0
    };
  }

  const values = sheet.getRange(3, 1, lastRow - 2, 10).getDisplayValues();
  const rows = [];
  let currentDate = '';

  values.forEach((r, index) => {
    const clean = r.map(v => String(v || '').trim());
    const hasAnyValue = clean.some(Boolean);
    if (!hasAnyValue) return;

    if (clean[0]) currentDate = clean[0];

    rows.push({
      rowNumber: index + 3,
      date: clean[0] || currentDate,
      aluminum: {
        summary: clean[1],
        source: clean[2],
        time: clean[3]
      },
      copper: {
        summary: clean[4],
        source: clean[5],
        time: clean[6]
      },
      zinc: {
        summary: clean[7],
        source: clean[8],
        time: clean[9]
      }
    });
  });

  const dates = [...new Set(rows.map(item => item.date).filter(Boolean))];

  return {
    type: 'news',
    count: rows.length,
    dates,
    rows
  };
}

/**
 * API generic cho các sheet như View, Warehouse.
 * Trả toàn bộ display values để HTML tự render thành bảng.
 */
function getGenericSheetData_(sheetName) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Không tìm thấy sheet "' + sheetName + '". Kiểm tra đúng tên sheet trong Google Sheets.');

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    return {
      type: 'table',
      count: 0,
      values: []
    };
  }

  const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  const filteredValues = values.filter(row => row.some(cell => String(cell || '').trim() !== ''));

  return {
    type: 'table',
    count: filteredValues.length,
    values: filteredValues
  };
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  throw new Error('Chưa khai báo SPREADSHEET_ID. Nếu Apps Script là project riêng, hãy paste Google Sheet ID vào biến SPREADSHEET_ID.');
}

/**
 * Hỗ trợ cả JSON và JSONP.
 * HTML bên dưới dùng JSONP để tránh lỗi CORS khi chạy file HTML local.
 */
function output_(payload, callback) {
  const json = JSON.stringify(payload);

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/*******************************************************
 * Optional: Chạy testNews() trong Apps Script để kiểm tra
 * quyền đọc Sheet và cấu trúc dữ liệu.
 *******************************************************/
function testNews() {
  Logger.log(JSON.stringify(getNewsData_(), null, 2));
}
