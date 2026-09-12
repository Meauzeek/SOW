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
