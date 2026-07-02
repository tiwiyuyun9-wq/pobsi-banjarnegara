// Test script for Indonesian Date Parser
function parseIndonesianDate(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthName = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    const indonesianMonths = {
      'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
      'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5, 'jul': 6, 'agt': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
    };
    const month = indonesianMonths[monthName] !== undefined ? indonesianMonths[monthName] : 0;
    if (!isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const testDate = new Date(dateStr);
  if (!isNaN(testDate.getTime())) return testDate;
  return null;
}

const test1 = parseIndonesianDate("25 Januari 2026");
console.log("25 Januari 2026 ->", test1 ? test1.toDateString() : "null");

const test2 = parseIndonesianDate("12 Feb 2026");
console.log("12 Feb 2026 ->", test2 ? test2.toDateString() : "null");

const test3 = parseIndonesianDate("2026-06-15");
console.log("2026-06-15 ->", test3 ? test3.toDateString() : "null");
