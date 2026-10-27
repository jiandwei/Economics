// Run: node economics-firefox/tests/matching.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
for (const file of ['data/journals.js', 'data/chinese-journals.js', 'js/matcher.js']) {
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

const chineseCases=[['经济研究','经济研究'],['南开经济研究','南开经济研究'],['世界经济研究','世界经济研究'],['世界经济','世界经济'],['金融研究','金融研究'],['经济学（季刊）','经济学(季刊)'],['经济研究综述',null],['中国经济研究所',null],['数量经济与技术经济研究','数量经济技术经济研究']];
for(const [venue,want]of chineseCases){const got=check('matches('+JSON.stringify(venue)+',catalog([]))');assert.equal(got.length?got[0].title:null,want,venue);}
const school=check("matches('中国财政研究',catalog([{title:'中国财政研究',level:'A类',cssci:'是',pku:'是',ami:'核心'}]))[0]");
assert.equal(school.school,'A类');assert.ok(school.groups.includes('cssci'));assert.ok(school.groups.includes('pku'));assert.equal(school.ami,'核心');
console.log('Chinese journal tests passed:',chineseCases.length+1);
