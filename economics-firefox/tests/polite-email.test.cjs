const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ctx = vm.createContext({ URL });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/politeEmail.js'), 'utf8'), ctx);
const valid = value => vm.runInContext('econNormalizeContactEmail(' + JSON.stringify(value) + ')', ctx);
const url = (title, email) => new URL(vm.runInContext('econCrossrefRequestUrl(' +
  JSON.stringify(title) + ',' + JSON.stringify(email) + ')', ctx));
const allowed = [
  'test@163.com','test@126.com','test@qq.com','test@gmail.com',
  'test@outlook.com','test@outlook.cn','test@foxmail.com',
  'test@pku.edu.cn','test@economics.pku.edu.cn','test@mit.edu',
  'test@ac.cn','test@cas.ac.cn','test@ucl.ac.uk','test@hotmail.com',
  'test@yahoo.com','test@icloud.com','test+scholar@GMAIL.COM'
];
for (const candidate of allowed) assert.ok(valid(candidate), candidate);
assert.equal(valid('  Test+Scholar@GMAIL.COM  '),'Test+Scholar@gmail.com');
const denied = [
  'nobody@unknown-business.tld','test@gmail.com.evil.example',
  'test@fakeedu.cn','abc@edu.cn.bad','test@126.com.attacker.tld',
  'x@y.edu.cn.evil.com','no-at-symbol','@gmail.com',
  'bad..dots@qq.com','dot.@qq.com','.dot@qq.com',
  'with spaces@gmail.com','bad\nline@qq.com',null,42
];
for (const candidate of denied) assert.equal(valid(candidate),null,String(candidate));
const polite = url('Empirical analyses using secondary supply chain data','test+scholar@163.com');
assert.equal(polite.searchParams.get('mailto'),'test+scholar@163.com');
assert.equal(polite.searchParams.get('query.title'),'Empirical analyses using secondary supply chain data');
assert.equal(polite.searchParams.get('filter'),'type:journal-article');
assert.equal(url('sample paper','unknown@example.com').searchParams.has('mailto'),false);
assert.equal(url('sample paper','').searchParams.has('mailto'),false);
console.log('Crossref Polite Pool email tests passed:',allowed.length+denied.length+5);
