// Crossref paper metadata: verify a paper before trusting its container title.
function econNormalTitle(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, ' and ')
    .normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function econRecordYear(item) {
  for (const key of ['published', 'issued', 'published-online', 'published-print']) {
    const year = Number(item?.[key]?.['date-parts']?.[0]?.[0]);
    if (year >= 1900 && year <= 2100) return year;
  }
  return null;
}
function econTitleConfidence(expected, observed) {
  const a = econNormalTitle(expected), b = econNormalTitle(observed);
  if (!a || !b || a.length < 14 || b.length < 14) return 0;
  if (a === b) return 1;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  return shorter.length >= 35 && longer.startsWith(shorter + ' ') &&
    shorter.length / longer.length >= 0.94 ? 0.96 : 0;
}
function econSelectCrossrefVenue(items, expected) {
  if (!Array.isArray(items) || !expected?.title) return null;
  const candidates = [];
  const year = Number(expected.year);
  const surname = econNormalTitle(String(expected.author || '').split(',')[0]).split(' ').pop();
  for (const item of items.slice(0, 8)) {
    if (!item || item.type !== 'journal-article') continue;
    const venue = Array.isArray(item['container-title']) ? item['container-title'][0] : '';
    const paperTitle = Array.isArray(item.title) ? item.title[0] : '';
    const confidence = econTitleConfidence(expected.title, paperTitle);
    if (!venue || confidence < 0.96) continue;
    const actualYear = econRecordYear(item);
    if (year >= 1900 && year <= 2100 && actualYear !== null &&
        Math.abs(actualYear - year) > 1) continue;
    const first = Array.isArray(item.author) ? item.author[0] : null;
    if (surname && surname.length >= 3 && first?.family &&
        econNormalTitle(first.family) !== surname) continue;
    candidates.push({ venue: String(venue).trim(), DOI: String(item.DOI || '') });
  }
  if (!candidates.length) return null;
  if (new Set(candidates.map(c => econNormalTitle(c.venue))).size > 1) return null;
  return candidates[0];
}
