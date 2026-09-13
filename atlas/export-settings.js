export function imageDimensions(width,height,aspect,currentRatio){
 width=Number(width);height=Number(height);
 const ratios={'16:9':16/9,'3:2':3/2,'4:3':4/3,'1:1':1,'2:3':2/3,'9:16':9/16};
 if(aspect!=='custom')height=Math.round(width/(ratios[aspect]||currentRatio));
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<640||height<320||width>8192||height>8192||width*height>40000000)throw Error('宽度 640–8192、高度 320–8192 像素；总像素不超过 4000 万');
 return {width,height};
}
export function cropLayout(rect,width,height){
 if(!rect||![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)||rect.width<20||rect.height<20)throw Error('请框选更大的地图区域');
 const dpr=Math.min(width/rect.width,height/rect.height),w=width/dpr,h=height/dpr;
 return {dpr,w,h,dx:-rect.x+(w-rect.width)/2,dy:-rect.y+(h-rect.height)/2};
}
