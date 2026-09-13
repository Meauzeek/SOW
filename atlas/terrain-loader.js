// Retry interrupted downloads and reject truncated DEM buffers before rendering.
export async function fetchTerrain(url,decode,fetcher=fetch){
 let failure;
 for(let attempt=0;attempt<3;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
  try{const response=await fetcher(url,{signal:controller.signal,...(attempt?{cache:'reload'}:{})});if(!response.ok)throw Error(`HTTP ${response.status}`);return await decode(response);}
  catch(error){failure=error;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));}
  finally{clearTimeout(timer);}
 }
 throw Error('地形数据暂时无法载入，请稍后重新选择地图模式。'+(failure?.name==='AbortError'?'（下载超时）':''));
}
export function validateDemMeta(meta){if(!Number.isInteger(meta.width)||!Number.isInteger(meta.height)||meta.width<2||meta.height<2||meta.width*meta.height>16000000)throw Error('高程网格尺寸无效');return meta;}
export function decodeDemBuffer(buffer,count){if(buffer.byteLength!==count*4)throw Error('高程文件不完整');return new Float32Array(buffer);}
