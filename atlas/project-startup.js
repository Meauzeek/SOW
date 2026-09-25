// Build a complete initial state before exposing it to editing or autosave.
export const currentCorrections=['southern-territories-r16','detail-corrections-r17','heraldry-presets-r17','city-names-r18','japan-cities-r19','south-coast-cities-r20','kobe-r21','jiahe-r22','jiahe-media-r23','europe-polar-r24','story-links-r25','atlas-roles-r29'];
export function emptyStartupDraft(p){return p?.version===1&&Array.isArray(p.territories)&&Array.isArray(p.cities)&&p.territories.length===0&&p.cities.length===0;}
export async function loadInitialProject({loadSaved,loadDefaults,backup,validate,initial}){
 const saved=await loadSaved();
 if(saved&&!emptyStartupDraft(saved)){validate(saved);return {project:saved,saved:true,recovered:false};}
 const defaults=await loadDefaults();
 if(!defaults.territories?.length||!defaults.cities?.length)throw Error('发布档案不完整，请重新加载');
 const project={...initial,...(saved||{}),territories:defaults.territories,cities:defaults.cities,appliedCorrections:[...currentCorrections]};
 validate(project);
 if(saved)await backup(saved); // Preserve the exact old draft before recovering the published archive.
 return {project,saved:false,recovered:!!saved};
}
export async function readArchiveJSON(url,fetcher=fetch){
 let failure;
 for(let attempt=0;attempt<3;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{const r=await fetcher(url,{signal:controller.signal,...(attempt?{cache:'reload'}:{})});if(!r.ok)throw Error(`档案请求失败（${r.status}）`);return await r.json();}
  catch(error){failure=error;}finally{clearTimeout(timer);}
 }
 throw Error('无法读取 '+url+'：'+(failure?.name==='AbortError'?'连接超时':failure.message));
}
export async function restorePublishedProject({previous,initial,loadDefaults,backup,save,validate}){
 const {project}=await loadInitialProject({loadSaved:async()=>null,loadDefaults,backup,validate,initial});
 if(previous)await backup(previous);
 await save(project);
 return project;
}
