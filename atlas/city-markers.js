// Administrative role chooses the shape; population chooses its scale.
export function markerKind(city){
 if(city.capital)return city.capitalRole==='regional'?'regional':'national';
 return city.settlementType==='town'||city.rank==='town'?'town':'city';
}
export function markerShape(city,radius,{simplified=false}={}){
 const kind=markerKind(city),filled=kind==='national'||kind==='city';
 // Population radius always measures the outer symbol, including capital rings.
 const inner=radius*.58;
 const rings=['national','regional'].includes(kind)?(simplified||radius<2.8?[radius]:[inner,radius]):kind==='town'?[radius]:[];
 const ringWidths=rings.map((_,i)=>rings.length>1?(i===rings.length-1?(kind==='national'?1.5:1.4):(kind==='national'?.75:.9)):simplified?1:1.2);
 return {kind,filled,radius:kind==='national'?radius*.23:radius,rings,ringWidths,outerRadius:radius};
}
export function populationRadius(city){
 const bins=[[0,2],[200000,2.6],[500000,3.2],[1000000,3.9],[3000000,4.5],[5000000,5.1],[10000000,5.8]];
 return Number.isFinite(city.population)?bins.findLast(([min])=>city.population>=min)?.[1]||2:2.5;
}
// Shared paint specification for canvas, SVG, legends and exports.
export function markerPaint(city,{night=false,low=false}={}){
 const kind=markerKind(city);return {color:low?'#2868c7':kind==='national'?(night?'#d4a1bd':'#a0527d'):(night?'#d5e2ec':'#435f73'),halo:'#ffffffb3',selection:low?'#2868c7':'#498ba8'};
}
export function markerPrimitives(city,radius,options={}){
 const m=markerShape(city,radius,options),p=markerPaint(city,options),rim=Math.max(.8,Math.min(1.4,radius*.3)),parts=[],dot=m.radius;
 if(options.selected)parts.push({r:m.outerRadius+4,fill:p.selection+'18',stroke:p.selection+'b3',width:1.6});
 if(m.filled)parts.push({r:dot,fill:p.halo,stroke:p.halo,width:rim});
 m.rings.forEach((r,i)=>parts.push({r,fill:'none',stroke:p.halo,width:m.ringWidths[i]+rim}));
 if(m.filled)parts.push({r:dot,fill:p.color,stroke:'none',width:0});
 m.rings.forEach((r,i)=>parts.push({r,fill:'none',stroke:p.color,width:m.ringWidths[i]}));
 return parts;
}
export function drawCitySymbol(ctx,city,x,y,radius,options={}){
 ctx.save();ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
 for(const part of markerPrimitives(city,radius,options)){ctx.beginPath();ctx.arc(x,y,part.r,0,Math.PI*2);if(part.fill!=='none'){ctx.fillStyle=part.fill;ctx.fill();}if(part.stroke!=='none'){ctx.strokeStyle=part.stroke;ctx.lineWidth=part.width;ctx.stroke();}}
 ctx.restore();return markerShape(city,radius,options);
}
const keyCities=[[{capital:true},'国家首都'],[{capital:true,capitalRole:'regional'},'地区首府 / 省会'],[{},'普通城市'],[{settlementType:'town'},'城镇']];
export function markerLegend(){return keyCities.map(([city,label])=>`<span><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">${markerPrimitives(city,5).map(p=>`<circle cx="12" cy="12" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.width}"/>`).join('')}</svg>${label}</span>`).join('')+'<span>外径按人口 · 缩远简化 · 钴蓝表示海侵城市</span>';}
export function drawCityLegend(ctx,x,y,{night=false}={}){
 ctx.save();ctx.font='600 11px "Atlas Serif","Atlas Ming",serif';ctx.textAlign='left';ctx.textBaseline='middle';
 for(const [city,label] of keyCities){drawCitySymbol(ctx,city,x,y,4,{night});ctx.fillStyle=night?'#d4e3ed':'#40596c';ctx.fillText(label.replace(' / 省会',''),x+12,y);x+=95;}ctx.restore();
}
