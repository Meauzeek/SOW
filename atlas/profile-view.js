const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Number(v).toLocaleString('zh-CN',{maximumFractionDigits:1});
export const gdpDisplay=v=>v==null?'—':number(v*10);
export const gdpStored=v=>v===''?null:Number(v)/10;
const population=v=>v==null?'—':number(v/(v>=1e8?1e8:10000))+(v>=1e8?' 亿':' 万');
const stat=(label,value,unit='')=>`<div><small>${label}</small><b>${value}<span>${unit}</span></b></div>`;
const languages={en:'英语',fr:'法语',ru:'俄语',ar:'阿拉伯语',iu:'因纽特语',kl:'格陵兰语',zh:'中文',bo:'藏语',ja:'日语',es:'西语'};
export function nativeMarkup(e){const rows=[{language:e.localLanguage,name:e.localName},...(e.nativeNames||[])].filter(x=>x.name&&x.name!==e.name&&x.name!==e.englishName);return rows.map(x=>`<div class="profile-native"><span>${esc(languages[x.language]||x.language||'本地')}</span><b lang="${esc(x.language)}" dir="auto">${esc(x.name)}</b></div>`).join('');}
export function cleanNarrative(text){return (text||'').split(/(?<=[。！？])/).filter(s=>!/(以用户|未标注国家|待核|预设|未命名地区|原图范围内|不代表|需校|仍可编辑|作品关联城市|无法确认)/.test(s)).join('').trim();}
export function profileMarkup(e,city,{owner='',elevation={},children=[],cities=[],area=0,totals={}}={}){
 const description=cleanNarrative(e.notes),native=nativeMarkup(e);
 return `<header class="profile-header"><div class="profile-kicker">${city?esc(owner):'国家 / 地区'}</div><h2>${esc(e.name)}</h2><p class="profile-english">${esc(e.englishName||e.alias)}</p>${native}${e.fullName&&![e.name,e.englishName,e.localName].includes(e.fullName)?`<p class="profile-full">${esc(e.fullName)}</p>`:''}<div class="profile-toolbar">${!city?'<button id="countryMapBtn">本国地图 ↗</button>':''}<button id="editEntity">编辑档案</button><button id="starEntity" aria-pressed="${!!e.featured}">${e.featured?'✦ 明星':'☆ 标记'}</button></div></header>
 <div id="profileMedia"></div>
 ${e.capital?`<p class="profile-capital">${city?(e.capitalRole==='regional'?'地区首府':'首都 / 中心城市'):'首都 · '+esc(e.capital)}</p>`:''}
 <section class="profile-primary"><div class="detail-stats">${stat('人口',population(e.population),'人')}${stat('GDP',gdpDisplay(e.gdp),'亿美元')}${city?stat('海拔',elevation.z==null?'—':number(elevation.z),'m'):stat('面积',number(area/10000),'万 km²')}${stat('人均 GDP',e.population>0&&e.gdp!=null?number(e.gdp*1e9/e.population):'—','美元')}</div></section>
 ${description?`<p class="profile-description">${esc(description)}</p>`:''}
 ${e.realName?`<p class="profile-prototype">现实原型 · ${esc(e.realName)}</p>`:''}
 <details class="profile-section"><summary>民生与经济</summary><div class="detail-stats">${stat('预期寿命',e.lifeExpectancy??'—','岁')}${stat('识字率',e.literacy??'—','%')}${stat('城镇化率',e.urbanization??'—','%')}</div><button id="editSocio">编辑数据</button></details>
 ${city?`<details class="profile-section"><summary>位置与高程</summary><p>${e.coordinates.map(v=>number(v)+'°').join(' / ')}</p><p class="data-note">${esc(elevation.source)}</p><div class="detail-actions"><button id="moveCity">拖动位置</button><button id="lookupElevation">查询高程</button></div></details>`:`<details class="profile-section" open><summary>城市 · ${cities.length}</summary>${cities.map(c=>`<button class="child-row" data-child="${esc(c.id)}"><span>${c.capital?'◎ ':''}${esc(c.name)}</span><small>${esc(c.englishName)}</small></button>`).join('')}<button id="addCountryCity">＋ 添加城市</button></details><details class="profile-section"><summary>细分地区 · ${children.length}</summary>${children.map(c=>`<button class="child-row" data-child="${esc(c.properties.id)}">${esc(c.properties.name)}</button>`).join('')}<button id="addChild">＋ 添加地区</button></details><details class="profile-section"><summary>已收录城市汇总</summary><div class="detail-stats">${stat('城市人口',population(totals.population),'人')}${stat('城市 GDP',gdpDisplay(totals.gdp),'亿美元')}</div><p>${totals.included||0} 座计入 · ${totals.excluded||0} 座不计入</p></details>`}
 <details class="profile-section profile-manage"><summary>档案管理</summary>${city?'':`<a href="heraldry.html" target="_blank" rel="noopener">旗徽图册 ↗</a><button id="zoomEntity">定位全境</button><button id="editBorder">调整边界</button>`}<button id="deleteEntity">删除${city?'城市':'地区'}</button></details>`;
}
export function floatingMarkup(e,city,owner=''){
 const photo=city?e.media?.photo:e.media?.flag;
 return `<div class="floating-top"><span>地点资料</span><button class="floating-close" id="closeFloating" aria-label="关闭卡片">×</button></div>${photo?`<img class="floating-image ${city?'':'flag-image'}" src="${esc(photo.dataUrl)}" alt="${esc(e.name)}">`:''}<div class="floating-content"><p class="profile-kicker">${esc(city?owner:'国家 / 地区')}</p><h2>${esc(e.name)}</h2><p class="profile-english">${esc(e.englishName||e.alias)}</p>${nativeMarkup(e)}<div class="floating-stats"><span>人口 <b>${population(e.population)}人</b></span><span>GDP <b>${gdpDisplay(e.gdp)} 亿美元</b></span></div>${!city?'<button id="floatingCountryMap">本国地图 ↗</button>':''}<button id="openFullProfile">查看完整资料 ↗</button></div>`;
}
