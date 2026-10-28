// Regression test for CNKI table badge placement (no extra <tr> children).
// Run with: node economics-firefox/tests/cnki-layout.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
class Element {
  constructor(tag = 'span', text = '') {
    this.tagName = tag.toUpperCase();
    this.value = text;
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.className = '';
    this.title = '';
    this.classList = { contains: name => this.className.split(/\s+/).includes(name) };
  }
  set textContent(text) { this.value = String(text); this.children = []; }
  get textContent() { return this.value + this.children.map(c => c.textContent).join(''); }
  get childElementCount() { return this.children.length; }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  querySelector(selector) {
    if (selector === 'a') return this.children.find(child => child.tagName === 'A') || null;
    if (selector === ':scope > .econ-badges--cnki') {
      return this.children.find(child => child.classList.contains('econ-badges--cnki')) || null;
    }
    if (selector === 'td.source') return this.children.find(child => child.tagName === 'TD' && child.classList.contains('source')) || null;
    return null;
  }
  querySelectorAll(selector) {
    if (selector === '.econ-badges') return this.children.filter(child => child.classList.contains('econ-badges'));
    return [];
  }
  cloneNode(deep) {
    const clone = new Element(this.tagName, this.value);
    clone.className = this.className;
    if (deep) for (const child of this.children) clone.appendChild(child.cloneNode(true));
    return clone;
  }
  remove() { if (this.parentNode) { this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; } }
  after() { throw Error('CNKI badge was inserted outside the <td>'); }
}
function rowWithSource(name, linked = true) {
  const row = new Element('tr');
  const cell = row.appendChild(new Element('td', linked ? '' : name));
  cell.className = 'source';
  if (linked) cell.appendChild(new Element('a', name));
  return { row, cell };
}
const first = rowWithSource('世界经济研究');
const second = rowWithSource('世界经济');
const third = rowWithSource('南开经济研究', false);
const fourth = rowWithSource('Journal of Operations Management');
let scanCallback;
const context = vm.createContext({
  document: {
    body: {},
    createElement: tag => new Element(tag),
    querySelectorAll: selector => selector === '.result-table-list tbody tr' ? [first.row, second.row, third.row, fourth.row] : []
  },
  browser: {
    storage: {
      local: { get: async defaults => ({ ...defaults, schoolJournals: [{ title: '世界经济', level: 'A' }] }) },
      onChanged: { addListener: () => {} }
    }
  },
  location: { hostname: 'kns.cnki.net' },
  MutationObserver: class { constructor(fn) { scanCallback = fn; } observe() {} },
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  console,
});
for (const filename of ['data/journals.js', 'data/chinese-journals.js', 'js/matcher.js', 'js/content.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, filename), 'utf8'), context, { filename });
}
(async () => {
  await new Promise(resolve => setImmediate(resolve));
  const wrap = cell => cell.querySelector(':scope > .econ-badges--cnki');
  assert.equal(wrap(first.cell), null, 'Unranked Chinese source should not receive a badge');
  assert.ok(wrap(second.cell), 'School-ranked journal should render');
  assert.equal(wrap(third.cell), null, 'No CSSCI/PKU/AMI badges in streamlined edition');
  assert.ok(wrap(fourth.cell), 'English source should render');
  assert.ok(wrap(fourth.cell).textContent.includes('FT50'));
  assert.ok(wrap(fourth.cell).textContent.includes('UTD24'));
  for (const fixture of [first, second, third, fourth]) {
    assert.equal(fixture.row.children.length, 1, 'No extra child may appear alongside td');
    if (wrap(fixture.cell)) assert.equal(wrap(fixture.cell).parentNode, fixture.cell);
  }
  assert.ok(wrap(second.cell).textContent.includes('A'));
  assert.ok(!wrap(second.cell).textContent.includes('CSSCI'));
  scanCallback();
  assert.equal(second.cell.children.filter(el => el.classList.contains('econ-badges--cnki')).length, 1, 'No duplicates');
  first.cell.querySelector('a').textContent = 'Journal of Operations Management';
  scanCallback();
  assert.ok(wrap(first.cell), 'Updated source should be classified');
  assert.ok(wrap(first.cell).textContent.includes('FT50'));
  assert.ok(wrap(first.cell).textContent.includes('UTD24'));
  console.log('CNKI source-column layout tests passed');
})().catch(err => { console.error(err); process.exitCode = 1; });
