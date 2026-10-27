// Read a DOI from a publisher landing-page URL, never from an unrelated web page.
function econExtractDoi(link) {
  if (typeof link !== 'string') return null;
  let url;
  try { url = new URL(link); } catch (_) { return null; }
  if (!['https:', 'http:'].includes(url.protocol)) return null;
  let path;
  try { path = decodeURIComponent(url.pathname); } catch (_) { path = url.pathname; }
  const match = path.match(/(?:^|\/)(10\.\d{4,9}\/[A-Za-z0-9._;():/+%-]+)/i);
  if (!match) return null;
  const doi = match[1].replace(/[.,;)\]]+$/, '');
  return /^10\.\d{4,9}\/\S{3,180}$/i.test(doi) ? doi : null;
}
function econValidDoi(doi) {
  return typeof doi === 'string' &&
    /^10\.\d{4,9}\/[A-Za-z0-9._;():/+%-]{3,180}$/i.test(doi);
}
