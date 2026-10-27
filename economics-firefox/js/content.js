(async function () {
  const defaults = { schoolJournals: [], enabled: { top5: true, ft50: true, utd24: true, cssci: true, pku: true, ami: true, school: true } };
  let store;
  try {
    store = await browser.storage.local.get(defaults);
  } catch (error) {
    console.warn('[Economics Journal Tags] Unable to read settings', error);
    store = defaults;
  }
  const ranks = catalog(store.schoolJournals);
  const classes = { top5: 'econ-top5', ft50: 'econ-ft50', utd24: 'econ-utd', cssci: 'econ-cssci', pku: 'econ-pku' };
  const names = { top5: 'TOP5', ft50: 'FT50', utd24: 'UTD24', cssci: 'CSSCI', pku: '北大核心' };

  function decorate(target, venue, mountInside = null) {
    if (!target || !venue) return;
    const cleanVenue = String(venue).trim();
    if (target.dataset.econTagged === '1') {
      // A CNKI SPA may re-use the same source cell for a different result.
      if (!mountInside || target.dataset.econVenue === cleanVenue) return;
      const old = mountInside.querySelector(':scope > .econ-badges--cnki');
      if (old) old.remove();
      delete target.dataset.econTagged;
      delete target.dataset.econVenue;
    }
    const found = matches(cleanVenue, ranks);
    if (!found.length) return;
    const wrap = document.createElement('span');
    wrap.className = mountInside ? 'econ-badges econ-badges--cnki' : 'econ-badges';
    const seen = new Set();
    for (const journal of found) {
      for (const group of journal.groups) {
        if (seen.has(group) || store.enabled?.[group] === false) continue;
        seen.add(group);
        const badge = document.createElement('span');
        badge.className = 'econ-badge ' + classes[group];
        badge.textContent = names[group];
        badge.title = journal.title + (group === 'cssci' ? ' · CSSCI 2025–2026（经济学）' : group === 'pku' ? ' · 北大核心 2023（经济类）' : '');
        wrap.appendChild(badge);
      }
      if (journal.ami && store.enabled?.ami !== false) {
        const badge = document.createElement('span');
        badge.className = 'econ-badge econ-ami';
        badge.textContent = 'AMI·' + journal.ami;
        badge.title = 'AMI ' + (journal.amiYear || '2022') + '：' + journal.title;
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
    if (mountInside) {
      // Never put a span directly next to a <td>: that creates invalid table
      // structure and visually shifts the badge into the publication-date column.
      mountInside.appendChild(wrap);
      target.dataset.econVenue = cleanVenue;
    } else {
      target.after(wrap);
    }
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
  function cnkiSourceText(cell) {
    // Read only the journal name. Ignore our previously rendered badges.
    const journalLink = cell.querySelector('a');
    if (journalLink && journalLink.textContent.trim()) return journalLink.textContent.trim();
    const copy = cell.cloneNode(true);
    copy.querySelectorAll('.econ-badges').forEach(badge => badge.remove());
    return copy.textContent.trim();
  }
  function cnki() {
    // CNKI KNS8: mount the badges *inside* the source <td>, under the journal.
    // A sibling of <td> is an invalid table child and breaks column alignment.
    document.querySelectorAll('.result-table-list tbody tr').forEach(row => {
      const cell = row.querySelector('td.source');
      if (cell) decorate(cell, cnkiSourceText(cell), cell);
    });
    document.querySelectorAll('.briefDl_D .journalSpan, .briefDl_D .source a, .briefDl_D .source, .result-content .source a, a[href*="navi.cnki.net/knavi/detail"]').forEach(el => {
      if (el.closest('.result-table-list')) return;
      const cell = el.closest('td, th');
      const venue = cell && cell.classList.contains('source') ? cnkiSourceText(cell) : el.textContent.trim();
      decorate(cell && cell.classList.contains('source') ? cell : el, venue, cell && cell.classList.contains('source') ? cell : null);
    });
    if (location.hostname.startsWith('navi.')) {
      document.querySelectorAll('.journal-title, h1.journal-title, .journalTitle').forEach(el => decorate(el, el.textContent.trim()));
    }
  }
  function scan() {
    const host = location.hostname;
    if (host.endsWith('.cnki.net') || host === 'cnki.net') cnki();
    else if (host.startsWith('scholar.google.')) scholar();
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
