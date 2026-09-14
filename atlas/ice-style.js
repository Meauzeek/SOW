// Pattern spacing is in map display pixels, independent of geographic zoom.
// Exports scale the same artwork at the requested resolution.
const patterns=new WeakMap();
function paintIceCover(map){
 const ctx=map.ctx,paths=map.icePaths||[];if(!paths.length)return;
 ctx.save();ctx.fillStyle=map.night?'#dce7ecf2':'#f9fbfcf5';for(const {path} of paths)ctx.fill(path);
 const mask=new Path2D();for(const {path} of paths)mask.addPath(path);ctx.clip(mask);
 ctx.setTransform(map.dpr,0,0,map.dpr,0,0);
 let pattern=patterns.get(ctx);if(!pattern){const tile=document.createElement('canvas');tile.width=32;tile.height=28;const p=tile.getContext('2d');p.fillStyle='#7fbad050';for(const [x,y] of [[8,7],[24,21]]){p.beginPath();p.arc(x,y,.85,0,Math.PI*2);p.fill();}pattern=ctx.createPattern(tile,'repeat');patterns.set(ctx,pattern);}
 ctx.fillStyle=pattern;ctx.fillRect(0,0,map.w,map.h);ctx.restore();
 if(map.layers.ice){ctx.save();ctx.strokeStyle='#a5c8d36b';ctx.lineWidth=.5/map.transform.k;for(const {path} of paths)ctx.stroke(path);ctx.restore();}
}

const overlays=new WeakMap();
export function drawIceCover(map){
 if(!map.icePaths?.length)return;const ctx=map.ctx,t=map.transform;
 const key=[map.w,map.h,map.dpr,map.night,!!map.layers.ice,map.iceRevision||0].join(':');let cached=overlays.get(ctx);
 if(!cached||cached.key!==key||cached.paths!==map.icePaths){
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(map.w*map.dpr);canvas.height=Math.ceil(map.h*map.dpr);const target=canvas.getContext('2d');target.setTransform(map.dpr*t.k,0,0,map.dpr*t.k,map.dpr*t.x,map.dpr*t.y);paintIceCover({...map,ctx:target});cached={key,paths:map.icePaths,canvas,t:{...t}};overlays.set(ctx,cached);
 }
 const rel=t.k/cached.t.k;ctx.save();ctx.setTransform(map.dpr,0,0,map.dpr,0,0);ctx.translate(t.x-cached.t.x*rel,t.y-cached.t.y*rel);ctx.scale(rel,rel);ctx.drawImage(cached.canvas,0,0,cached.canvas.width/map.dpr,cached.canvas.height/map.dpr);ctx.restore();
}
