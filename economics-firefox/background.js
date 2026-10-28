// Query independent bibliographic metadata, rather than intercept Scholar traffic.
browser.action.onClicked.addListener(() => browser.runtime.openOptionsPage());
const CACHE_KEY = 'econCrossrefCache';
const pending = new Map();
let queue = Promise.resolve();
let cachePromise = null;
function getCache() {
  if (!cachePromise) cachePromise = browser.storage.local.get(CACHE_KEY)
    .then(value => value[CACHE_KEY] || {}).catch(() => ({}));
  return cachePromise;
}
function valid(message) {
  return message && message.type === 'econ.resolveCrossref' &&
    typeof message.title === 'string' &&
    message.title.trim().length >= 14 && message.title.length <= 240 &&
    (!message.author || (typeof message.author === 'string' && message.author.length <= 90)) &&
    (!message.year || (Number.isInteger(message.year) && message.year >= 1900 && message.year <= 2100)) &&
    (!message.doi || econValidDoi(message.doi));
}
// Public Crossref search requests are paced; one request is made at a time.
let econLastFetchTime = 0;
async function econFetchJson(urlString) {
  const wait = Math.max(0, 1100 - (Date.now() - econLastFetchTime));
  if (wait) await new Promise(resolve => setTimeout(resolve, wait));
  econLastFetchTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7500);
  try {
    const response = await fetch(urlString, {signal: controller.signal});
    if (!response.ok) return { ok:false, status:response.status, data:null };
    return { ok:true, status:response.status, data:await response.json() };
  } finally { clearTimeout(timer); }
}
async function retrieve(query) {
  const saved = await browser.storage.local.get('crossrefEmail').catch(() => ({}));
  // Browser-level consent is required for sending a user-provided contact email.
  // A cached address from an older install must not bypass the consent system.
  let email = '';
  try {
    const permissions = await browser.permissions.getAll();
    if (Array.isArray(permissions.data_collection) &&
        permissions.data_collection.includes('personallyIdentifyingInfo')) {
      email = saved.crossrefEmail || '';
    }
  } catch (_) {
    // Fail closed: requests without an email use the Crossref public pool.
  }
  if (query.doi) {
    const exactUrl = econCrossrefDoiUrl(query.doi, email);
    const exact = await econFetchJson(exactUrl);
    if (exact.ok) {
      const result = econSelectCrossrefVenue([exact.data?.message], query);
      if (result) return {value:result,shouldCache:true};
    }
    // Errors such as rate limiting and server outages must not fan out into
    // additional API calls. A 404/mismatched record can fall back to title.
    if (!exact.ok && exact.status !== 404) return {value:null,shouldCache:false};
  }
  const url = econCrossrefRequestUrl(query.title, email);
  const response = await econFetchJson(url);
  if (!response.ok) return {value:null,shouldCache:false};
  return {
    value:econSelectCrossrefVenue(response.data?.message?.items,query),
    shouldCache:true
  };
}
async function resolve(query) {
  const key = econNormalTitle(query.title) + '|' + query.year + '|' + econNormalTitle(query.author) + '|' + (query.doi || '');
  const cache = await getCache();
  if (cache[key] && cache[key].expires > Date.now()) return cache[key].value;
  if (pending.has(key)) return pending.get(key);
  const task = queue.catch(() => {}).then(async () => {
    let response;
    try { response = await retrieve(query); }
    catch (_) { return null; }
    if (response.shouldCache) {
      cache[key] = { value: response.value, expires: Date.now() +
        (response.value ? 30 : 1) * 86400000 };
      for (const k of Object.keys(cache).sort((a,b) => cache[b].expires - cache[a].expires).slice(180))
        delete cache[k];
      try { await browser.storage.local.set({ [CACHE_KEY]: cache }); }
      catch (_) { /* Cache is optional. */ }
    }
    return response.value;
  });
  queue = task.catch(() => {});
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
browser.runtime.onMessage.addListener((msg,sender) => {
  if (!valid(msg) ||
      !/^https:\/\/scholar\.google\.[a-z.]+(?:\/|$)/i.test(String(sender?.url || ''))) return;
  return resolve({
    title:msg.title.trim(),
    author:String(msg.author || '').trim(),
    year:msg.year || null,
    doi:msg.doi || null
  });
});
