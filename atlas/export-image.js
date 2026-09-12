import {WorldMap} from './map.js';
// Re-render vectors at the requested device scale. Never enlarge a screen capture.
export async function exportMapImage(map,{width=3840,aspect='current',format='png',transparent=false,view=map.view,projection=map.kind,fitWorld=false}={}){
 const ratios={'16:9':16/9,'3:2':3/2,'1:1':1};
 const height=Math.round(width/(ratios[aspect]||map.w/map.h));
 if(!Number.isInteger(width)||width<640||width>8192||width*height>40000000)throw Error('宽度须为 640—8192 像素，总像素不超过 4000 万');
 if(!map.dem&&view!=='reference')throw Error('高程数据尚未载入，请稍后导出');
 await document.fonts.ready;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const render=Object.assign(Object.create(WorldMap.prototype),map,{canvas,ctx:canvas.getContext('2d'),dpr:width/map.w,view,kind:projection,preview:false,selected:null,hovered:null,tool:'select',drawPoints:[],adminSelection:null,terrain:null,cityHandles:[],vertexHandles:[],contextPaths:{...map.contextPaths}});
 if(fitWorld){render.w=1200;render.dpr=width/render.w;}
 render.h=height/render.dpr;
 render.proj=render.makeProjection().scale(map.proj.scale()).translate(map.proj.translate());
 if(render.h!==map.h){const tr=render.proj.translate();render.proj.translate([tr[0],tr[1]+(render.h-map.h)/(2*render.transform.k)]);}
 render.displayFeature=f=>f; // Export retains all available boundary vertices.
 if(fitWorld||projection!==map.kind){render.transform=window.d3.zoomIdentity;render.proj=render.makeProjection();}
 if(transparent&&format==='png')render.drawSpace=()=>{};
 render.rebuild();
 if(view==='standard'&&!render.contextData){render.contextData=await fetch('data/map-context.geojson').then(r=>r.json());render.rebuildContext();}
 if(view==='reference'&&projection!=='robinson')throw Error('原图对照只能导出 Robinson 平面；其他地图均支持地球仪');
 if(map.dem&&view!=='reference'){
  const worker=new Worker('terrain-worker.js');
  try{
   let texture;
   if(view==='nightlights'){
    const image=new Image();image.src='data/nightlights-2016.jpg';await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);texture={width:c.width,height:c.height,buffer:ctx.getImageData(0,0,c.width,c.height).data.buffer};
   }
   await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('高分辨率地形生成超时，请降低分辨率')),120000);
    worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message));};
    worker.onmessage=e=>{const m=e.data;if(m.type==='ready'){
     if(map.customDem)worker.postMessage({type:'custom',dem:map.customDem});
     if(texture)worker.postMessage({type:'night-init',...texture},[texture.buffer]);
     const t=render.transform,pt=render.proj.translate(),scale=render.dpr;
     worker.postMessage({type:'render',id:1,width,height,projection:{kind:projection,rotation:render.rotation,scale:render.proj.scale()*t.k*scale,translate:[(pt[0]*t.k+t.x)*scale,(pt[1]*t.k+t.y)*scale]},transform:{x:t.x,y:t.y,k:t.k,ratio:scale},view,night:!!render.night,mode:render.mode,sea:render.sea,flood:render.layers.flood&&!render.illustratedCoast(),interval:render.interval||500});
    }else if(m.type==='rendered'){
     const c=document.createElement('canvas');c.width=m.width;c.height=m.height;c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(m.buffer),m.width,m.height),0,0);render.terrain={canvas:c,transform:m.transform};clearTimeout(timer);resolve();
    }else if(m.type==='error'){clearTimeout(timer);reject(Error(m.message));}};
    worker.postMessage({type:'init',dem:map.dem});
   });
  }finally{worker.terminate();}
 }
 render.draw();
 if(!transparent||format==='jpeg'){const ctx=render.ctx;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='destination-over';ctx.fillStyle=render.night?'#101b29':'#eef3f7';ctx.fillRect(0,0,width,height);ctx.restore();}
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('图片编码失败')),'image/'+format,.94));
 return {blob,width,height};
}
