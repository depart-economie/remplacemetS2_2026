const SPREADSHEET_ID = "1lFBLC62osokacjNO6OBpWLr-fCGANVDnWd2n8-nsuZc";

function doGet() {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("برامج الامتحانات")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSheetByNameFlexible(ss, name) {
  return ss.getSheets().find(sh => sh.getName().toLowerCase() === name.toLowerCase());
}

function getSheetData(type) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetName = type === "consultation" ? "CONSULTATION" : "REMPLACEMENT";
  const sheet = getSheetByNameFlexible(ss, sheetName);

  if (!sheet) return [];

  return sheet.getDataRange().getValues();
}

function getLevels(type) {
  const data = getSheetData(type);
  const levels = new Set();

  for (let i = 1; i < data.length; i++) {
    const level = type === "consultation" ? data[i][2] : data[i][5];
    if (level) levels.add(String(level).trim());
  }

  return Array.from(levels).sort();
}

function getSpecialities(type, level) {
  const data = getSheetData(type);
  const specialities = new Set();

  for (let i = 1; i < data.length; i++) {
    const rowLevel = type === "consultation" ? data[i][2] : data[i][5];
    const speciality = type === "consultation" ? data[i][1] : data[i][4];

    if (String(rowLevel).trim() === String(level).trim() && speciality) {
      specialities.add(String(speciality).trim());
    }
  }

  return Array.from(specialities).sort();
}

function getModules(type, level, speciality) {
  const data = getSheetData(type);
  const modules = new Set();

  for (let i = 1; i < data.length; i++) {
    const rowModule = type === "consultation" ? data[i][0] : data[i][3];
    const rowSpeciality = type === "consultation" ? data[i][1] : data[i][4];
    const rowLevel = type === "consultation" ? data[i][2] : data[i][5];

    if (
      String(rowLevel).trim() === String(level).trim() &&
      String(rowSpeciality).trim() === String(speciality).trim() &&
      rowModule
    ) {
      modules.add(String(rowModule).trim());
    }
  }

  return Array.from(modules).sort();
}

function getProgram(type, level, speciality, moduleName) {
  const data = getSheetData(type);

  if (type === "consultation") {
    return searchConsultation(data, level, speciality, moduleName);
  }

  return searchReplacement(data, level, speciality, moduleName);
}

function searchConsultation(data, level, speciality, moduleName) {
  const results = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    if (
      String(row[0]).trim() === String(moduleName).trim() &&
      String(row[1]).trim() === String(speciality).trim() &&
      String(row[2]).trim() === String(level).trim()
    ) {
      results.push({
        module: row[0],
        speciality: row[1],
        level: row[2],
        day: row[3],
        date: formatDate(row[4]),
        time: formatTime(row[5]),
        place: row[6]
      });
    }
  }

  return {
    success: true,
    type: "consultation",
    count: results.length,
    results: results
  };
}

function searchReplacement(data, level, speciality, moduleName) {
  const students = [];
  let examInfo = null;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    if (
      String(row[3]).trim() === String(moduleName).trim() &&
      String(row[4]).trim() === String(speciality).trim() &&
      String(row[5]).trim() === String(level).trim()
    ) {
      students.push({
        firstName: row[0],
        lastName: row[1],
        regNumber: row[2],
        module: row[3],
        speciality: row[4],
        level: row[5]
      });

      if (!examInfo) {
        examInfo = {
          module: row[3],
          speciality: row[4],
          level: row[5],
          day: row[6],
          date: formatDate(row[7]),
          time: formatTime(row[8]),
          place: row[9]
        };
      }
    }
  }

  if (students.length === 0) {
    return {
      success: true,
      type: "replacement",
      programmed: false,
      message: "لم يبرمج الامتحان التعويضي بسبب عدم وجود طلبة مسجلين أو تبريرات عن الغياب."
    };
  }

  return {
    success: true,
    type: "replacement",
    programmed: true,
    exam: examInfo,
    students: students
  };
}

function formatDate(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy/MM/dd");
  }
  return value || "";
}

function formatTime(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "HH:mm");
  }
  return value || "";
}
