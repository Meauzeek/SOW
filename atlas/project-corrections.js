// Apply the author's localized corrections once, preserving edits elsewhere.
export function applySouthernCorrection(project,patch,turf){
 if(project.appliedCorrections?.includes(patch.id))return false;
 const ids=new Map(project.territories.map(f=>[f.properties.id,f]));
 if(!ids.has('polar')||!ids.has('australia'))return false;
 const geometries=new Map();
 for(const move of patch.transfers){
  const from={...ids.get(move.from),geometry:geometries.get(move.from)||ids.get(move.from).geometry};
  const to={...ids.get(move.to),geometry:geometries.get(move.to)||ids.get(move.to).geometry};
  const region=turf.feature(move.geometry);
  geometries.set(move.from,turf.difference(turf.featureCollection([from,region]))?.geometry||{type:'MultiPolygon',coordinates:[]});
  geometries.set(move.to,turf.union(turf.featureCollection([to,region])).geometry);
 }
 for(const [id,geometry] of geometries)ids.get(id).geometry=geometry;
 for(const update of patch.cities){const city=project.cities.find(c=>c.id===update.id);if(city)Object.assign(city,update);}
 for(const preset of patch.addCities){const existing=project.cities.find(c=>c.id===preset.id);if(!existing)project.cities.push(structuredClone(preset));}
 project.appliedCorrections=[...(project.appliedCorrections||[]),patch.id];
 return true;
}
