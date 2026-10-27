// Match only on journal/venue metadata, never on paper titles or abstracts.
function norm(text) {
  return String(text || '').normalize('NFKC').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function titleKey(text) {
  const normalized = norm(text);
  return norm(ECON_ALIASES[normalized] || text).replace(/^the /, '');
}
const JOURNAL_ABBREVIATIONS = {
  'am econ rev': 'American Economic Review',
  'amer econ rev': 'American Economic Review',
  'american econ rev': 'American Economic Review',
  'american economic rev': 'American Economic Review',
  'aer': 'American Economic Review',
  'q j econ': 'Quarterly Journal of Economics',
  'quart j econ': 'Quarterly Journal of Economics',
  'qje': 'Quarterly Journal of Economics',
  'j polit econ': 'Journal of Political Economy',
  'j pol econ': 'Journal of Political Economy',
  'jpe': 'Journal of Political Economy',
  'rev econ stud': 'Review of Economic Studies',
  're stud': 'Review of Economic Studies',
  'restud': 'Review of Economic Studies',
  'j fin': 'Journal of Finance',
  'j finance': 'Journal of Finance',
  'j fin econ': 'Journal of Financial Economics',
  'j financ econ': 'Journal of Financial Economics',
  'rev fin stud': 'The Review of Financial Studies',
  'rev financ stud': 'The Review of Financial Studies',
  'rfs': 'The Review of Financial Studies',
  'account rev': 'The Accounting Review',
  'j account econ': 'Journal of Accounting and Economics',
  'j account res': 'Journal of Accounting Research',
  'j mark res': 'Journal of Marketing Research',
  'j mark': 'Journal of Marketing',
  'manage sci': 'Management Science',
  'manag sci': 'Management Science',
  'organ sci': 'Organization Science',
  'oper res': 'Operations Research',
  'mis q': 'MIS Quarterly',
  'j int bus stud': 'Journal of International Business Studies',
  'strateg manage j': 'Strategic Management Journal'
};
function catalog(custom) {
  const out = new Map();
  for (const [group, names] of Object.entries(ECON_LISTS)) {
    for (const title of names) {
      const key = titleKey(title);
      if (!out.has(key)) out.set(key, { title, groups: [] });
      if (!out.get(key).groups.includes(group)) out.get(key).groups.push(group);
    }
  }
  for (const row of (Array.isArray(custom) ? custom : [])) {
    if (!row || typeof row.title !== 'string' || !row.title.trim()) continue;
    const key = titleKey(row.title);
    if (!out.has(key)) out.set(key, { title: row.title, groups: [] });
    out.get(key).school = String(row.level || '学校目录').slice(0, 48);
  }
  return out;
}
function containsPhrase(source, phrase) {
  return source === phrase || source.startsWith(phrase + ' ') ||
    source.endsWith(' ' + phrase) || source.includes(' ' + phrase + ' ');
}
// Caller supplies the venue field (NOT title/abstract/author fields).
function matches(venue, map) {
  const text = norm(venue);
  if (!text) return [];
  const found = new Map();
  for (const [key, entry] of map) {
    if (key.length >= 7 && containsPhrase(text, key)) found.set(key, entry);
  }
  for (const [short, canonical] of Object.entries(JOURNAL_ABBREVIATIONS)) {
    const shortKey = norm(short);
    const canonicalKey = titleKey(canonical);
    if (!map.has(canonicalKey)) continue;
    // Three-letter aliases must be isolated, or followed immediately by a year.
    if (shortKey.length < 6 && text !== shortKey && !new RegExp('^' + shortKey + ' (?:19|20)\\d{2}(?: |$)').test(text)) continue;
    if (containsPhrase(text, shortKey)) found.set(canonicalKey, map.get(canonicalKey));
  }
  return Array.from(found.values()).sort((a, b) => b.title.length - a.title.length).slice(0, 1);
}
