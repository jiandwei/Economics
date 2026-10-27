(async function () {
  const defaults = { schoolJournals: [], enabled: { top5: true, ft50: true, utd24: true, school: true } };
  let store;
  try {
    store = await browser.storage.local.get(defaults);
  } catch (error) {
    console.warn('[Economics Journal Tags] Unable to read settings', error);
    store = defaults;
  }
  const ranks = catalog(store.schoolJournals);
  const classes = { top5: 'econ-top5', ft50: 'econ-ft50', utd24: 'econ-utd' };
  const names = { top5: 'TOP5', ft50: 'FT50', utd24: 'UTD24' };

  function decorate(target, venue) {
    if (!target || !venue || target.dataset.econTagged === '1') return;
    const found = matches(venue, ranks);
    if (!found.length) return;
    const wrap = document.createElement('span');
    wrap.className = 'econ-badges';
    const seen = new Set();
    for (const journal of found) {
      for (const group of journal.groups) {
        if (seen.has(group) || store.enabled?.[group] === false) continue;
        seen.add(group);
        const badge = document.createElement('span');
        badge.className = 'econ-badge ' + classes[group];
        badge.textContent = names[group];
        badge.title = journal.title;
        wrap.appendChild(badge);
      }
      if (journal.school && store.enabled?.school !== false) {
        const badge = document.createElement('span');
        badge.className = 'econ-badge econ-school';
        badge.textContent = journal.school;
        badge.title = '学校目录：' + journal.title;
        wrap.appendChild(badge);
      }
    }
    if (!wrap.childElementCount) return;
    target.after(wrap);
    target.dataset.econTagged = '1';
  }
  // Scholar's .gs_a combines authors – venue, year – publisher.
  function scholar() {
    document.querySelectorAll('.gs_ri').forEach(result => {
      const source = result.querySelector('.gs_a');
      if (!source) return;
      const parts = source.textContent.split(/\s[-–]\s/);
      if (parts.length >= 2) decorate(source, parts[1]);
    });
    // Scholar profiles: first .gs_gray lists authors, second lists venue.
    document.querySelectorAll('tr.gsc_a_tr').forEach(result => {
      const lines = result.querySelectorAll('.gsc_a_t .gs_gray');
      if (lines.length > 1) decorate(lines[1], lines[1].textContent);
    });
  }
  function wos() {
    document.querySelectorAll('.summary-source-title-link, .summary-source-title, [data-ta="source-title"], [data-testid="source-title"]').forEach(el => decorate(el, el.textContent));
  }
  function semanticScholar() {
    document.querySelectorAll('.cl-paper-venue, [data-test-id="venue-metadata"], a[href*="/venue/"]').forEach(el => decorate(el, el.textContent));
  }
  function dblp() {
    // Paper titles are not publication venues.
    document.querySelectorAll('cite a[href*="/db/journals/"], cite [itemprop="isPartOf"], #breadcrumbs a[href*="/db/journals/"]').forEach(el => decorate(el, el.textContent));
  }
  function scan() {
    const host = location.hostname;
    if (host.startsWith('scholar.google.')) scholar();
    else if (host.includes('webofscience') || host.includes('clarivate')) wos();
    else if (host.includes('semanticscholar')) semanticScholar();
    else if (host.startsWith('dblp')) dblp();
  }
  scan();
  if (document.body) {
    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(scan, 250);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.schoolJournals || changes.enabled)) location.reload();
  });
})();
