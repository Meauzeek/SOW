// Screen-space rectangles shared by country, water and city labels.
export const overlaps=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
export function placeCityLabel(point,width,height,used,viewport,gap=9){
 const [x,y]=point,pad=3;
 const candidates=[[x+gap,y-9],[x-gap-width,y-9],[x-width/2,y-gap-height],[x-width/2,y+gap]];
 for(const [left,top] of candidates){const box=[left-pad,top-pad,left+width+pad,top+height+pad];
  if(box[0]<0||box[1]<0||box[2]>viewport[0]||box[3]>viewport[1]||used.some(b=>overlaps(box,b)))continue;
  return {box,x:left,y:top+8};
 }
 return null;
}
// Explicit export selections are never silently discarded. Prefer a nearby free
// position with a leader; the final bounded fallback is reported to the user.
export function placeRequiredLabel(point,width,height,used,viewport,gap=9){
 const direct=placeCityLabel(point,width,height,used,viewport,gap);if(direct)return direct;
 const [w,h]=viewport;
 for(let r=24;r<Math.max(w,h);r+=18)for(let i=0;i<16;i++){
  const a=i*Math.PI/8,left=Math.max(4,Math.min(w-width-4,point[0]+Math.cos(a)*r-width/2)),top=Math.max(4,Math.min(h-height-4,point[1]+Math.sin(a)*r-height/2));
  const box=[left-3,top-3,left+width+3,top+height+3];
  if(box[2]<=w&&box[3]<=h&&!used.some(b=>overlaps(box,b)))return {box,x:left,y:top+8,leader:true};
 }
 const left=Math.max(4,Math.min(w-width-4,point[0]+gap)),top=Math.max(4,Math.min(h-height-4,point[1]-9));
 return {box:[left,top,left+width,top+height],x:left,y:top+8,leader:true,overflow:true};
}
