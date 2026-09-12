// Local Node edition and static GitHub Pages share the same portable project JSON.
const localHost=['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname);
let backend=localHost?'server':'browser';
const key=location.pathname.replace(/index\.html$/,'');
let dbPromise;
function db(){return dbPromise??=(new Promise((resolve,reject)=>{const r=indexedDB.open('stellagram-atlas',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}));}
async function stored(write,value){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('projects',write?'readwrite':'readonly'),s=tx.objectStore('projects');const r=write?s.put(value,key):s.get(key);let result;r.onsuccess=()=>result=r.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('浏览器存储事务中断'));});}
export const persistence={
 get label(){return backend==='server'?'本地文件':'此浏览器';},
 async load(){
  if(backend==='server'){
   const r=await fetch('/api/project');
   if(r.ok&&r.headers.get('content-type')?.includes('application/json'))return r.json();
   if(r.status!==404)throw Error('无法读取本地存档：'+r.status);
   // A static preview can also run on localhost. Only the Node API returns JSON 404.
   if(r.headers.get('content-type')?.includes('application/json'))return null;
   backend='browser';
  }
  return await stored(false)||null;
 },
 async save(project){
  if(backend==='browser'){await stored(true,project);return;}
  const r=await fetch('/api/project',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(project)});
  if(!r.ok)throw Error('本地文件写入失败：'+r.status);
 }
};
