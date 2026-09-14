// Atlas-style hierarchy in screen units; canvas zoom is compensated when stroking.
export function lineStyle(kind,{night=false,zoom=1,detailed=false}={}){
 const scale=Math.max(.8,Math.min(1.3,1+Math.log2(Math.max(.5,zoom))*.055));
 const dark=night?'#dbccd9':'#665369',pale=night?'#483d514f':'#d7b8ca99';
 const specs=kind==='national'?[{width:3.5,color:night?'#162332b0':'#ffffffad'},{width:2.3,color:pale},{width:.95,color:dark,dash:detailed||zoom>=2?[8,3,1.2,3]:[]}]:kind==='regional'?[{width:1.8,color:night?'#24344088':'#ffffff99'},{width:.65,color:night?'#9eaac0':'#8b8191',dash:[4,3,1,3]}]:kind==='maritime'?[{width:2.6,color:night?'#294d6266':'#d2e9f0aa'},{width:1,color:night?'#81bada':'#588aa8',dash:[8,3,1.2,3]}]:[{width:1.7,color:night?'#2a566588':'#e8f5f3bb'},{width:.72,color:night?'#79aac3':'#5a92ab'}];
 return specs.map(s=>({...s,width:s.width*scale,dash:(s.dash||[]).map(n=>n*scale)}));
}
export function strokeAtlasLine(ctx,path,kind,options={}){
 const zoom=options.zoom||1;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const layer of lineStyle(kind,options)){ctx.strokeStyle=layer.color;ctx.lineWidth=layer.width/zoom;ctx.setLineDash(layer.dash.map(n=>n/zoom));ctx.stroke(path);}ctx.restore();
}
const key=p=>`${Math.round(p[0]*1e5)},${Math.round(p[1]*1e5)}`;
// Build a single shared boundary per neighbouring pair, avoiding doubled dash patterns.
export function overviewBoundaries(features){
 const edges=new Map();
 for(const f of features){if(f.properties.parentId||f.properties.territoryType==='maritime')continue;const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  for(const poly of polys)for(const ring of poly)for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];if(Math.abs(a[0]-b[0])>180||Math.abs(a[0])>179.999&&Math.abs(b[0])>179.999||Math.abs(a[1])>89.999&&Math.abs(b[1])>89.999)continue;const ka=key(a),kb=key(b),id=ka<kb?ka+';'+kb:kb+';'+ka;if(ka===kb)continue;const edge=edges.get(id);if(edge)edge.owners.add(f.properties.id);else edges.set(id,{a,b,ka,kb,owners:new Set([f.properties.id])});}
 }
 const groups=new Map();for(const e of edges.values()){const group=e.owners.size>1?'border:'+Array.from(e.owners).sort().join(':'):'coast';if(!groups.has(group))groups.set(group,[]);groups.get(group).push(e);}
 const coast=[],border=[];
 for(const [kind,list] of groups){const nodes=new Map(),used=new Set();for(const e of list)for(const k of [e.ka,e.kb]){if(!nodes.has(k))nodes.set(k,[]);nodes.get(k).push(e);}
  const walk=(edge,start)=>{const line=[];let k=start,e=edge;while(e&&!used.has(e)){used.add(e);const forward=e.ka===k;if(!line.length)line.push(forward?e.a:e.b);line.push(forward?e.b:e.a);k=forward?e.kb:e.ka;const next=nodes.get(k);e=next?.length===2?next.find(n=>!used.has(n)):null;}return line;};
  const out=kind==='coast'?coast:border;for(const e of list){if(used.has(e))continue;if(nodes.get(e.ka).length!==2)out.push(walk(e,e.ka));else if(nodes.get(e.kb).length!==2)out.push(walk(e,e.kb));}for(const e of list)if(!used.has(e))out.push(walk(e,e.ka));
 }
 return {coast:{type:'MultiLineString',coordinates:coast},border:{type:'MultiLineString',coordinates:border}};
}
export function lineLegendSvg(){return [['coast','海岸线'],['national','陆地国界'],['regional','地区界']].map(([kind,label])=>`<span><svg width="45" height="14" viewBox="0 0 45 14" aria-hidden="true">${lineStyle(kind,{detailed:true}).map(s=>`<path d="M2 7H43" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-dasharray="${s.dash.join(' ')}"/>`).join('')}</svg>${label}</span>`).join('');}
