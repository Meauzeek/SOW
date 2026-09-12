importScripts('vendor/d3.min.js','vendor/d3-geo-projection.min.js','core.js');
let nightTexture=null,dem,custom=null,floodCache=new Map();
const C=AtlasCore;
function projection(c){let p;if(c.kind==='globe')p=d3.geoOrthographic().rotate(c.rotation).clipAngle(90);else if(c.kind==='north'||c.kind==='south')p=d3.geoStereographic().rotate([0,c.kind==='north'?-90:90]).clipAngle(90);else if(c.kind==='equirectangular')p=d3.geoEquirectangular().rotate([-11,0]);else p=d3.geoRobinson().rotate([-11,0]);return p.scale(c.scale).translate(c.translate);}
function grid(mode){return {...dem,values:dem[mode]};}
function oceanSeeds(d){return [[-160,0],[-30,0],[80,-30],[0,-60],[0,85]].map(([lon,lat])=>Math.floor((90-lat)/180*d.height)*d.width+Math.floor((lon+180)/360*d.width));}
function flood(mode,sea){const id=mode+':'+sea;if(!floodCache.has(id)){if(floodCache.size>4)floodCache.delete(floodCache.keys().next().value);const d=grid(mode);floodCache.set(id,C.connectedFlood(d.values,d.width,d.height,sea,oceanSeeds(d)));}return floodCache.get(id);}
function color(z){if(z<-6000)return [106,148,159];if(z<-3000)return [128,165,174];if(z<-1000)return [155,190,194];if(z<0)return [183,207,207];if(z<200)return [177,194,153];if(z<500)return [198,207,164];if(z<1000)return [218,214,173];if(z<2000)return [221,199,157];if(z<3000)return [198,169,140];if(z<4500)return [174,157,147];return [232,228,219];}
onmessage=e=>{const m=e.data;if(m.type==='night-init'){nightTexture={width:m.width,height:m.height,data:new Uint8ClampedArray(m.buffer)};postMessage({type:'night-ready'});return;}if(m.type==='init'){dem=m.dem;postMessage({type:'ready'});return;}if(m.type==='custom'){custom=m.dem;return;}if(m.type!=='render'||!dem)return;
 try{
  const p=projection(m.projection),w=m.width,h=m.height,buf=new Uint8ClampedArray(w*h*4),d=grid(m.mode),mask=m.view==='nightlights'?null:flood(m.mode,m.sea),base=m.view==='nightlights'?null:flood(m.mode,0),heights=new Float32Array(w*h);heights.fill(NaN);
  let customMask=null,customBase=null;
  if(custom&&m.view!=='nightlights'){const seeds=[];for(let y=0;y<custom.height;y++)for(let x=0;x<custom.width;x++){if(x!==0&&y!==0&&x!==custom.width-1&&y!==custom.height-1)continue;const lon=custom.bbox[0]+(x+.5)/custom.width*(custom.bbox[2]-custom.bbox[0]),lat=custom.bbox[3]-(y+.5)/custom.height*(custom.bbox[3]-custom.bbox[1]);const ix=Math.min(d.width-1,Math.floor((lon+180)/360*d.width)),iy=Math.min(d.height-1,Math.floor((90-lat)/180*d.height));if(base[iy*d.width+ix])seeds.push(y*custom.width+x);}
   customMask=C.connectedFlood(custom.values,custom.width,custom.height,m.sea,seeds,false);customBase=C.connectedFlood(custom.values,custom.width,custom.height,0,seeds,false);
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const lonlat=p.invert([x+.5,y+.5]);if(!lonlat||!lonlat.every(Number.isFinite)||Math.abs(lonlat[1])>90)continue;
   const back=p(lonlat);if(!back||Math.hypot(back[0]-x-.5,back[1]-y-.5)>2)continue;
   if(m.projection.kind==='north'&&lonlat[1]<0||m.projection.kind==='south'&&lonlat[1]>0)continue;
   if(m.view==='nightlights'){const k=(y*w+x)*4;if(nightTexture){const tex=nightTexture,tx=Math.max(0,Math.min(tex.width-1,(lonlat[0]+180)/360*tex.width-.5)),ty=Math.max(0,Math.min(tex.height-1,(90-lonlat[1])/180*tex.height-.5)),x0=Math.floor(tx),y0=Math.floor(ty),x1=Math.min(tex.width-1,x0+1),y1=Math.min(tex.height-1,y0+1),fx=tx-x0,fy=ty-y0;for(let c=0;c<3;c++){const a=tex.data[(y0*tex.width+x0)*4+c]*(1-fx)+tex.data[(y0*tex.width+x1)*4+c]*fx,b=tex.data[(y1*tex.width+x0)*4+c]*(1-fx)+tex.data[(y1*tex.width+x1)*4+c]*fx;buf[k+c]=a*(1-fy)+b*fy;}buf[k+3]=255;}else buf.set([3,8,15,255],k);continue;}
   let ix=Math.min(d.width-1,Math.max(0,Math.floor((lonlat[0]+180)/360*d.width))),iy=Math.min(d.height-1,Math.max(0,Math.floor((90-lonlat[1])/180*d.height))),i=iy*d.width+ix,z=d.values[i],wet=mask[i],was=base[i];
   const cz=C.sampleDem(custom,...lonlat);if(cz!==null){z=cz;const cx=Math.min(custom.width-1,Math.floor((lonlat[0]-custom.bbox[0])/(custom.bbox[2]-custom.bbox[0])*custom.width)),cy=Math.min(custom.height-1,Math.floor((custom.bbox[3]-lonlat[1])/(custom.bbox[3]-custom.bbox[1])*custom.height));wet=customMask[cy*custom.width+cx];was=customBase[cy*custom.width+cx];}
   if(!Number.isFinite(z))continue;const j=y*w+x,k=j*4;heights[j]=z;
   if(m.view==='political'||m.view==='standard'||m.view==='reference'){if(m.flood&&wet&&!was&&m.sea>0){buf.set([20,151,174,190],k);}continue;}
   let rgb=color(z),shade=1;
   if(m.view==='contours')rgb=z<0?[223,234,232]:[243,240,220];
   else {const west=d.values[i-1]||z,east=d.values[i+1]||z,north=d.values[i-d.width]||z,south=d.values[i+d.width]||z;shade=Math.max(.77,Math.min(1.13,1+(west-east+south-north)/4500));}
   for(let c=0;c<3;c++)buf[k+c]=Math.min(255,Math.round(rgb[c]*shade*(m.night?.60:1)));buf[k+3]=255;
   if(m.flood&&wet&&!was&&m.sea>0)buf.set([48,158,172,255],k);
  }
  if(m.view==='contours'){const step=m.interval||500;for(let y=1;y<h;y++)for(let x=1;x<w;x++){const j=y*w+x,z=heights[j];if(!Number.isFinite(z))continue;const b=Math.floor(z/step);if(Number.isFinite(heights[j-1])&&b!==Math.floor(heights[j-1]/step)||Number.isFinite(heights[j-w])&&b!==Math.floor(heights[j-w]/step)){const k=j*4;buf.set(z>=0?[150,132,96,255]:[140,172,169,255],k);}}}
  postMessage({type:'rendered',id:m.id,width:w,height:h,buffer:buf.buffer,transform:m.transform},[buf.buffer]);
 }catch(err){postMessage({type:'error',message:err.message});}
};
