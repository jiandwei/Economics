// Run: node economics-firefox/tests/matching.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
for (const file of ['data/journals.js', 'js/matcher.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const check = code => vm.runInContext(code, context);
const cases = [
  ['American Economic Review, 2020 - JSTOR', 'American Economic Review'],
  ['Am Econ Rev, 2021 - AEA', 'American Economic Review'],
  ['Q J Econ, 2018 - Oxford', 'Quarterly Journal of Economics'],
  ['J Polit Econ, 2019 - Chicago', 'Journal of Political Economy'],
  ['Review of Economic Studies, 2023', 'Review of Economic Studies'],
  ['Journal of Finance, 2022', 'Journal of Finance'],
  ['Rev Fin Stud, 2024', 'Review of Financial Studies'],
  ['Applied Economics, 2022', null]
];
for (const [venue, expected] of cases) {
  const result = check('matches(' + JSON.stringify(venue) + ', catalog([]))');
  assert.equal(result.length ? result[0].title : null, expected, venue);
}
assert.equal(check("matches('Journal of Economic Theory, 2024', catalog([{title:'Journal of Economic Theory',level:'A类'}]))[0].school"), 'A类');
console.log('Passed:', cases.length + 1, 'journal-matching checks');
