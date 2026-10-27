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

## CNKI & Chinese journal lists (v0.2.0)
- CNKI `kns.cnki.net`, `navi.cnki.net` and common mirrors; rankings are attached to **source journal**, not article titles.
- Built-in CSSCI 2025–2026 (economics subset), PKU Core 2023 (economics and related subject subset), AMI 2022 (limited subset). These are **partial directories** and need careful verification against authoritative catalogues; do not use as formal assessment.
- Locally import school journal CSV/JSON. Either `title,level` or `期刊名称,学校等级,CSSCI,北大核心,AMI` headers. `CSSCI`/`北大核心` accept `是`; `AMI` accepts a textual level.
- Reference: CSSCI 2025–2026 https://rwskc.zust.edu.cn/__local/3/CB/3F/ADA3D8675FEDE867F8F7B11E39E_8198B043_2A396.pdf
- Reference: PKU Core 2023 https://www.wifa.edu.cn/upload/20240923/d4b8a60dc932f2593f8fb7322a2aa0b2.pdf
- AMI source should be independently checked before formal use.
- CNKI changes site layout periodically; selectors need testing on your logged-in browser.

## v0.2.1 CNKI display correction
CNKI search-table badges now render *inside* the `td.source` cell under the journal title. This fixes accidental placement under the publication date caused by adding a `span` as a sibling of `td`. The tests cover source-column containment, distinct similar titles, repeated scans and updated results.

## v0.2.2 – Journal of Operations Management

Both `FT50` and `UTD24` contain **Journal of Operations Management**. Recognizes its full name and common source-field abbreviations (`J Oper Manag`, `J. Oper. Manage.`, `J Operations Manag`, `JOM` when isolated), including English-language venues displayed in CNKI's source column. Improved Google Scholar metadata extraction when the author/venue separator is absent or uses an em dash. Tests assert both classifications and guard against false positives.
