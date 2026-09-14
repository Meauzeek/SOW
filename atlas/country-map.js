import {drawIceCover} from './ice-style.js';
import {drawTerrainLegend} from './terrain-legend.js';
import {drawCityLegend} from './city-markers.js';
import {strokeAtlasLine} from './atlas-lines.js';
const polygons=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];
const segments=f=>polygons(f).flatMap(p=>p.flatMap(r=>r.slice(1).map((b,i)=>[r[i],b]))).filter(([a,b])=>Math.abs(a[0]-b[0])<180&&!(Math.abs(a[0])>179.999&&Math.abs(b[0])>179.999)&&!(Math.abs(a[1])>89.999&&Math.abs(b[1])>89.999));
const marine=f=>f.properties.territoryType==='maritime';
const joinSegments=lines=>{const joined=[];for(const [a,b] of lines){const last=joined.at(-1),end=last?.at(-1);if(end&&end[0]===a[0]&&end[1]===a[1])last.push(b);else joined.push([a,b]);}return joined;};
export function countryScope(territories,cities,id){
 const root=territories.find(f=>f.properties.id===id);if(!root)return null;
 const ids=new Set([id]);let changed=true;while(changed){changed=false;for(const f of territories)if(ids.has(f.properties.parentId)&&!ids.has(f.properties.id)){ids.add(f.properties.id);changed=true;}}
 const members=territories.filter(f=>ids.has(f.properties.id)),land=members.filter(f=>!marine(f)&&(!ids.has(f.properties.parentId)||f.properties.parentId===id)),sea=members.filter(marine);
 // Match against neighbouring segments, including edges with different vertex spacing.
 const index=new Map(),cell=(x,y)=>`${x},${y}`;
 for(const f of territories){if(ids.has(f.properties.id)||f.properties.parentId||marine(f))continue;for(const [a,b] of segments(f)){
  for(let x=Math.floor(Math.min(a[0],b[0]));x<=Math.floor(Math.max(a[0],b[0]));x++)for(let y=Math.floor(Math.min(a[1],b[1]));y<=Math.floor(Math.max(a[1],b[1]));y++){const k=cell(x,y);if(!index.has(k))index.set(k,[]);index.get(k).push([a,b]);}
 }}
 const coast=[],border=[];
 // Parent polygons already contain their ordinary subdivisions. Avoid internal outlines.
 const outline=land.filter(f=>!ids.has(f.properties.parentId));
 for(const f of outline)for(const [a,b] of segments(f)){
  const m=[(a[0]+b[0])/2,(a[1]+b[1])/2],x=Math.floor(m[0]),y=Math.floor(m[1]);let shared=false;
  for(let dx=-1;dx<=1&&!shared;dx++)for(let dy=-1;dy<=1&&!shared;dy++)for(const [u,v] of index.get(cell(x+dx,y+dy))||[]){
   const vx=v[0]-u[0],vy=v[1]-u[1],len=vx*vx+vy*vy;if(!len)continue;
   const t=((m[0]-u[0])*vx+(m[1]-u[1])*vy)/len;
   if(t>=-1e-5&&t<=1+1e-5&&Math.hypot(m[0]-u[0]-t*vx,m[1]-u[1]-t*vy)<.00015){shared=true;break;}
  }
  (shared?border:coast).push([a,b]);
 }
 return {id,root,ids,land,sea,cities:cities.filter(c=>ids.has(c.countryId)),coast:{type:'MultiLineString',coordinates:joinSegments(coast)},border:{type:'MultiLineString',coordinates:joinSegments(border)}};
}
export function nationalProjection(map){
 const d3=window.d3,s=map.countryScope,ll=s.root.properties.label||d3.geoCentroid(map.d3Geometry(s.root));
 map.nationalRotation=[-ll[0],-ll[1],0];
 const features=[...s.land,...s.sea].map(f=>map.d3Geometry(f));
 if(s.cities.length)features.push({type:'Feature',properties:{},geometry:{type:'MultiPoint',coordinates:s.cities.map(c=>c.coordinates)}});
 return d3.geoAzimuthalEqualArea().rotate(map.nationalRotation).clipAngle(179.9).fitExtent([[map.w<600?24:55,map.h<480?75:105],[map.w-35,map.h-76]],{type:'FeatureCollection',features});
}
export function drawNational(map){
 const ctx=map.ctx,t=map.transform,s=map.countryScope;
 ctx.setTransform(map.dpr,0,0,map.dpr,0,0);ctx.clearRect(0,0,map.w,map.h);ctx.fillStyle=map.night?'#132a39':'#dcebf2';ctx.fillRect(0,0,map.w,map.h);
 ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.k,t.k);
 if(map.countryNeighbors)for(const {f,path} of map.paths){if(s.ids.has(f.properties.id)||f.properties.parentId)continue;ctx.fillStyle=map.night?'#263642':'#e8edf0';ctx.fill(path);}
 const mask=new Path2D();for(const f of s.land){const path=map.pathFor(f);mask.addPath(path);ctx.fillStyle=map.fillColor(f);ctx.fill(path);}
 for(const f of s.sea){const path=map.pathFor(f);ctx.fillStyle=map.night?'#328ab833':'#55a3c033';ctx.fill(path);strokeAtlasLine(ctx,map.borderFor(f,path),'maritime',{night:map.night,zoom:t.k,detailed:true});}
 ctx.save();ctx.clip(mask);
 if(map.terrain){const old=map.terrain.transform,ratio=old.ratio,rel=t.k/old.k;ctx.save();ctx.setTransform(map.dpr,0,0,map.dpr,0,0);ctx.translate(t.x-old.x*rel,t.y-old.y*rel);ctx.scale(rel,rel);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(map.terrain.canvas,0,0,map.terrain.canvas.width/ratio,map.terrain.canvas.height/ratio);ctx.restore();}
 if(map.coastPaths&&map.layers.flood&&map.illustratedCoast()){ctx.fillStyle=map.night?'#132a39':'#dcebf2';ctx.fill(map.coastPaths[1]);strokeAtlasLine(ctx,map.coastOutline||map.coastPaths[0],'coast',{night:map.night,zoom:t.k});}
 if(map.layers.water){ctx.fillStyle=map.night?'#193d52':'#c2e1ef';ctx.strokeStyle='#619ab6';ctx.lineWidth=.65/t.k;for(const lake of map.waterPaths||[]){ctx.fill(lake.path);ctx.stroke(lake.path);}if(map.contextPaths.river){ctx.strokeStyle='#74a9bf';ctx.stroke(map.contextPaths.river);}}
 if(map.view==='standard'&&map.contextPaths.road){ctx.strokeStyle=map.night?'#7f795e':'#dbc69b';ctx.lineWidth=1/t.k;ctx.stroke(map.contextPaths.road);}
 if(map.layers.admin){for(const item of map.adminPaths)strokeAtlasLine(ctx,item.path,'regional',{night:map.night,zoom:t.k,detailed:true});}
 if(map.showIce())drawIceCover(map);
 ctx.restore();
 const geo=window.d3.geoPath(map.proj);
 strokeAtlasLine(ctx,new Path2D(geo(s.coast)||''),'coast',{night:map.night,zoom:t.k,detailed:true});
 strokeAtlasLine(ctx,new Path2D(geo(s.border)||''),'national',{night:map.night,zoom:t.k,detailed:true});
 ctx.restore();map.labelBoxes=[];if(map.layers.cities)map.drawCities();map.drawEditing();
 // The legend is part of exported national maps as well as the on-screen view.
 ctx.font='600 12px "Atlas Serif","Atlas Ming",serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=map.night?'#d4e3ed':'#40596c';
 let legendX=28;for(const [kind,label] of [['coast','海岸线'],['national','陆地国界'],...(s.sea.length?[['maritime','海洋疆域']]:[])]){const sample=new Path2D();sample.moveTo(legendX,map.h-25);sample.lineTo(legendX+35,map.h-25);strokeAtlasLine(ctx,sample,kind,{night:map.night,detailed:true});ctx.fillText(label,legendX+42,map.h-25);legendX+=110;}
 if(map.exporting){if(map.view==='terrain')drawTerrainLegend(ctx,32,map.h-150,Math.min(380,map.w-64),{night:map.night});if(map.layers.cities)drawCityLegend(ctx,32,map.h-48,{night:map.night});ctx.font='600 27px "Atlas Serif","Atlas Ming",serif';ctx.fillText(s.root.properties.name+'地图',28,35);ctx.font='600 12px "Atlas Serif","Atlas Ming",serif';ctx.fillText(`海平面 +${map.sea} m`,28,60);}
}
