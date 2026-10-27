# Economics Journal Tags (Firefox)

Independent economics-focused Firefox extension inside the Economics repository. The original CCF-focused extension is left intact.

## Features
- Marks Economics TOP5, FT50 (2026 revision), UTD24 and locally imported school journal tiers.
- Supports Google Scholar, DBLP, Web of Science and Semantic Scholar venue snippets. Only journals whose names are visible and matched are labeled; article title alone does not establish the publishing venue.
- Firefox toolbar icon opens options; choose enabled lists, import local school CSV/JSON or export your school list.
- No remote service; custom school rankings are stored with `browser.storage.local`.

## Install (temporary / development)
1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Select **Load Temporary Add-on…**, then select `economics-firefox/manifest.json`.
3. Open the extension toolbar icon to configure school rankings. Temporary add-ons disappear after Firefox restarts.

For permanent installation, package the files at this directory root as `.xpi` and submit for signing via Firefox Add-ons (AMO).

## School CSV
```csv
title,level
Journal of Economic Theory,A类
Journal of Development Economics,B类
```

JSON alternative: `[{"title":"Journal of Economic Theory","level":"A类"}]`.

## Sources, definitions and limitations
- Economics TOP5: https://econ.fss.um.edu.mo/journal-list/
- UTD24 official: https://jsom.utdallas.edu/the-utd-top-100-business-school-research-rankings/list-of-journals
- FT50 (2026 revised): https://www.ft.com/ft50-journals and https://guides.lib.purdue.edu/ft50

FT50 is a business-school research journal basket, not a ranking of strictly economics-only journals; UTD24 is also cross-disciplinary. Lists change and should be rechecked before formal assessments. The FT50 list is an initial curated candidate list and should be independently audited against the authoritative 2026 list before publication. Site DOM changes can affect badges; this is a first working implementation, not yet browser-verified.
