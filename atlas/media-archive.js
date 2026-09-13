// Published images use bounded, same-site paths. Downloaded projects remain portable.
export const isMediaPath = value => /^data\/media\/assets\/[a-f0-9]{64}\.(png|jpeg|webp)$/.test(value);
export async function compactKnownMedia(project,fetcher=fetch){
 const response=await fetcher('data/media-index.json');if(!response.ok)return false;
 const known=new Set(await response.json()),entries=[];
 const walk=x=>{if(!x||typeof x!=='object')return;if(typeof x.dataUrl==='string'&&x.dataUrl.startsWith('data:image/'))entries.push(x);for(const v of Object.values(x))if(v&&typeof v==='object')walk(v);};walk(project);
 let changed=false;
 for(const m of entries){const previous=m.dataUrl,match=/^data:image\/(png|jpeg|webp);base64,(.+)$/s.exec(previous);if(!match)continue;const binary=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0)),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',binary))].map(b=>b.toString(16).padStart(2,'0')).join(''),path='data/media/assets/'+hash+'.'+match[1];if(known.has(path)&&m.dataUrl===previous){m.dataUrl=path;changed=true;}}
 return changed;
}
export async function portableProject(project, fetcher=fetch) {
 const copy=structuredClone(project), media=[];
 const walk=x=>{if(!x||typeof x!=='object')return;if(isMediaPath(x.dataUrl))media.push(x);for(const v of Object.values(x))if(v&&typeof v==='object')walk(v);};walk(copy);
 const cache=new Map();let next=0;
 async function convert(m){if(!cache.has(m.dataUrl))cache.set(m.dataUrl,(async()=>{const r=await fetcher(m.dataUrl);if(!r.ok)throw Error('图片下载失败，请稍后重试导出');const blob=await r.blob();return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});})());m.dataUrl=await cache.get(m.dataUrl);}
 await Promise.all(Array.from({length:Math.min(6,media.length)},async()=>{while(next<media.length)await convert(media[next++]);}));
 return copy;
}
