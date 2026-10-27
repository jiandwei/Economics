(async function(){
const store=await browser.storage.local.get({schoolJournals:[],enabled:{top5:true,ft50:true,utd24:true,school:true}});
const ranks=catalog(store.schoolJournals);
const css={top5:'econ-top5',ft50:'econ-ft50',utd24:'econ-utd',school:'econ-school'};
const labels={top5:'TOP5',ft50:'FT50',utd24:'UTD24'};
function decorate(el,raw){
 if(!el||el.dataset.econTagged==='1'||el.closest('.econ-badges'))return;
 const found=matches(raw,ranks); if(!found.length)return;
 const wrap=document.createElement('span');wrap.className='econ-badges';
 let used=new Set();
 for(const entry of found) {
  for(const group of entry.groups){if(!store.enabled[group]||used.has(group))continue;const badge=document.createElement('span');badge.className='econ-badge '+css[group];badge.textContent=labels[group];badge.title=entry.title;wrap.append(badge);used.add(group)}
  if(entry.school&&store.enabled.school){const badge=document.createElement('span');badge.className='econ-badge econ-school';badge.textContent=entry.school;badge.title='学校目录：'+entry.title;wrap.append(badge)}
 }
 if(!wrap.childElementCount)return;
 el.dataset.econTagged='1';el.after(wrap);
}
function scan(){
 const host=location.hostname;
 if(host.startsWith('scholar.google.')){
  document.querySelectorAll('.gs_ri .gs_a, .gsc_a_tr .gs_gray, .gs_ri .gs_a, .gs_nph, .gsc_a_t').forEach(el=>decorate(el,el.textContent));
 } else if(host.includes('webofscience')||host.includes('clarivate')){
  document.querySelectorAll('.summary-source-title-link,.summary-source-title,[data-ta="source-title"]').forEach(el=>decorate(el,el.textContent));
 } else if(host.includes('semanticscholar')){
  document.querySelectorAll('.cl-paper-venue,[data-test-id="venue-metadata"]').forEach(el=>decorate(el,el.textContent));
 } else if(host.startsWith('dblp')){
  document.querySelectorAll('cite .publ .title,cite .publ, .data h1, .head').forEach(el=>decorate(el,el.textContent));
 }
}
scan();let timer;const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,450)});observer.observe(document.body,{childList:true,subtree:true});
browser.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.schoolJournals||changes.enabled))location.reload()});
})();