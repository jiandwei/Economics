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
    (!message.year || (Number.isInteger(message.year) && message.year >= 1900 && message.year <= 2100));
}
async function retrieve(query) {
  // Saved address is optional; invalid values fall back to anonymous access.
  const saved = await browser.storage.local.get('crossrefEmail').catch(() => ({}));
  const url = econCrossrefRequestUrl(query.title, saved.crossrefEmail);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) return { value: null, shouldCache: false };
    const data = await response.json();
    return { value: econSelectCrossrefVenue(data?.message?.items, query), shouldCache: true };
  } finally { clearTimeout(timer); }
}
async function resolve(query) {
  const key = econNormalTitle(query.title) + '|' + query.year + '|' + econNormalTitle(query.author);
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
browser.runtime.onMessage.addListener((msg, sender) => {
  if (!valid(msg) ||
    !/^https:\/\/scholar\.google\.[a-z.]+(?:\/|$)/i.test(String(sender?.url || ''))) return;
  return resolve({ title: msg.title.trim(), author: String(msg.author || '').trim(), year: msg.year || null });
});
