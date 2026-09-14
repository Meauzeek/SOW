(function(root){
 // Visual interpolation only: source heights and ocean-connectivity masks remain untouched.
 const cubic=(a,b,c,d,t)=>b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)));
 function sampleSmooth(d,lon,lat,wrap=false,highQuality=false){
  if(!d||!Number.isFinite(lon)||!Number.isFinite(lat))return null;const b=d.bbox||[-180,-90,180,90];if(lat<b[1]||lat>b[3]||!wrap&&(lon<b[0]||lon>b[2]))return null;
  let x=(lon-b[0])/(b[2]-b[0])*d.width-.5,y=Math.max(0,Math.min(d.height-1,(b[3]-lat)/(b[3]-b[1])*d.height-.5));
  if(wrap)x=((x%d.width)+d.width)%d.width;else x=Math.max(0,Math.min(d.width-1,x));
  const x0=Math.floor(x),x1=wrap?(x0+1)%d.width:Math.min(d.width-1,x0+1),y0=Math.floor(y),y1=Math.min(d.height-1,y0+1),fx=x-x0,fy=y-y0;
  const a=d.values[y0*d.width+x0],c=d.values[y1*d.width+x0],e=d.values[y0*d.width+x1],f=d.values[y1*d.width+x1];if(a!=null&&c!=null&&e!=null&&f!=null&&Number.isFinite(a)&&Number.isFinite(c)&&Number.isFinite(e)&&Number.isFinite(f)){
   if(highQuality){const xm=wrap?(x0+d.width-1)%d.width:Math.max(0,x0-1),xp=wrap?(x0+2)%d.width:Math.min(d.width-1,x0+2),rows=[];let valid=true;for(let j=-1;j<=2;j++){const offset=Math.max(0,Math.min(d.height-1,y0+j))*d.width,A=d.values[offset+xm],B=d.values[offset+x0],C=d.values[offset+x1],D=d.values[offset+xp];if(A==null||B==null||C==null||D==null||!Number.isFinite(A+B+C+D)){valid=false;break;}rows.push(cubic(A,B,C,D,fx));}if(valid)return Math.max(Math.min(a,c,e,f),Math.min(Math.max(a,c,e,f),cubic(...rows,fy)));}
   return (a*(1-fx)+e*fx)*(1-fy)+(c*(1-fx)+f*fx)*fy;
  }
  const ids=[y0*d.width+x0,y0*d.width+x1,y1*d.width+x0,y1*d.width+x1],weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];let sum=0,weight=0;
  for(let i=0;i<4;i++){const z=d.values[ids[i]];if(z!=null&&Number.isFinite(z)){sum+=z*weights[i];weight+=weights[i];}}return weight>0?sum/weight:null;
 }
 const sea=[[-11000,[40,66,112]],[-6000,[47,91,143]],[-3000,[65,130,178]],[-1000,[101,168,202]],[-200,[153,203,224]],[0,[206,232,241]]];
 // Muted atlas progression, with a cartographic snow-white treatment for extreme peaks.
 // Geographic ice cover remains an independent stippled overlay.
 const land=[[0,[141,189,153]],[200,[170,206,154]],[500,[214,223,167]],[1000,[236,228,174]],[1500,[233,212,156]],[2000,[229,191,146]],[2500,[224,172,140]],[3000,[217,155,137]],[4000,[203,137,137]],[4800,[195,139,148]],[5000,[178,160,191]],[6000,[174,159,189]],[6500,[226,225,235]],[7000,[246,248,249]],[8850,[251,252,252]]];
 function color(z){const stops=z<0?sea:land;if(z<=stops[0][0])return stops[0][1];for(let i=1;i<stops.length;i++)if(z<=stops[i][0]){const [a,ca]=stops[i-1],[b,cb]=stops[i],t=(z-a)/(b-a);return ca.map((v,j)=>Math.round(v+(cb[j]-v)*t));}return stops.at(-1)[1];}
 const api={sampleSmooth,color,sea,land};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.AtlasTerrainStyle=api;
})(typeof self!=='undefined'?self:globalThis);
