const $=id=>document.getElementById(id);
const keys=['top5','ft50','utd24','cssci','pku','ami','school','crossrefResolve'], cols=['title','level','cssci','pku','ami'];
const aliases={'title':'title','期刊名称':'title','刊名':'title','期刊':'title','journal':'title','level':'level','学校等级':'level','等级':'level','cssci':'cssci','c刊':'cssci','pku':'pku','北大核心':'pku','ami':'ami'};
function cells(text){const out=[];let row=[],field='',quoted=false;text=String(text).replace(/^\uFEFF/,'');
for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted;}else if(!quoted&&(c===','||c==='\n'||c==='\r')){row.push(field.trim());field='';if(c!==','){if(row.some(Boolean))out.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}else field+=c;}
if(quoted)throw Error('CSV 引号未闭合');row.push(field.trim());if(row.some(Boolean))out.push(row);return out;}
function normalizeRows(rows){if(!Array.isArray(rows)||rows.length>10000)throw Error('目录最多10000条');return rows.map((r,i)=>{const o={};for(const [k,v]of Object.entries(r)){const name=aliases[k.toLowerCase().trim()];if(name)o[name]=String(v??'').trim();}if(!o.title||o.title.length>300)throw Error('第 '+(i+1)+' 行刊名无效');return Object.fromEntries(cols.map(k=>[k,o[k]||'']));});}
function parseCSV(text){const rows=cells(text);if(!rows.length)return [];const hdr=rows[0].map(x=>aliases[x.toLowerCase().trim()]);const hasHeader=hdr.includes('title');return normalizeRows(rows.slice(hasHeader?1:0).map(row=>{const out={};if(hasHeader)hdr.forEach((k,i)=>{if(k)out[k]=row[i]||'';});else cols.forEach((k,i)=>out[k]=row[i]||'');return out;}));}
function csv(rows){const quote=s=>{s=String(s??'');return /[,"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};return [cols.join(','),...rows.map(r=>cols.map(k=>quote(r[k])).join(','))].join('\r\n');}
async function init(){const data=await browser.storage.local.get({schoolJournals:[],enabled:{},crossrefEmail:''});keys.forEach(k=>$(k).checked=data.enabled[k]!==false);$('data').value=csv(normalizeRows(data.schoolJournals||[]));$('crossrefEmail').value=data.crossrefEmail||'';}
$('save').onclick=async()=>{try{const rows=parseCSV($('data').value);const rawEmail=$('crossrefEmail').value.trim();const email=rawEmail?econNormalizeContactEmail(rawEmail):'';if(rawEmail&&!email)throw Error('邮箱格式或域名不符合要求，请使用 163/126/QQ/Gmail/Outlook 或学校 .edu.cn/.edu 邮箱。');await browser.storage.local.set({schoolJournals:rows,enabled:Object.fromEntries(keys.map(k=>[k,$(k).checked])),crossrefEmail:email});$('status').textContent='已保存 '+rows.length+' 条；'+(email?'已启用 Crossref 礼貌池邮箱。':'Crossref 将使用公共池。')+' 刷新文献页面即可查看。';}catch(e){$('status').textContent='保存失败：'+e.message;}};
$('testCrossref').onclick=async()=>{
 const btn=$('testCrossref'), status=$('crossrefTestStatus');
 btn.disabled=true;status.textContent='正在检测 Crossref API…（使用已保存的邮箱）';
 try {
   const result=await browser.runtime.sendMessage({type:'econ.testCrossref'});
   if (!result) status.textContent='无法获得扩展后台的检测结果';
   else if (!result.ok) status.textContent='Crossref 连接失败；HTTP 状态：'+(result.status||'网络错误')+'。可稍后重试。';
   else if (result.pool==='polite') status.textContent='Crossref 连接正常，已确认 Polite Pool（礼貌池）。';
   else if (result.pool==='public') status.textContent='Crossref 连接正常，当前使用 Public Pool（公共池）。'+(result.emailConfigured?' 邮箱已保存，但未识别为礼貌池。':'');
   else status.textContent='Crossref 连接正常，但 API 未返回可识别的池类型。'+(result.emailConfigured?' 邮箱已经随请求提交。':'');
 }catch(_){status.textContent='连接检测失败：扩展后台不可用或网络不可达。';}
 finally {btn.disabled=false;}
};
$('upload').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const t=await f.text();const rows=f.name.toLowerCase().endsWith('.json')?normalizeRows(JSON.parse(t)):parseCSV(t);$('data').value=csv(rows);$('status').textContent='已导入 '+rows.length+' 条，请点击保存。';}catch(e){$('status').textContent='导入失败：'+e.message;}};
$('clear').onclick=async()=>{$('data').value=csv([]);await browser.storage.local.set({schoolJournals:[]});$('status').textContent='学校目录已清空';};
$('download').onclick=()=>{try{const blob=new Blob(['\uFEFF'+csv(parseCSV($('data').value))],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='school-journals.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$('status').textContent=e.message;}};
init().catch(e=>$('status').textContent=e.message);
