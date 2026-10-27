# Economics Journal Tags / 经济学期刊标记

A Firefox WebExtension that highlights **Economics TOP5**, **FT50 (April 2026)**, **UTD24**, and your **university's own journal classifications** in academic search results.

本项目由原 CCFrank 浏览器扩展改造为**经济学与商学院领域**的期刊标记工具，已停止加载原有计算机领域 CCF 排名逻辑。

## Features / 功能

- **TOP5** (5 economics journals), **FT50** (50 FT business journals, April 2026), and **UTD24** (24 UT Dallas business journals).
- Display *multiple badges* for journals appearing on more than one list, rather than pretending they are a single ranking.
- Import a university-specific **CSV or JSON** directory, with journal name, school tier and aliases, entirely stored locally.
- Each label category can be switched on or off. Imported school list can be exported or cleared.
- Adds badges on **Google Scholar**, **DBLP**, **Semantic Scholar**, and **Web of Science** search pages when the website exposes recognizable publication/venue metadata.
- No backend, no telemetry, no remote ranking API requests. Permissions limited to the listed academic sites and local extension storage.

## Firefox installation / Firefox 安装

1. Download the code archive of the feature branch and unzip it. The project root contains \`manifest.json\`.
2. Firefox: open \`about:debugging#/runtime/this-firefox\`.
3. Click **Load Temporary Add-on**, select \`manifest.json\` in the project root.
4. Browse a supported academic search results page and look for journal badges.
5. Click the extension icon → **管理期刊名单与标签** to adjust lists or import a school's directory.

**Temporary add-ons are unloaded when Firefox restarts.** For a permanent Firefox installation, the XPI must be signed via Mozilla Add-ons (AMO). Merely renaming ZIP to XPI does not make it signed.

## School list / 学校目录

CSV with UTF-8 header \`journal,level,aliases\` (aliases separated by \`|\`; quotes are supported for commas):

\`\`\`csv
journal,level,aliases
Journal of Economic Theory,A类,J Econ Theory|JET
Journal of Econometrics,B类,J Econometrics
\`\`\`

Or JSON:

\`\`\`json
{"schoolName":"示例大学","journals":[{"journal":"Journal of Economic Theory","level":"A类","aliases":["JET"]}]}
\`\`\`

Imported school classifications **are user-supplied** and must be checked against that university's official policy. No school rankings are fabricated by default.

## Source lists / 目录来源

- **TOP5**: [University of Macau, Department of Economics](https://econ.fss.um.edu.mo/journal-list/) (AER, Econometrica, JPE, QJE, ReStud).
- **FT50, April 2026**: [Financial Times 2026 FT50 update](https://www.ft.com/content/db863a0a-6524-45f9-bc52-fee997634bdc); 2026 revision *adds* Academy of Management Annals, American Sociological Review, Psychological Science, and *removes* Human Relations, Journal of Business Ethics, Organization Studies.
- **UTD24**: [UT Dallas official List of Journals](https://jsom.utdallas.edu/the-utd-top-100-business-school-research-rankings/list-of-journals).
- These lists belong to separate disciplines/methodologies and should never be treated as interchangeable rankings.

## Limitations

- Labels attach to *journal metadata*, not titles of papers. Google Scholar may omit, abbreviate, or reformat the publication title; entries without a confident match are left unlabelled.
- Journal abbreviations are curated; aliases can be added to the user's local school list. Conference and working-paper records are not automatically treated as a TOP5/FT50/UTD24 publication.
- Website markup changes can affect display. A badge says that a venue belongs to a list; it does **not** evaluate the quality of an individual paper.

## Development

No build step required. \`manifest.json\` declares only the new economics content scripts. Run basic checks with \`node tests/check.cjs\`; to build a distributable unsigned archive, zip only the manifest, economics JS/CSS, options and popup files, with the manifest at archive root.

## Acknowledgements / Attribution

Adapted from [CCFrank4dblp](https://github.com/WenyanLiu/CCFrank4dblp) (MIT licence; see \`LICENSE\`). Legacy original source and art files may remain in the repository for reference but are **not loaded by the Firefox manifest**.
