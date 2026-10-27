"use strict";
const api = typeof browser !== "undefined" ? browser : chrome;
const defaults = {enabled:{top5:true,ft50:true,utd24:true,school:true},schoolName:"学校目录",schoolJournals:[]};
const $ = id => document.getElementById(id);
function status(message, error=false){$("status").textContent=message;$("status").style.color=error?"#b42318":"#067647";}
function csvRows(input){
  const text=String(input).replace(/^\uFEFF/,"");const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===","&&!quoted){row.push(cell);cell="";}
    else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell="";}
    else cell+=c;
  }
  if(quoted)throw Error("CSV 引号没有正确关闭");
  row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
  if(!rows.length)throw Error("CSV 文件为空");
  const names=rows.shift().map(x=>x.trim().toLowerCase());
  const ji=names.indexOf("journal"),li=names.indexOf("level"),ai=names.indexOf("aliases");
  if(ji<0||li<0)throw Error("需要 journal 和 level 表头");
  return rows.map(r=>({journal:r[ji],level:r[li],aliases:ai>=0?r[ai]:""}));
}
function sanitize(items){
  if(!Array.isArray(items)||items.length>2000)throw Error("目录必须为不超过 2000 条的数组");
  const clean=items.map((item,index)=>{
    if(!item||typeof item!=="object")throw Error("第 "+(index+1)+" 条格式错误");
    const journal=String(item.journal||"").trim().slice(0,200);
    const level=String(item.level||"").trim().slice(0,80);
    if(!journal||!level)throw Error("第 "+(index+1)+" 条缺少 journal 或 level");
    const aliases=(Array.isArray(item.aliases)?item.aliases:String(item.aliases||"").split("|"))
      .map(x=>String(x||"").trim().slice(0,200)).filter(Boolean).slice(0,20);
    return {journal,level,aliases};
  });
  return clean;
}
async function count(){const obj=await api.storage.local.get(defaults);$("count").textContent="已导入 "+(obj.schoolJournals||[]).length+" 种学校期刊";}
async function init(){
  const values=await api.storage.local.get(defaults);
  for(const key of ["top5","ft50","utd24","school"]){$(key).checked=values.enabled?.[key]!==false;$(key).addEventListener("change",async()=>{
    const current=await api.storage.local.get("enabled");const enabled={...defaults.enabled,...current.enabled,[key]:$(key).checked};
    await api.storage.local.set({enabled});status("已保存，打开的学术搜索页面会自动更新");
  });}
  $("schoolName").value=values.schoolName||"学校目录";
  $("schoolName").addEventListener("change",async()=>{await api.storage.local.set({schoolName:$("schoolName").value.trim()||"学校目录"});status("学校名称已保存");});
  $("upload").addEventListener("change",async e=>{
    try{
      const file=e.target.files[0];if(!file)return;
      if(file.size>1024*1024)throw Error("文件大于 1 MB");
      const raw=await file.text();const value=file.name.toLowerCase().endsWith(".json")?JSON.parse(raw):csvRows(raw);
      const entries=sanitize(Array.isArray(value)?value:value.journals);
      if(!entries.length)throw Error("目录为空");
      await api.storage.local.set({schoolJournals:entries});
      if(value.schoolName&&typeof value.schoolName==="string"){$("schoolName").value=value.schoolName.slice(0,35);await api.storage.local.set({schoolName:$("schoolName").value});}
      await count();status("已导入 "+entries.length+" 种期刊；旧学校目录已替换");
    }catch(ex){status("导入失败："+ex.message,true)}finally{e.target.value="";}
  });
  $("clear").addEventListener("click",async()=>{if(!confirm("确定清空学校目录？此操作不影响 TOP5 / FT50 / UTD24。"))return;await api.storage.local.set({schoolJournals:[]});await count();status("已清空");});
  $("export").addEventListener("click",async()=>{
    const data=await api.storage.local.get(defaults);
    const json=JSON.stringify({schoolName:data.schoolName,journals:data.schoolJournals},null,2);
    const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="economics-school-journals.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status("已导出学校目录");
  });
  await count();
}
init().catch(e=>status(e.message,true));
