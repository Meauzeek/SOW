// Pattern spacing is in map display pixels, independent of geographic zoom.
// Exports scale the same artwork at the requested resolution.
const patterns=new WeakMap();
export function drawIceCover(map){
 const ctx=map.ctx,paths=map.icePaths||[];if(!paths.length)return;
 ctx.save();ctx.fillStyle=map.night?'#dce7ecf2':'#f9fbfcf5';for(const {path} of paths)ctx.fill(path);
 const mask=new Path2D();for(const {path} of paths)mask.addPath(path);ctx.clip(mask);
 ctx.setTransform(map.dpr,0,0,map.dpr,0,0);
 let pattern=patterns.get(ctx);if(!pattern){const tile=document.createElement('canvas');tile.width=32;tile.height=28;const p=tile.getContext('2d');p.fillStyle='#7fbad050';for(const [x,y] of [[8,7],[24,21]]){p.beginPath();p.arc(x,y,.85,0,Math.PI*2);p.fill();}pattern=ctx.createPattern(tile,'repeat');patterns.set(ctx,pattern);}
 ctx.fillStyle=pattern;ctx.fillRect(0,0,map.w,map.h);ctx.restore();
 if(map.layers.ice){ctx.save();ctx.strokeStyle='#a5c8d36b';ctx.lineWidth=.5/map.transform.k;for(const {path} of paths)ctx.stroke(path);ctx.restore();}
}
