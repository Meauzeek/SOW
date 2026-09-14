import './terrain-style.js';
const T=globalThis.AtlasTerrainStyle;
const scales=[{label:'海深 m',values:[0,-200,-1000,-3000,-6000,-11000],colors:[...T.sea].reverse()},{label:'高程 m',values:[0,1000,2000,3000,5000,6500,8850],colors:T.land}];
const rgb=c=>`rgb(${c.join(',')})`;
function stops(s){const first=s.colors[0][0],last=s.colors.at(-1)[0];return s.colors.map(([z,c])=>[Math.abs((z-first)/(last-first)),rgb(c)]);}
export function terrainLegendHtml(){return scales.map(s=>`<span style="display:inline-flex;flex-direction:column;gap:3px;min-width:155px"><span>${s.label} · ${s.values.map(Math.abs).join(' / ')}</span><span style="height:7px;background:linear-gradient(90deg,${stops(s).map(([p,c])=>`${c} ${p*100}%`).join(',')})"></span></span>`).join(' ')+' <span>白色：极高山 · 冰蓝点纹：冰川 / 冰盖</span>';}
export function drawTerrainLegend(ctx,x,y,width=380,{night=false}={}){
 ctx.save();ctx.font='600 11px "Atlas Serif","Atlas Ming",serif';ctx.textBaseline='top';ctx.textAlign='left';ctx.letterSpacing='0px';
 ctx.fillStyle=night?'#142638ed':'#edf4f8ed';ctx.fillRect(x-9,y-7,width+18,83);
 scales.forEach((s,i)=>{const row=y+i*31,g=ctx.createLinearGradient(x,row,x+width,row);for(const [p,c] of stops(s))g.addColorStop(p,c);ctx.fillStyle=g;ctx.fillRect(x,row,width,7);ctx.fillStyle=night?'#dce6ee':'#344c60';ctx.fillText(`${s.label}  ${s.values.map(Math.abs).join(' / ')}`,x,row+10);});
 ctx.fillStyle=night?'#dce6ee':'#344c60';ctx.fillText('白色：极高山 · 冰蓝点纹：冰川 / 冰盖',x,y+63);ctx.restore();
}
