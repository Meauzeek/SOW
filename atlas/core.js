(function(global){
 'use strict';
 const clone=v=>JSON.parse(JSON.stringify(v));
 function rings(f){return f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat();}
 function points(f){return rings(f).flat();}
 const key=p=>p[0].toFixed(6)+','+p[1].toFixed(6);
 function sharedIndex(features){const index=new Map();for(const f of features)for(const r of rings(f))for(const p of r){const k=key(p);if(!index.has(k))index.set(k,[]);index.get(k).push(p);}return index;}
 function moveShared(features,from,to){const refs=sharedIndex(features).get(key(from))||[];for(const p of refs){p[0]=to[0];p[1]=to[1];}return refs.length;}
 function insertShared(features,a,b,p){let count=0;for(const f of features)for(const r of rings(f))for(let i=r.length-2;i>=0;i--){if((key(r[i])===key(a)&&key(r[i+1])===key(b))||(key(r[i])===key(b)&&key(r[i+1])===key(a))){r.splice(i+1,0,[...p]);count++;}}return count;}
 function removeShared(features,p){let count=0;const k=key(p);for(const f of features)for(const r of rings(f)){if(r.length<=4)continue;const open=r.slice(0,-1).filter(q=>key(q)!==k);if(open.length>=3&&open.length<r.length-1){count+=r.length-1-open.length;r.splice(0,r.length,...open,[...open[0]]);}}return count;}
 class History{constructor(limit=20){this.limit=limit;this.past=[];this.future=[];}push(state){this.past.push(clone(state));if(this.past.length>this.limit)this.past.shift();this.future=[];}undo(state){if(!this.past.length)return null;this.future.push(clone(state));return this.past.pop();}redo(state){if(!this.future.length)return null;this.past.push(clone(state));return this.future.pop();}}
 function validateProject(p){
  if(!p||p.version!==1||!Array.isArray(p.territories)||!Array.isArray(p.cities))throw Error('不是有效的 ATLAS v1 项目');
  if(p.territories.length>15000||p.cities.length>100000)throw Error('项目对象过多');
  const ids=new Set();for(const f of p.territories){validateFeature(f);if(!f.properties.id||ids.has(f.properties.id))throw Error('地区 ID 缺失或重复');ids.add(f.properties.id);}
  for(const f of p.territories){const seen=new Set([f.properties.id]);let parent=f.properties.parentId;while(parent){if(!ids.has(parent)||seen.has(parent))throw Error('地区上下级关系缺失或成环');seen.add(parent);parent=p.territories.find(x=>x.properties.id===parent)?.properties.parentId;}}
  const cityIds=new Set();for(const c of p.cities){if(!c.id||cityIds.has(c.id))throw Error('城市 ID 缺失或重复');cityIds.add(c.id);validPoint(c.coordinates);validateMetadata(c);if(c.countryId&&!ids.has(c.countryId))throw Error('城市所属地区不存在');if(c.hostCountryId&&!ids.has(c.hostCountryId))throw Error('自由市所在国家不存在');}
  if(p.seaLevel!==undefined&&(!Number.isFinite(p.seaLevel)||p.seaLevel<-500||p.seaLevel>1000))throw Error('海平面超出范围');
  if(p.seaYear!=null&&(!Number.isInteger(p.seaYear)||p.seaYear<1||p.seaYear>9999))throw Error('情景年份无效');
  if(p.customDem){const d=p.customDem;if(!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<2||d.height<2||d.width*d.height>4194304||d.values?.length!==d.width*d.height||!Array.isArray(d.bbox)||d.bbox.length!==4||d.bbox.some(x=>!Number.isFinite(x))||d.bbox[0]>=d.bbox[2]||d.bbox[1]>=d.bbox[3])throw Error('DEM 网格无效');if(d.values.some(v=>v!==null&&!Number.isFinite(v)))throw Error('DEM 高程无效');}
 return p;
 }
 function validateMetadata(p){if(p.includeInNationalTotals!=null&&typeof p.includeInNationalTotals!=='boolean')throw Error('计入国内总数必须为布尔值');if(p.featured!=null&&typeof p.featured!=='boolean')throw Error('明星标记必须为布尔值');if(p.sizeClass!=null&&!['auto',...CITY_CLASSES.map(c=>c.id)].includes(p.sizeClass))throw Error('城市人口等级无效');for(const k of ['population','gdp','lifeExpectancy','literacy','urbanization','elevation'])if(p[k]!=null&&(!Number.isFinite(p[k])||(k!=='elevation'&&p[k]<0)))throw Error('数值字段无效：'+k);for(const k of ['literacy','urbanization'])if(p[k]>100)throw Error(k+' 必须在 0–100%');for(const k of ['id','name','englishName','localName','localRomanization','localLanguage','realName','notes','alias','fullName','abbreviation'])if(p[k]!=null&&typeof p[k]!=='string')throw Error('文本字段无效：'+k);if(!p.name?.trim())throw Error('名称不能为空');if(p.media){for(const m of Object.values(p.media)){if(!m||typeof m.dataUrl!=='string'||m.dataUrl.length>6000000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(m.dataUrl))throw Error('图片必须是嵌入的 PNG / JPEG / WebP，且不超过 4 MB');if(m.caption!=null&&typeof m.caption!=='string')throw Error('图片说明必须为文本');}}}
 function validPoint(p){if(!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>90)throw Error('坐标必须为 WGS84 经度 / 纬度');}
 function validateFeature(f){if(f?.type!=='Feature'||!['Polygon','MultiPolygon'].includes(f.geometry?.type)||!f.properties)throw Error('只支持 Polygon / MultiPolygon GeoJSON');if(f.properties.id)validateMetadata(f.properties);for(const r of rings(f)){if(r.length<4)throw Error('多边形至少需要 3 个顶点');for(const p of r)validPoint(p);if(key(r[0])!==key(r.at(-1)))throw Error('多边形环必须闭合');}}
 function sampleDem(d,lon,lat){if(!d)return null;const [w,s,e,n]=d.bbox;if(lon<w||lon>e||lat<s||lat>n)return null;const x=Math.min(d.width-1,Math.floor((lon-w)/(e-w)*d.width)),y=Math.min(d.height-1,Math.floor((n-lat)/(n-s)*d.height));const z=d.values[y*d.width+x];return Number.isFinite(z)?z:null;}
 // Ocean-connected threshold model, four-neighbour, with longitude wrap.
 // Seeds are established open ocean; negative inland depressions stay dry.
 function connectedFlood(values,width,height,sea,seeds,wrap=true){const seen=new Uint8Array(values.length),queue=new Int32Array(values.length);let head=0,tail=0;function add(i){if(i>=0&&i<values.length&&!seen[i]&&Number.isFinite(values[i])&&values[i]<=sea){seen[i]=1;queue[tail++]=i;}}for(const i of seeds)add(i);while(head<tail){const i=queue[head++],x=i%width;add(i-width);add(i+width);if(x>0)add(i-1);else if(wrap)add(i+width-1);if(x<width-1)add(i+1);else if(wrap)add(i-width+1);}return seen;}
 // Fictional scenario: constant mean rise between the author's two dated anchors.
 function seaLevelAt(year){if(!Number.isFinite(year))throw Error('年份无效');return (year-1986)*3.7/(2025-1986);}
 const CITY_CLASSES=[
  {id:'small',label:'小城市',range:'不足 20 万',min:0,radius:2,zoom:4},
  {id:'medium',label:'中小城市',range:'20—50 万',min:200000,radius:2.6,zoom:3.1},
  {id:'large',label:'中等城市',range:'50—100 万',min:500000,radius:3.2,zoom:2.3},
  {id:'million',label:'大城市',range:'100—300 万',min:1000000,radius:3.9,zoom:1.8},
  {id:'major',label:'特大城市',range:'300—500 万',min:3000000,radius:4.5,zoom:1.3},
  {id:'metro',label:'超大城市',range:'500—1000 万',min:5000000,radius:5.1,zoom:1},
  {id:'mega',label:'巨型城市',range:'1000 万以上',min:10000000,radius:5.8,zoom:.7}];
 function cityClass(city){const manual=CITY_CLASSES.find(c=>c.id===city.sizeClass);if(manual)return manual;if(!Number.isFinite(city.population))return {id:'unknown',label:'人口未知',range:'未填写',radius:2.5,zoom:3.1};return [...CITY_CLASSES].reverse().find(c=>city.population>=c.min)||CITY_CLASSES[0];}
 function cityDisplay(city,zoom,selected=false){const national=city.capital&&city.capitalRole!=='regional',size=cityClass(city),threshold=national?.45:city.capital?Math.min(1.25,size.zoom):size.zoom,scale=Math.max(.4,Math.min(1,zoom/3.5));return {visible:selected||zoom>=threshold,radius:selected?Math.max(6,size.radius):size.radius*scale,label:selected||zoom>=Math.max(national?2:2.5,threshold+.8)};}

 function countsInNationalTotals(city){return city.includeInNationalTotals??city.id!=='ref-19';}
 // Aggregate recorded cities by jurisdiction, including descendant territories.
 // Country-wide demographic estimates remain independent, since city coverage is incomplete.
 function cityTotals(territoryId,territories,cities){const ids=new Set([territoryId]);let changed=true;while(changed){changed=false;for(const f of territories)if(ids.has(f.properties.parentId)&&!ids.has(f.properties.id)){ids.add(f.properties.id);changed=true;}}const all=cities.filter(c=>ids.has(c.countryId)),included=all.filter(countsInNationalTotals);return {recorded:all.length,included:included.length,excluded:all.length-included.length,population:included.reduce((s,c)=>s+(c.population??0),0),gdp:included.reduce((s,c)=>s+(c.gdp??0),0),missingPopulation:included.filter(c=>c.population==null).length,missingGdp:included.filter(c=>c.gdp==null).length};}
 const api={countsInNationalTotals,cityTotals,CITY_CLASSES,cityClass,seaLevelAt,cityDisplay,clone,rings,points,key,sharedIndex,moveShared,insertShared,removeShared,History,validateProject,validateFeature,sampleDem,connectedFlood};
 if(typeof module!=='undefined')module.exports=api;else global.AtlasCore=api;
})(typeof window!=='undefined'?window:globalThis);
