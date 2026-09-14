importScripts('vendor/d3.min.js','vendor/d3-geo-projection.min.js','core.js','terrain-style.js');
let nightTexture=null,dem,custom=null,floodCache=new Map();
const C=AtlasCore;
function projection(c){let p;if(c.kind==='national')p=d3.geoAzimuthalEqualArea().rotate(c.rotation).clipAngle(179.9);else if(c.kind==='globe')p=d3.geoOrthographic().rotate(c.rotation).clipAngle(90);else if(c.kind==='north'||c.kind==='south')p=d3.geoStereographic().rotate([0,c.kind==='north'?-90:90]).clipAngle(90);else if(c.kind==='equirectangular')p=d3.geoEquirectangular().rotate([-11,0]);else p=d3.geoRobinson().rotate([-11,0]);return p.scale(c.scale).translate(c.translate);}
function grid(mode){return {...dem,values:dem[mode]};}
function oceanSeeds(d){return [[-160,0],[-30,0],[80,-30],[0,-60],[0,85]].map(([lon,lat])=>Math.floor((90-lat)/180*d.height)*d.width+Math.floor((lon+180)/360*d.width));}
function flood(mode,sea){const id=mode+':'+sea;if(!floodCache.has(id)){if(floodCache.size>4)floodCache.delete(floodCache.keys().next().value);const d=grid(mode);floodCache.set(id,C.connectedFlood(d.values,d.width,d.height,sea,oceanSeeds(d)));}return floodCache.get(id);}
const T=AtlasTerrainStyle,COLORS=new Uint8ClampedArray(21001*3);for(let z=-12000;z<=9000;z++)COLORS.set(T.color(z),(z+12000)*3);
onmessage=e=>{const m=e.data;if(m.type==='night-init'){nightTexture={width:m.width,height:m.height,data:new Uint8ClampedArray(m.buffer)};postMessage({type:'night-ready'});return;}if(m.type==='init'){dem=m.dem;floodCache.clear();postMessage({type:'ready'});return;}if(m.type==='custom'){custom=m.dem;return;}if(m.type!=='render'||!dem)return;
 try{
  const p=projection(m.projection),w=m.width,h=m.height,buf=new Uint8ClampedArray(w*h*4),d=grid(m.mode),mask=m.view==='nightlights'?null:flood(m.mode,m.sea),base=m.view==='nightlights'?null:flood(m.mode,0),heights=new Float32Array(w*h);heights.fill(NaN);const cubic=m.projection.scale*Math.PI/180*360/d.width>2;
  let customMask=null,customBase=null;
  if(custom&&m.view!=='nightlights'){const seeds=[];for(let y=0;y<custom.height;y++)for(let x=0;x<custom.width;x++){if(x!==0&&y!==0&&x!==custom.width-1&&y!==custom.height-1)continue;const lon=custom.bbox[0]+(x+.5)/custom.width*(custom.bbox[2]-custom.bbox[0]),lat=custom.bbox[3]-(y+.5)/custom.height*(custom.bbox[3]-custom.bbox[1]);const ix=Math.min(d.width-1,Math.floor((lon+180)/360*d.width)),iy=Math.min(d.height-1,Math.floor((90-lat)/180*d.height));if(base[iy*d.width+ix])seeds.push(y*custom.width+x);}
   customMask=C.connectedFlood(custom.values,custom.width,custom.height,m.sea,seeds,false);customBase=C.connectedFlood(custom.values,custom.width,custom.height,0,seeds,false);
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const lonlat=p.invert([x+.5,y+.5]);if(!lonlat||!lonlat.every(Number.isFinite)||Math.abs(lonlat[1])>90)continue;
   const back=p(lonlat);if(!back||Math.hypot(back[0]-x-.5,back[1]-y-.5)>2)continue;
   if(m.projection.kind==='north'&&lonlat[1]<0||m.projection.kind==='south'&&lonlat[1]>0)continue;
   if(m.view==='nightlights'){const k=(y*w+x)*4;if(nightTexture){const tex=nightTexture,tx=Math.max(0,Math.min(tex.width-1,(lonlat[0]+180)/360*tex.width-.5)),ty=Math.max(0,Math.min(tex.height-1,(90-lonlat[1])/180*tex.height-.5)),x0=Math.floor(tx),y0=Math.floor(ty),x1=Math.min(tex.width-1,x0+1),y1=Math.min(tex.height-1,y0+1),fx=tx-x0,fy=ty-y0;for(let c=0;c<3;c++){const a=tex.data[(y0*tex.width+x0)*4+c]*(1-fx)+tex.data[(y0*tex.width+x1)*4+c]*fx,b=tex.data[(y1*tex.width+x0)*4+c]*(1-fx)+tex.data[(y1*tex.width+x1)*4+c]*fx;buf[k+c]=a*(1-fy)+b*fy;}buf[k+3]=255;}else buf.set([3,8,15,255],k);continue;}
   let ix=Math.min(d.width-1,Math.max(0,Math.floor((lonlat[0]+180)/360*d.width))),iy=Math.min(d.height-1,Math.max(0,Math.floor((90-lonlat[1])/180*d.height))),i=iy*d.width+ix,z=T.sampleSmooth(d,...lonlat,true,cubic),wet=mask[i],was=base[i];
   const cz=T.sampleSmooth(custom,...lonlat,false,cubic);if(cz!==null){z=cz;const cx=Math.min(custom.width-1,Math.floor((lonlat[0]-custom.bbox[0])/(custom.bbox[2]-custom.bbox[0])*custom.width)),cy=Math.min(custom.height-1,Math.floor((custom.bbox[3]-lonlat[1])/(custom.bbox[3]-custom.bbox[1])*custom.height));wet=customMask[cy*custom.width+cx];was=customBase[cy*custom.width+cx];}
   if(!Number.isFinite(z))continue;const j=y*w+x,k=j*4;heights[j]=z;
   if(m.view==='political'||m.view==='standard'||m.view==='reference'){if(m.flood&&wet&&!was&&m.sea>0){buf.set([20,151,174,190],k);}continue;}
   if(m.view==='contours')buf.set(m.night?(z<0?[23,44,59,255]:[47,50,46,255]):(z<0?[210,231,241,255]:[247,246,234,255]),k);else{const ci=Math.max(0,Math.min(21000,Math.round(z)+12000))*3;buf[k]=COLORS[ci];buf[k+1]=COLORS[ci+1];buf[k+2]=COLORS[ci+2];buf[k+3]=255;}
   if(m.flood&&wet&&!was&&m.sea>0)buf.set([48,158,172,255],k);
  }
  if(m.view==='terrain'){const ground=6371008.8/m.projection.scale;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=y*w+x,z=heights[j];if(!Number.isFinite(z))continue;const at=i=>Number.isFinite(heights[i])?heights[i]:z,west=x>0?at(j-1):z,east=x<w-1?at(j+1):z,north=y>0?at(j-w):z,south=y<h-1?at(j+w):z;const shade=Math.max(.84,Math.min(1.08,1+(west-east+south-north)/(ground*.8+100)))*(m.night?.65:1),k=j*4;for(let c=0;c<3;c++)buf[k+c]*=shade;}}
  if(m.view==='contours'){const step=m.interval||500;for(let y=1;y<h;y++)for(let x=1;x<w;x++){const j=y*w+x,z=heights[j];if(!Number.isFinite(z))continue;const b=Math.floor(z/step);if(Number.isFinite(heights[j-1])&&b!==Math.floor(heights[j-1]/step)||Number.isFinite(heights[j-w])&&b!==Math.floor(heights[j-w]/step)){const k=j*4;buf.set(z>=0?[150,132,96,255]:[140,172,169,255],k);}}}
  postMessage({type:'rendered',id:m.id,width:w,height:h,buffer:buf.buffer,transform:m.transform},[buf.buffer]);
 }catch(err){postMessage({type:'error',id:m.id,message:err.message});}
};

