/* Economics Journal Tags: name-based matching, no remote API or page-content collection. */
(function () {
  "use strict";
  const api = typeof browser !== "undefined" ? browser : chrome;
  const DEFAULTS = {enabled: {top5: true, ft50: true, utd24: true, school: true}, schoolName: "学校目录", schoolJournals: []};
  let prefs = DEFAULTS;
  let entries = [];
  let timer = 0;

  function normalize(value) {
    return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ").replace(/\u00a0/g, " ")
      .toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ")
      .trim().replace(/^the /, "").replace(/\s+/g, " ");
  }

  function buildIndex() {
    const catalog = new Map();
    const add = (name, type, level) => {
      const key = normalize(name);
      if (!key) return;
      if (!catalog.has(key)) catalog.set(key, {name, labels: new Set(), schoolLevels: new Set(), names: new Set()});
      const record = catalog.get(key);
      if (type === "school") record.schoolLevels.add(level || "收录");
      else record.labels.add(type);
      record.names.add(name);
    };
    // A single journal can have several independent labels.
    for (const type of ["top5", "ft50", "utd24"]) {
      for (const name of econData[type]) add(name, type);
    }
    for (const item of (prefs.schoolJournals || [])) {
      if (item && typeof item.journal === "string") add(item.journal, "school", item.level);
    }
    // Alias lookup points to the same catalog record, including journals with
    // different spelling between the FT50 and UTD24 lists.
    const index = new Map();
    for (const [key, record] of catalog) {
      const names = new Set([key]);
      const aliases = econData.aliases || {};
      for (const listed of record.names) {
        for (const alias of (aliases[listed] || [])) names.add(normalize(alias));
      }
      for (const item of (prefs.schoolJournals || [])) {
        if (normalize(item.journal) === key) {
          const additional = Array.isArray(item.aliases) ? item.aliases : String(item.aliases || "").split("|");
          for (const a of additional) names.add(normalize(a));
        }
      }
      for (const name of names) {
        if (!name) continue;
        // Merge entries when official lists use distinct canonical spellings.
        const existing = index.get(name);
        if (existing && existing !== record) {
          for (const label of record.labels) existing.labels.add(label);
          for (const level of record.schoolLevels) existing.schoolLevels.add(level);
          for (const otherName of names) if (!index.has(otherName)) index.set(otherName, existing);
        } else if (!existing) index.set(name, record);
      }
    }
    entries = Array.from(index, ([name, record]) => ({name, record}))
      .sort((a, b) => b.name.length - a.name.length);
  }

  function findJournal(text, isScholar) {
    let candidates = [String(text || "")];
    if (isScholar) {
      // Scholar metadata: "Authors - Journal, 2025 - Publisher".
      const parts = String(text || "").split(/\s+[-–—]\s+/);
      candidates = parts.length > 1 ? parts.slice(1, -1).concat(parts.slice(-1)) : [];
    }
    for (const raw of candidates) {
      const clean = normalize(raw.replace(/^\d{4}\s*[,;:]?\s*/, ""));
      if (!clean) continue;
      for (const entry of entries) {
        if (clean === entry.name ||
            (entry.name.length > 6 &&
             clean.startsWith(entry.name + " ") &&
             /^(?:19|20)\d{2}\b|^\d+\b|^vol\b|^volume\b|^no\b|^issue\b/.test(clean.slice(entry.name.length).trim()))) {
          return entry.record;
        }
      }
    }
    return null;
  }

  function makeBadges(record) {
    if (!record) return null;
    const wrap = document.createElement("span");
    wrap.className = "econ-journal-tags";
    wrap.dataset.econBadges = "1";
    const labels = [["top5", "TOP5"], ["ft50", "FT50"], ["utd24", "UTD24"]];
    let count = 0;
    for (const [id, title] of labels) {
      if (!prefs.enabled[id] || !record.labels.has(id)) continue;
      const badge = document.createElement("span");
      badge.className = "econ-journal-badge econ-journal-" + id;
      badge.textContent = title;
      badge.title = record.name + " · " + econData.edition[id];
      wrap.appendChild(badge);
      count++;
    }
    if (prefs.enabled.school) {
      for (const level of record.schoolLevels) {
        const badge = document.createElement("span");
        badge.className = "econ-journal-badge econ-journal-school";
        badge.textContent = (prefs.schoolName || "学校目录") + " · " + level;
        badge.title = "用户导入的学校目录，不代表官方 TOP5 / FT50 / UTD24";
        wrap.appendChild(badge);
        count++;
      }
    }
    return count ? wrap : null;
  }

  function append(target, venue, fromScholar) {
    if (!target || !target.isConnected || !venue) return;
    const existing = target.nextElementSibling;
    if (existing && existing.dataset && existing.dataset.econBadges) existing.remove();
    const record = findJournal(venue, fromScholar);
    const badge = makeBadges(record);
    if (badge) target.insertAdjacentElement("afterend", badge);
  }

  function scan() {
    const host = location.hostname;
    if (host.startsWith("scholar.google")) {
      document.querySelectorAll(".gs_ri .gs_a, .gsc_a_tr .gs_gray").forEach(node => {
        append(node, node.textContent, true);
      });
    } else if (host.startsWith("dblp")) {
      document.querySelectorAll("cite > a").forEach(node => {
        // DBLP links to publication venues usually have an abbreviated title.
        append(node, node.textContent, false);
      });
      const heading = document.querySelector("header h1, #headline h1");
      if (heading) append(heading, heading.textContent, false);
    } else if (host.includes("semanticscholar")) {
      document.querySelectorAll(".cl-paper-venue, [data-test-id='paper-venue']").forEach(node => append(node, node.textContent, false));
    } else if (host.includes("webofscience") || host.includes("clarivate")) {
      document.querySelectorAll(".summary-source-title-link, .summary-source-title").forEach(node => append(node, node.textContent, false));
    }
  }

  function scheduleScan() {
    clearTimeout(timer);
    timer = setTimeout(scan, 220);
  }
  async function initialize() {
    try {
      const values = await api.storage.local.get(DEFAULTS);
      prefs = {...DEFAULTS, ...values, enabled: {...DEFAULTS.enabled, ...(values.enabled || {})}};
    } catch (error) {
      console.warn("Economics Journal Tags: settings unavailable", error);
    }
    buildIndex();
    scan();
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => Array.from(m.addedNodes).some(n => n.nodeType === 1 && !n.closest?.(".econ-journal-tags")))) scheduleScan();
    });
    observer.observe(document.documentElement, {childList: true, subtree: true});
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      for (const name of ["enabled", "schoolName", "schoolJournals"]) if (changes[name]) prefs[name] = changes[name].newValue;
      buildIndex();
      document.querySelectorAll("[data-econ-badges]").forEach(n => n.remove());
      scheduleScan();
    });
    window.addEventListener("popstate", scheduleScan);
  }
  initialize();
})();
