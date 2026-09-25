import {readArchiveJSON} from './project-startup.js?v=r30';
// Local drafts may be a single array; published archives are split by city.
export async function loadCityArchive(url,fetcher=fetch){
 const read=path=>readArchiveJSON(path,fetcher);
 const index=await read(url);
 if(Array.isArray(index))return index;
 if(index.format!=='atlas-city-chunks-v1'||!Array.isArray(index.parts)||index.parts.length>100)throw Error('城市档案索引无效');
 const base=url.slice(0,url.lastIndexOf('/')+1);
 const chunks=await Promise.all(index.parts.map(name=>{
  if(!/^cities-part-\d+\.json$/.test(name))throw Error('城市档案分片路径无效');
  return read(base+name);
 }));
 if(chunks.some(chunk=>!Array.isArray(chunk)))throw Error('城市档案分片无效');
 const cities=chunks.flat();if(cities.length!==index.count)throw Error('城市档案数量不完整');
 return cities;
}
