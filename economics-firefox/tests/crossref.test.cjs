// Verify reliable title / year / author matching before assigning journal.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/resolveVenue.js'),'utf8'),ctx);
const choose=(items,q)=>vm.runInContext('econSelectCrossrefVenue('+JSON.stringify(items)+','+JSON.stringify(q)+')',ctx);
const title='Empirical analyses using secondary supply chain data';
const query={title,author:'Y Dong',year:2026};
const record={type:'journal-article',DOI:'10.1000/test',title:[title],
  'container-title':['Journal of Operations Management'],
  published:{'date-parts':[[2026]]},author:[{family:'Dong'}]};
assert.equal(choose([record],query).venue,'Journal of Operations Management');
assert.equal(choose([{...record,title:['Unrelated manuscript about supply chains']}],query),null);
assert.equal(choose([{...record,author:[{family:'Smith'}]}],query),null);
assert.equal(choose([{...record,published:{'date-parts':[[2019]]}}],query),null);
assert.equal(choose([{...record,type:'book-chapter'}],query),null);
assert.equal(choose([record,{...record,'container-title':['Journal of Supply Chain Management']}],query),null);
assert.equal(choose([{...record,title:[title+'!']}],query).venue,'Journal of Operations Management');
assert.equal(choose([],query),null);
console.log('Crossref resolution tests passed');

const doiContext=vm.createContext({URL});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/doi.js'),'utf8'),doiContext);
const extract=href=>vm.runInContext('econExtractDoi('+JSON.stringify(href)+')',doiContext);
assert.equal(extract('https://onlinelibrary.wiley.com/doi/abs/10.1002/joom.70037'),'10.1002/joom.70037');
assert.equal(extract('https://doi.org/10.1002/joom.70037'),'10.1002/joom.70037');
assert.equal(extract('https://www.sciencedirect.com/science/article/pii/S12345678'),null);
assert.equal(extract('https://scholar.google.com/scholar?q=10.1002/joom.70037'),null);
console.log('DOI publisher URL extraction tests passed');
