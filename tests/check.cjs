/* Run from repository root: node tests/check.cjs */
const assert=require("node:assert/strict");const fs=require("node:fs");const vm=require("node:vm");const path=require("node:path");
const root=path.join(__dirname,"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifest.json"),"utf8"));
const ctx={};vm.runInNewContext(fs.readFileSync(path.join(root,"data/economicsJournals.js"),"utf8"),ctx);
const lists=ctx.econData;
assert.equal(lists.top5.length,5);assert.equal(lists.ft50.length,50);assert.equal(lists.utd24.length,24);
for(const kind of ["top5","ft50","utd24"]){assert.equal(new Set(lists[kind].map(x=>x.toLowerCase())).size,lists[kind].length);assert.ok(lists[kind].every(x=>typeof x==="string"&&x.length>3));}
for(const name of lists.top5)assert.ok(lists.ft50.includes(name),"FT50 missing TOP5: "+name);
assert.ok(lists.ft50.includes("American Sociological Review"));assert.ok(!lists.ft50.includes("Journal of Business Ethics"));
const scripts=manifest.content_scripts[0].js;
assert.ok(scripts.includes("js/economics.js"));assert.ok(!scripts.some(x=>/ccf|rankDb|jquery/i.test(x)));
assert.equal(manifest.manifest_version,3);
assert.ok(manifest.browser_specific_settings.gecko.id);
for(const s of [...scripts,...manifest.content_scripts[0].css,manifest.options_ui.page,manifest.action.default_popup])assert.ok(fs.existsSync(path.join(root,s)),s);
console.log("Economics Journal Tags smoke checks passed (TOP5=5, FT50=50, UTD24=24).");
