// Validated optional Crossref Polite Pool contact; domain restrictions are a
// user-facing extension policy, not a Crossref requirement.
const ECON_ALLOWED_EMAIL_DOMAINS = new Set([
  '163.com','126.com','yeah.net','qq.com','foxmail.com',
  'gmail.com','googlemail.com','outlook.com','outlook.cn',
  'hotmail.com','hotmail.co.uk','live.com','msn.com',
  'icloud.com','me.com','mac.com','yahoo.com','yahoo.co.uk',
  '139.com','189.cn','sina.com','sina.cn','sohu.com',
  'aliyun.com','proton.me','protonmail.com','mail.com'
]);
function econNormalizeContactEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim();
  if (!email || email.length > 254 || email.includes('..')) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const [local, rawDomain] = parts;
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?$/.test(local)) return null;
  const domain = rawDomain.toLowerCase();
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(domain)) return null;
  const academic = domain === 'edu.cn' || domain.endsWith('.edu.cn') ||
    domain.endsWith('.edu') || domain === 'ac.cn' ||
    domain.endsWith('.ac.cn') || domain.endsWith('.ac.uk');
  if (!academic && !ECON_ALLOWED_EMAIL_DOMAINS.has(domain)) return null;
  return local + '@' + domain;
}
function econCrossrefRequestUrl(title, contactEmail) {
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query.title', title);
  url.searchParams.set('filter', 'type:journal-article');
  url.searchParams.set('rows', '5');
  url.searchParams.set('select', 'title,container-title,author,published,issued,DOI,type');
  const email = econNormalizeContactEmail(contactEmail);
  if (email) url.searchParams.set('mailto', email);
  return url.toString();
}
