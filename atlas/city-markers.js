// Administrative role chooses the shape; population chooses its scale.
export function markerKind(city){
 if(city.capital)return city.capitalRole==='regional'?'regional':'national';
 return city.settlementType==='town'||city.rank==='town'?'town':'city';
}
export function markerShape(city,radius,{simplified=false}={}){
 const kind=markerKind(city),filled=kind==='national'||kind==='city';
 const gap=Math.max(1.5,Math.min(3,radius*.75));
 const rings=kind==='national'?[radius+gap]:kind==='regional'?(simplified?[radius]:[radius,radius+gap]):kind==='town'?[radius]:[];
 const ringWidths=rings.map((_,i)=>rings.length>1?(i===rings.length-1?1.4:.9):simplified?1:1.2);
 return {kind,filled,radius,rings,ringWidths,outerRadius:rings.at(-1)||radius};
}
export function populationRadius(city){
 const bins=[[0,2],[200000,2.6],[500000,3.2],[1000000,3.9],[3000000,4.5],[5000000,5.1],[10000000,5.8]];
 return Number.isFinite(city.population)?bins.findLast(([min])=>city.population>=min)?.[1]||2:2.5;
}
export function markerLegend(){
 return [['national','国家首都'],['regional','地区首府 / 省会'],['city','普通城市'],['town','城镇']].map(([kind,label])=>{const shape=markerShape({capital:['national','regional'].includes(kind),capitalRole:kind,settlementType:kind},3),color=kind==='national'?'#ce4448':'currentColor';return `<span><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">${shape.filled?`<circle cx="11" cy="11" r="3" fill="${color}" stroke="${kind==='city'?'#ffffffb3':'none'}" stroke-width="1.1"/>`:''}${shape.rings.map((radius,i)=>`<circle cx="11" cy="11" r="${radius}" fill="none" stroke="${color}" stroke-width="${shape.ringWidths[i]}"/>`).join('')}</svg>${label}</span>`;}).join('')+'<span>大小按人口 · 缩远简化 · 钴蓝表示海侵城市</span>';
}
export function drawCityLegend(ctx,x,y,{night=false}={}){
 ctx.save();ctx.font='600 11px "Atlas Serif","Atlas Ming",serif';ctx.textAlign='left';ctx.textBaseline='middle';
 for(const [city,label] of [[{capital:true},'国家首都'],[{capital:true,capitalRole:'regional'},'地区首府'],[{},'城市'],[{settlementType:'town'},'城镇']]){
  const shape=markerShape(city,2.6),color=shape.kind==='national'?'#ce4448':night?'#dbe7f2':'#4f6b80';ctx.fillStyle=color;ctx.strokeStyle=color;
  if(shape.filled){ctx.beginPath();ctx.arc(x,y,2.6,0,Math.PI*2);ctx.fill();if(shape.kind==='city'){ctx.strokeStyle='#ffffffb3';ctx.lineWidth=1;ctx.stroke();ctx.strokeStyle=color;}}
  shape.rings.forEach((r,i)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.lineWidth=shape.ringWidths[i];ctx.stroke();});ctx.fillStyle=night?'#d4e3ed':'#40596c';ctx.fillText(label,x+12,y);x+=90;
 }ctx.restore();
}
