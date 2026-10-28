// Manifest must reflect the data actually transmitted by the extension.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const gecko=manifest.browser_specific_settings.gecko;
assert.equal(gecko.strict_min_version,'158.0');
assert.deepEqual(gecko.data_collection_permissions.required,['websiteContent']);
assert.deepEqual(gecko.data_collection_permissions.optional,['personallyIdentifyingInfo']);
const bg=fs.readFileSync(path.join(root,'background.js'),'utf8');
const opts=fs.readFileSync(path.join(root,'options.js'),'utf8');
assert.match(opts,/browser\.permissions\.request\(\{data_collection:\['personallyIdentifyingInfo'\]\}\)/);
assert.match(bg,/browser\.permissions\.getAll\(\)/);
assert.match(bg,/permissions\.data_collection\.includes\('personallyIdentifyingInfo'\)/);
assert.match(bg,/const url = econCrossrefRequestUrl\(query\.title, email\)/);
console.log('Firefox data collection permissions and email consent checks passed');
