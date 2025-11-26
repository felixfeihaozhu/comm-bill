import { db, auth, ref, set, onValue, get, signInAnonymously, onAuthStateChanged } from "./firebase-config.js";

// --- 1. JSON BACKUP DATA ---
const BACKUP_DATA = {
  clients: [
    { tradeName: "环球之旅", company: "DYNASTY TICKETING Kft.", taxId: "26542003242", address: "Csepreghy utca 4. 2. em. 13. ajtó Budapest, Budapest főváros, 1085 Hungary", rate: 5, addonRate: 5 },
    { tradeName: "蓝天旅行社", company: "VIAJES ANDY, S.L.", taxId: "B86105301", address: "Avenida Oporto, 108, 28019 Madrid", rate: 15, addonRate: 0 },
    { tradeName: "长城旅行社", company: "VIAJES GRAN MURALLA, S.L.", taxId: "B85644490", address: "Calle Nicolas Sanchez, 41, 28026 Madrid", rate: 15, addonRate: 0 },
    { tradeName: "中天旅行社", company: "VIAJES DESPEJADO, S.L.", taxId: "B84988948", address: "Calle Nicolas Sanchez, 6, 28026 Madrid", rate: 15, addonRate: 0 },
    { tradeName: "环球旅行社", company: "GRAN ASIA TOUR, S.L.", taxId: "B84962927", address: "Calle Dolores Barranco, 49, 28026 Madrid", rate: 10, addonRate: 3 },
    { tradeName: "凯越旅行社", company: "FREEMAN TRAVEL CO, S.L.", taxId: "B56487168", address: "Calle de Gabino Jimeno, 15, 28026 Madrid", rate: 10, addonRate: 3 }
  ],
  ships: [
    "━━━ MSC CRUISES ━━━", "MSC 欧罗巴号 MSC World Europa", "MSC 美洲号 MSC World America", "MSC 欧瑞比亚号 MSC Euribia", "MSC 华彩号 MSC Virtuosa", "MSC 鸿图号 MSC Grandiosa", "MSC 荣耀号 MSC Bellissima", "MSC 传奇号 MSC Meraviglia", "MSC 海神号 MSC Seascape", "MSC 海际号 MSC Seashore", "MSC 海景号 MSC Seaview", "MSC 海岸线号 MSC Seaside", "MSC 珍爱号 MSC Preziosa", "MSC 神曲号 MSC Divina", "MSC 辉煌号 MSC Splendida", "MSC 幻想曲号 MSC Fantasia", "MSC 华丽号 MSC Magnifica", "MSC 诗歌号 MSC Poesia", "MSC 管乐号 MSC Orchestra", "MSC 音乐号 MSC Musica", "MSC 歌剧号 MSC Opera", "MSC 抒情号 MSC Lirica", "MSC 序曲号 MSC Sinfonia", "MSC 和谐号 MSC Armonia",
    "━━━ COSTA CRUISES ━━━", "歌诗达·托斯卡纳号 Costa Toscana", "歌诗达·翡翠号 Costa Smeralda", "歌诗达·皇冠号 Costa Diadema", "歌诗达·迷人号 Costa Fascinosa", "歌诗达·唯美号 Costa Favolosa", "歌诗达·狄利摩萨号 Costa Deliziosa", "歌诗达·太平洋号 Costa Pacifica", "歌诗达·赛琳娜号 Costa Serena", "歌诗达·幸运号 Costa Fortuna"
  ],
  routes: [
    "地中海航线 (The Mediterranean)", "北欧航线 (Northern Europe)", "加勒比海与北美航线 (Caribbean & North America)", "中东航线 (Middle East)", "南美航线 (South America)", "长航线与环球 (Grand Voyages & World Cruise)"
  ],
  dbTypes: ["Interior (内舱)", "Oceanview (海景)", "Balcony (阳台)"],
  dbExps: ["Bella (美妙级)", "Fantastica (梦幻)"],
  dbPrices: ["Basic (基础)", "Special (特价)"],
  dbAddons: ["Wifi Package (网络包)", "Shore Excursion (岸上观光)", "Drink Package (酒水)", "Service Charge (服务费)", "Transfer (接送)"]
};

// Status Indicator
const syncDot = document.querySelector('.dot');
const syncText = document.getElementById('sync-text');

function setStatus(status, text) {
    syncDot.className = 'dot ' + status;
    syncText.textContent = text;
}

// --- Data Variables ---
window.items = []; window.clients = []; window.ships = []; window.routes = [];
window.dbTypes = []; window.dbExps = []; window.dbPrices = []; window.dbAddons = [];

const DEFAULT_PAYMENT = "Bank: CAIXABANK\nName: FH GLOBAL, S.L.\nSWIFT: CAIXESBBXXX\nAccount: ES4521003304042200150167";
const DEFAULT_REMARKS = "请在账单生成后24个小时内付款。\nPlease settle the payment within 24 hours";
const defaultItem = { name: "", ref: "", type: "", exp: "", price: "", qty: "", base: "", tax: "", hsc: "", rate: "", extra: "", addons: [] };

// --- Helpers ---
window.formatMoney = (amount) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);

window.checkClear = function(input) {
    const box = input.closest('.input-box');
    if (input.value && input.value.trim() !== '') box.classList.add('has-val');
    else box.classList.remove('has-val');
    if(input.id !== 'ship' && input.id !== 'route') window.updateState();
}

window.clearField = function(span) {
    const box = span.closest('.input-box');
    const input = box.querySelector('input, textarea');
    input.value = '';
    box.classList.remove('has-val');
    input.focus();
    const evt = new Event('input', { bubbles: true });
    input.dispatchEvent(evt);
    if(input.id === 'ship') window.autoSaveShip(input);
    if(input.id === 'route') window.autoSaveRoute(input);
    if(input.id === 'sailingStart' || input.id === 'sailingEnd') window.updateState();
}

window.toggleClientDetails = function() {
  const wrapper = document.getElementById('client-details-wrapper');
  wrapper.style.display = (wrapper.style.display === 'none' || wrapper.style.display === '') ? 'block' : 'none';
}

window.togglePayment = function() {
  const wrapper = document.getElementById('payment-wrapper');
  wrapper.style.display = (wrapper.style.display === 'none' || wrapper.style.display === '') ? 'block' : 'none';
}

window.openPicker = function(pickerId) { try { document.getElementById(pickerId).showPicker(); } catch(e) { document.getElementById(pickerId).focus(); } }
window.pickDate = function(picker, textId) {
  const val = picker.value; 
  if(val) {
      const [y, m, d] = val.split('-');
      const textInput = document.getElementById(textId);
      textInput.value = `${d}/${m}/${y}`;
      window.updateState();
      window.checkClear(textInput);
  }
}

// --- DB Operations ---
window.editShip = function() { editDatabaseItem('ship', window.ships, 'settings/ships', 'shipList'); }
window.editRoute = function() { editDatabaseItem('route', window.routes, 'settings/routes', 'routeList'); }

function editDatabaseItem(inputId, dbArray, dbPath, listId) {
    const input = document.getElementById(inputId);
    const oldVal = input.value;
    if (!oldVal) return;
    const idx = dbArray.findIndex(item => item.toLowerCase() === oldVal.toLowerCase());
    if (idx === -1) { alert("未找到该项 (Entry not found in DB)"); return; }
    const newVal = prompt("编辑名称 Edit Name:", dbArray[idx]);
    if (newVal && newVal.trim() !== "" && newVal !== dbArray[idx]) {
        dbArray[idx] = newVal.trim();
        set(ref(db, dbPath), dbArray); 
        input.value = newVal.trim();
        const msgId = inputId === 'ship' ? 'msg-ship' : 'msg-route';
        const msgEl = document.getElementById(msgId);
        if(msgEl) { msgEl.textContent = "✅ 已更新 Updated"; msgEl.className = "status-msg status-saved"; }
        window.updateState();
    }
}

window.autoSaveShip = function(input) { handleAutoSave(input, window.ships, 'settings/ships', 'shipList', 'msg-ship'); }
window.autoSaveRoute = function(input) { handleAutoSave(input, window.routes, 'settings/routes', 'routeList', 'msg-route'); }

function handleAutoSave(input, dbArray, dbPath, listId, msgId) {
    const val = input.value.trim();
    const msgEl = document.getElementById(msgId);
    if (!val) { msgEl.textContent = ''; return; }
    const exists = dbArray.some(item => item.toLowerCase() === val.toLowerCase());
    if (exists) {
        msgEl.textContent = "✅ 已存在 Existing"; msgEl.className = "status-msg status-exist";
    } else {
        dbArray.push(val); 
        set(ref(db, dbPath), dbArray); 
        msgEl.textContent = "💾 已保存 Saved"; msgEl.className = "status-msg status-saved";
    }
    window.updateState();
}

window.handleSmartKey = function(e, input) { if(e.key === 'Enter') input.blur(); }
window.smartComplete = function(input, db, index, key) {
  const val = input.value.trim().toLowerCase(); if(!val) { window.updateItem(index, key, ""); return; }
  const match = db.find(item => { const lower = item.toLowerCase(); return lower.startsWith(val) || lower.includes(" " + val) || lower.includes("(" + val); });
  if(match) { input.value = match; window.updateItem(index, key, match); } else window.updateItem(index, key, input.value);
  window.checkClear(input);
}

window.autoSaveItemDB = function(input, dbArray, dbPath, listId) {
  const val = input.value.trim();
  if(!val) return;
  const exists = dbArray.some(item => item.toLowerCase() === val.toLowerCase());
  if(!exists) {
      dbArray.push(val);
      set(ref(db, dbPath), dbArray);
  }
}

window.editItemDb = function(index, field, dbArray, dbPath, listId) {
    const oldVal = window.items[index][field];
    if(!oldVal) return;
    const dbIdx = dbArray.findIndex(item => item.toLowerCase() === oldVal.toLowerCase());
    const newVal = prompt("编辑/修改 Edit " + field + ":", oldVal);
    if(newVal && newVal.trim() !== "") {
        if(dbIdx !== -1) {
            dbArray[dbIdx] = newVal.trim();
            set(ref(db, dbPath), dbArray);
        }
        window.items[index][field] = newVal.trim();
        window.renderItemInputs(); 
        window.updateState();
    }
}

window.editAddonDb = function(itemIndex, addonIndex, dbArray, dbPath, listId) {
    const oldVal = window.items[itemIndex].addons[addonIndex].desc;
    if(!oldVal) return;
    const dbIdx = dbArray.findIndex(item => item.toLowerCase() === oldVal.toLowerCase());
    const newVal = prompt("编辑/修改 Edit Add-on Name:", oldVal);
    if(newVal && newVal.trim() !== "") {
        if(dbIdx !== -1) {
            dbArray[dbIdx] = newVal.trim();
            set(ref(db, dbPath), dbArray);
        }
        window.items[itemIndex].addons[addonIndex].desc = newVal.trim();
        window.renderItemInputs(); 
        window.updateState();
    }
}

window.smartCompleteAddon = function(input, rowIndex, addonIndex) {
  const val = input.value.trim().toLowerCase(); const dbList = window.dbAddons;
  if(!val) { window.items[rowIndex].addons[addonIndex].desc = ""; window.updateState(); return; }
  const match = dbList.find(item => { const lower = item.toLowerCase(); return lower.startsWith(val) || lower.includes(" " + val) || lower.includes("(" + val); });
  if(match) input.value = match; window.items[rowIndex].addons[addonIndex].desc = input.value; window.updateState();
  window.checkClear(input);
}

window.handleDateKey = function(e, input) { if(e.key === 'Enter') input.blur(); }
window.smartDateInput = function(input) {
  const val = input.value.trim(); if(!val) { window.updateState(); return; }
  const now = new Date(); let d, m, y;
  const parts = val.replace(/[.-]/g, '/').split('/');
  if(parts.length === 1) { d=parseInt(parts[0]); m=now.getMonth()+1; y=now.getFullYear(); }
  else if(parts.length === 2) { d=parseInt(parts[0]); m=parseInt(parts[1]); y=now.getFullYear(); }
  else if(parts.length === 3) { d=parseInt(parts[0]); m=parseInt(parts[1]); y=parseInt(parts[2]); if(y<100) y+=2000; }
  else return;
  if(isNaN(d)||isNaN(m)||isNaN(y)) return;
  input.value = `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  window.checkClear(input);
  window.updateState();
}
window.parseDateStr = function(str) { if(!str) return null; const parts = str.split('/'); if(parts.length !== 3) return null; return new Date(parts[2], parts[1]-1, parts[0]); }

window.printBill = function() {
    const invNo = document.getElementById('invNo').value.trim();
    const oldTitle = document.title;
    if (invNo) { document.title = `邮轮账单 ${invNo}`; } else { document.title = `邮轮账单`; }
    window.print();
    setTimeout(() => { document.title = oldTitle; }, 500);
}

window.exportData = function() {
  const saveData = { 
      clients: window.clients, ships: window.ships, routes: window.routes, 
      dbTypes: window.dbTypes, dbExps: window.dbExps, dbPrices: window.dbPrices, dbAddons: window.dbAddons, 
      currentBill: { items: window.items, fields: getFieldsData() } 
  };
  const blob = new Blob([JSON.stringify(saveData,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`FH_Global_CloudBackup_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
}

window.importData = function(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader(); reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if(confirm("恢复数据将覆盖云端数据，是否继续？\nRestore will overwrite Cloud Data. Continue?")) {
          if(data.clients) set(ref(db, 'settings/clients'), data.clients);
          if(data.ships) set(ref(db, 'settings/ships'), data.ships);
          if(data.routes) set(ref(db, 'settings/routes'), data.routes);
          if(data.dbTypes) set(ref(db, 'settings/types'), data.dbTypes);
          if(data.dbExps) set(ref(db, 'settings/exps'), data.dbExps);
          if(data.dbPrices) set(ref(db, 'settings/prices'), data.dbPrices);
          if(data.dbAddons) set(ref(db, 'settings/addons'), data.dbAddons);
          if(data.currentBill) set(ref(db, 'draft'), data.currentBill);
          alert("✅ 恢复成功 Restored to Cloud!");
      }
    } catch(err) { alert("❌ 错误 Error"); }
  }; reader.readAsText(file); input.value='';
}

// --- Rendering ---
function renderAllDatalists() {
  renderDatalist('shipList', window.ships); renderDatalist('routeList', window.routes);
  renderDatalist('dl-types', window.dbTypes); renderDatalist('dl-exps', window.dbExps); 
  renderDatalist('dl-prices', window.dbPrices); renderDatalist('dl-addons', window.dbAddons);
}
function renderDatalist(id, arr) { 
    const dl = document.getElementById(id); dl.innerHTML=''; 
    (arr||[]).forEach(val => { const opt=document.createElement('option'); opt.value=val; dl.appendChild(opt); }); 
}

function renderClientSelect() {
  const sel=document.getElementById('clientSelect'); sel.innerHTML='<option value="">-- 选择常用客户 Select Client --</option>';
  (window.clients||[]).forEach((c,i)=>{ const label=c.tradeName?`${c.tradeName} (${c.company})`:c.company; const opt=document.createElement('option'); opt.value=i; opt.text=label; sel.appendChild(opt); });
}
window.saveClient = function() {
  const company=document.getElementById('billCompany').value.trim(); if(!company) return alert("Missing Company Name");
  const newClient={ tradeName:document.getElementById('billTradeName').value, company, address:document.getElementById('billAddress').value, rate:document.getElementById('billDefaultRate').value||0, addonRate:document.getElementById('billAddonRate').value||0, taxId:document.getElementById('billTaxId').value || '' };
  const idx=window.clients.findIndex(c=>c.company===company); 
  let newClientsArr = [...window.clients];
  if(idx>=0){ if(confirm("更新客户信息？ Update?")) newClientsArr[idx]=newClient; else return; } else newClientsArr.push(newClient);
  set(ref(db, 'settings/clients'), newClientsArr); 
  alert("已保存 Saved!");
}
window.selectClient = function() {
  const idx=document.getElementById('clientSelect').value; if(idx==="") return;
  const c=window.clients[idx]; 
  document.getElementById('billTradeName').value=c.tradeName||''; document.getElementById('billCompany').value=c.company; document.getElementById('billAddress').value=c.address; document.getElementById('billDefaultRate').value=c.rate||0; document.getElementById('billAddonRate').value=c.addonRate||0; document.getElementById('billTaxId').value=c.taxId||'';
  ['billTradeName','billCompany','billAddress','billDefaultRate','billTaxId','billAddonRate'].forEach(id => window.checkClear(document.getElementById(id)));
  const newRate=Number(c.rate)||0; const newAddonRate=Number(c.addonRate)||0;
  if(window.items.length>0){ window.items.forEach(i=> { i.rate=newRate; if(i.addons) i.addons.forEach(a=>a.rate=newAddonRate); }); window.renderItemInputs(); }
  defaultItem.rate=newRate; window.updateState();
}

window.renderItemInputs = function() {
  const container = document.getElementById('items-container'); container.innerHTML = '';
  window.items.forEach((item, index) => {
    let addonsHtml = '';
    if(item.addons && item.addons.length > 0) {
        item.addons.forEach((ad, aIdx) => {
            addonsHtml += `
              <div class="addon-item">
                 <span style="font-size:10px; color:#0ea5e9;">↳</span>
                 <div class="addon-desc-wrapper">
                    <div class="merged-group">
                      <div class="input-box">
                          <input type="text" list="dl-addons" placeholder="附加产品名称 Add-on Name" value="${ad.desc}" onblur="smartCompleteAddon(this, ${index}, ${aIdx}); autoSaveItemDB(this, window.dbAddons, 'settings/addons', 'dl-addons')" onkeypress="handleSmartKey(event, this)" oninput="checkClear(this)">
                          <span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                      </div>
                      <div class="merged-trigger" onclick="editAddonDb(${index}, ${aIdx}, window.dbAddons, 'settings/addons', 'dl-addons')"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
                    </div>
                 </div>
                 <div class="addon-num-wrapper"><input type="number" placeholder="数量 Qty" value="${ad.qty}" oninput="updateAddon(${index}, ${aIdx}, 'qty', this.value)"></div>
                 <div class="addon-num-wrapper wide"><input type="number" placeholder="单价 Unit" value="${ad.amount}" oninput="updateAddon(${index}, ${aIdx}, 'amount', this.value)"></div>
                 <div class="addon-num-wrapper"><input type="number" placeholder="佣金% Comm" value="${ad.rate}" oninput="updateAddon(${index}, ${aIdx}, 'rate', this.value)" title="Comm %"></div>
                 <div class="addon-col-del"><span style="color:#ef4444; cursor:pointer; font-size:12px;" onclick="removeAddon(${index}, ${aIdx})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span></div>
              </div>`;
        });
    }
    const div = document.createElement('div');
    div.style.cssText = "background:white; border:1px solid #e5e7eb; border-radius:4px; padding:10px; margin-bottom:10px;";
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
         <span style="font-weight:700; color:#b91c1c; font-size:11px;">#${index + 1}</span>
         <div>
            <button class="btn btn-icon" onclick="copyItem(${index})"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><button class="btn btn-icon" style="color:#dc2626" onclick="deleteItem(${index})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      </div>
      <div style="display:flex; gap:10px; margin-bottom:6px;">
         <div class="input-box" style="flex:1">
           <input type="text" placeholder="旅客姓名 Passenger Name" value="${item.name||''}" oninput="updateItem(${index}, 'name', this.value);checkClear(this)" style="font-weight:bold;">
           <span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
         </div>
         <div class="input-box" style="flex:1">
           <input type="text" placeholder="预订号 Loc." value="${item.ref||''}" oninput="updateItem(${index}, 'ref', this.value);checkClear(this)">
           <span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
         </div>
      </div>
      <div class="item-grid-top">
         <div class="merged-group">
            <div class="input-box"><input type="text" list="dl-types" placeholder="舱房类型" value="${item.type||''}" onblur="smartComplete(this, window.dbTypes, ${index}, 'type'); autoSaveItemDB(this, window.dbTypes, 'settings/types', 'dl-types')" onkeypress="handleSmartKey(event, this)" oninput="checkClear(this)"><span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span></div>
            <div class="merged-trigger" onclick="editItemDb(${index}, 'type', window.dbTypes, 'settings/types', 'dl-types')"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
         </div>
         <div class="merged-group">
            <div class="input-box"><input type="text" list="dl-exps" placeholder="体验类型" value="${item.exp||''}" onblur="smartComplete(this, window.dbExps, ${index}, 'exp'); autoSaveItemDB(this, window.dbExps, 'settings/exps', 'dl-exps')" onkeypress="handleSmartKey(event, this)" oninput="checkClear(this)"><span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span></div>
            <div class="merged-trigger" onclick="editItemDb(${index}, 'exp', window.dbExps, 'settings/exps', 'dl-exps')"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
         </div>
         <div class="merged-group">
            <div class="input-box"><input type="text" list="dl-prices" placeholder="价格类型" value="${item.price||''}" onblur="smartComplete(this, window.dbPrices, ${index}, 'price'); autoSaveItemDB(this, window.dbPrices, 'settings/prices', 'dl-prices')" onkeypress="handleSmartKey(event, this)" oninput="checkClear(this)"><span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span></div>
            <div class="merged-trigger" onclick="editItemDb(${index}, 'price', window.dbPrices, 'settings/prices', 'dl-prices')"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
         </div>
      </div>
      <div class="item-grid-btm">
         <div><label>人数 PAX</label><div class="input-box"><input type="number" value="${item.qty}" oninput="updateItem(${index}, 'qty', this.value)"></div></div>
         <div><label>直客价 Gross</label><div class="input-box"><input type="number" value="${item.base}" oninput="updateItem(${index}, 'base', this.value)"></div></div>
         <div><label>税费 Tax</label><div class="input-box"><input type="number" value="${item.tax}" oninput="updateItem(${index}, 'tax', this.value)"></div></div>
         <div><label>服务费 HSC</label><div class="input-box"><input type="number" value="${item.hsc}" oninput="updateItem(${index}, 'hsc', this.value)"></div></div>
         <div><label>佣金% Rate</label><div class="input-box"><input type="number" value="${item.rate}" oninput="updateItem(${index}, 'rate', this.value)" placeholder="比例"></div></div>
         <div><label>额外 Extra</label><div class="input-box"><input type="number" value="${item.extra}" oninput="updateItem(${index}, 'extra', this.value)" placeholder="金额"></div></div>
      </div>
      <div class="addon-row-wrap">${addonsHtml}<button class="btn btn-addon" onclick="addAddon(${index})">➕ 附加产品 Add-on</button></div>
    `;
    container.appendChild(div);
    div.querySelectorAll('.input-box input, .input-box textarea').forEach(inp => window.checkClear(inp));
  });
}

window.updateItem = function(index, key, val) { window.items[index][key] = val; window.updateState(); }
window.addAddon = function(idx) { const rate = document.getElementById('billAddonRate').value || 0; if(!window.items[idx].addons) window.items[idx].addons = []; window.items[idx].addons.push({ desc: "", amount: 0, rate: rate, qty: 1 }); window.renderItemInputs(); window.updateState(); }
window.removeAddon = function(idx, aIdx) { window.items[idx].addons.splice(aIdx, 1); window.renderItemInputs(); window.updateState(); }
window.updateAddon = function(idx, aIdx, key, val) { window.items[idx].addons[aIdx][key] = val; window.updateState(); }
window.addItem = function() { const rate = document.getElementById('billDefaultRate').value || 0; window.items.push({ ...defaultItem, rate, addons: [] }); window.renderItemInputs(); window.updateState(); }
window.deleteItem = function(i) { if(confirm('是否删除 Delete?')) { window.items.splice(i, 1); window.renderItemInputs(); window.updateState(); } }
window.copyItem = function(i) { window.items.splice(i+1, 0, JSON.parse(JSON.stringify(window.items[i]))); window.renderItemInputs(); window.updateState(); }

window.updateState = function() {
  document.querySelectorAll('[id]').forEach(el => {
    if(el.closest('.pane-form') && !el.closest('#items-container') && !['clientSelect','sailingStart','sailingEnd'].includes(el.id)) {
      const target = document.querySelector(`[data-bind="${el.id}"]`);
      if(el.id === 'billCompany') {
           const tradeNameVal = document.getElementById('billTradeName').value;
           const elPv = document.getElementById('pv-billCompany');
           if(elPv) { elPv.textContent = el.value; if(tradeNameVal && tradeNameVal.trim() !== '') elPv.classList.add('is-sub'); else elPv.classList.remove('is-sub'); }
      } else if(el.id === 'billTaxId') {
           const elPv = document.getElementById('pv-billTaxId');
           if(elPv) elPv.textContent = el.value ? `CIF/VAT: ${el.value}` : '';
      } else if(el.id === 'invDate') {
           const val = el.value; if(val) { const [y, m, d] = val.split('-'); document.getElementById('pv-invDate-formatted').textContent = `${d}/${m}/${y}`; }
      } else if (target) {
        if (target.dataset.format === 'multiline') target.innerHTML = (el.value || '').replace(/\n/g, '<br>');
        else target.textContent = el.value;
      }
    }
  });

  const sStart = document.getElementById('sailingStart').value;
  const sEnd = document.getElementById('sailingEnd').value;
  const start = window.parseDateStr(sStart), end = window.parseDateStr(sEnd);
  if(start&&end&&!isNaN(start)&&!isNaN(end)) {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const nights = diffDays;      // e.g. 8th - 1st = 7 nights
    const days = diffDays + 1;    // e.g. 7 nights = 8 days
    document.getElementById('pv-sailing-combined').textContent = `${sStart} ~ ${sEnd} (${days}天 ${nights}晚)`;
  } else {
    document.getElementById('pv-sailing-combined').textContent = [sStart, sEnd].filter(Boolean).join(' ~ ');
  }

  const tbody = document.getElementById('preview-items-body');
  tbody.innerHTML = '';
  let tBase=0, tTax=0, tHSC=0, tComm=0, totalGrossPrice = 0;

  window.items.forEach(item => {
    const qty = Number(item.qty)||0;
    const grossPrice = Number(item.base)||0; 
    const tax = Number(item.tax)||0;
    const hsc = Number(item.hsc)||0;
    const rate = Number(item.rate)||0;
    const extra = Number(item.extra)||0; 
    
    const commBase = grossPrice - tax - hsc - extra;
    const comm = (commBase * (rate/100)) + extra;
    const net = grossPrice - comm; 
    
    tBase += commBase; tTax += tax; tHSC += hsc; tComm += comm; totalGrossPrice += grossPrice;

    const cabinDesc = [item.type, item.exp, item.price].filter(Boolean).join(' / ');
    const descParts = [item.name, item.ref, cabinDesc].filter(Boolean);
    const fullNameDesc = descParts.join(' - ');
    
    let addonsRows = '';
    if(item.addons && item.addons.length > 0) {
        item.addons.forEach(ad => {
            const aQty = Number(ad.qty) || 1;
            const unit = Number(ad.amount)||0;
            const adGross = aQty * unit; 
            const r = Number(ad.rate)||0;
            const adComm = adGross * (r/100);
            const adNet = adGross - adComm;
            
            tBase += adGross; totalGrossPrice += adGross; tComm += adComm;
            
            addonsRows += `
              <tr class="row-addon">
                  <td class="addon-desc"><div>${ad.desc || '附加产品'}</div></td>
                  <td class="num">${aQty}</td>
                  <td class="num">${window.formatMoney(adGross)}</td>
                  <td class="num">-</td>
                  <td class="num text-red"><div>- ${window.formatMoney(adComm)}</div></td>
                  <td class="num">-</td>
                  <td class="num">-</td>
                  <td class="num text-bold">${window.formatMoney(adNet)}</td>
              </tr>`;
        });
    }

    let commHtml = `<div class="text-red">- ${window.formatMoney(comm)}</div>`;
    if (rate > 0 || extra > 0) {
        let detailStr = `(${rate}%`; if(extra > 0) detailStr += ` + ${extra}`; detailStr += `)`;
        commHtml += `<div class="comm-detail">${detailStr}</div>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div style="font-weight:600; color:#1f2937">${fullNameDesc || '-'}</div></td>
      <td class="num">${qty}</td>
      <td class="num">${window.formatMoney(grossPrice)}</td>
      <td class="num">${window.formatMoney(commBase)}</td>
      <td class="num">${commHtml}</td>
      <td class="num">${window.formatMoney(tax)}</td>
      <td class="num">${window.formatMoney(hsc)}</td>
      <td class="num text-bold">${window.formatMoney(net)}</td>
    `;
    tbody.appendChild(tr);
    if(addonsRows) tbody.insertAdjacentHTML('beforeend', addonsRows);
  });

  if(window.items.length===0) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#ccc;padding:20px;">暂无项目 No Items / 无明细</td></tr>';

  const gross = totalGrossPrice; 
  const net = gross - tComm; 
  
  document.getElementById('display-total-base').textContent = window.formatMoney(tBase);
  document.getElementById('display-total-tax-hsc').textContent = window.formatMoney(tTax + tHSC);
  document.getElementById('display-gross').textContent = 'EUR ' + window.formatMoney(gross); 
  document.getElementById('display-commission').textContent = '- EUR ' + window.formatMoney(tComm);
  document.getElementById('display-net').textContent = window.formatMoney(net);
  
  saveDraftDebounced();
}

function getFieldsData() {
  const data = {};
  document.querySelectorAll('.pane-form input:not([type=file]), .pane-form textarea').forEach(el => {
    if(el.id && !el.closest('#items-container') && !el.list && el.id!=='clientSelect') data[el.id] = el.value;
  });
  data['ship'] = document.getElementById('ship').value;
  data['route'] = document.getElementById('route').value;
  data['sailingStart'] = document.getElementById('sailingStart').value;
  data['sailingEnd'] = document.getElementById('sailingEnd').value;
  return data;
}

let saveTimeout;
function saveDraftDebounced() {
    if(!auth.currentUser) return;
    setStatus('connecting', '保存中...');
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        const draftData = { items: window.items, fields: getFieldsData(), _updated: Date.now() };
        set(ref(db, 'draft'), draftData).then(() => {
            setStatus('connected', '已同步/更新');
        }).catch(err => {
            setStatus('offline', 'Error');
        });
    }, 500); 
}

// --- Database Initialization & Sync ---
function initializeDatabase() {
    get(ref(db, 'settings')).then((snapshot) => {
        if (!snapshot.exists()) {
           console.log("Empty DB detected. Uploading Backup Data...");
           set(ref(db, 'settings'), {
               clients: BACKUP_DATA.clients,
               ships: BACKUP_DATA.ships,
               routes: BACKUP_DATA.routes,
               types: BACKUP_DATA.dbTypes,
               exps: BACKUP_DATA.dbExps,
               prices: BACKUP_DATA.dbPrices,
               addons: BACKUP_DATA.dbAddons
           });
        }
    });
}

function initListeners() {
    const settingsMap = [
        { key: 'clients', var: 'clients', default: BACKUP_DATA.clients },
        { key: 'ships', var: 'ships', default: BACKUP_DATA.ships },
        { key: 'routes', var: 'routes', default: BACKUP_DATA.routes },
        { key: 'types', var: 'dbTypes', default: BACKUP_DATA.dbTypes },
        { key: 'exps', var: 'dbExps', default: BACKUP_DATA.dbExps },
        { key: 'prices', var: 'dbPrices', default: BACKUP_DATA.dbPrices },
        { key: 'addons', var: 'dbAddons', default: BACKUP_DATA.dbAddons }
    ];

    settingsMap.forEach(setting => {
        onValue(ref(db, `settings/${setting.key}`), (snapshot) => {
            const val = snapshot.val();
            window[setting.var] = val || setting.default;
            if(setting.key === 'clients') renderClientSelect();
            else renderAllDatalists();
        });
    });

    onValue(ref(db, 'draft'), (snapshot) => {
        const data = snapshot.val();
        
        // 1. PREPARE DEFAULTS
        const defaults = {
            payment: DEFAULT_PAYMENT,
            remarks: DEFAULT_REMARKS,
            invDate: new Date().toISOString().split('T')[0]
        };

        if (data) {
            // 2. MERGE FIELDS WITH DEFAULTS (Force default if empty)
            const remoteFields = data.fields || {};
            
            // Apply Date
            const dateEl = document.getElementById('invDate');
            dateEl.value = (remoteFields.invDate && remoteFields.invDate.trim()) ? remoteFields.invDate : defaults.invDate;
            window.checkClear(dateEl);

            // Apply Payment
            const payEl = document.getElementById('payment');
            payEl.value = (remoteFields.payment && remoteFields.payment.trim()) ? remoteFields.payment : defaults.payment;
            window.checkClear(payEl);

            // Apply Remarks
            const remEl = document.getElementById('remarks');
            remEl.value = (remoteFields.remarks && remoteFields.remarks.trim()) ? remoteFields.remarks : defaults.remarks;
            window.checkClear(remEl);

            // Apply other fields
            Object.entries(remoteFields).forEach(([k, v]) => {
                if (['invDate', 'payment', 'remarks'].includes(k)) return; // Handled above
                const el = document.getElementById(k);
                if (el && document.activeElement !== el) {
                    el.value = v;
                    window.checkClear(el);
                }
            });

            if(JSON.stringify(window.items) !== JSON.stringify(data.items || [])) {
               window.items = (data.items || []).map(i => ({ ...defaultItem, ...i, addons: i.addons || [] }));
               if(window.items.length === 0) window.items = [{ ...defaultItem, addons:[] }];
               window.renderItemInputs();
            }
            window.updateState();
            setStatus('connected', '已同步/更新');
        } else {
            // Fresh start logic
            document.getElementById('invDate').value = defaults.invDate;
            document.getElementById('payment').value = defaults.payment;
            document.getElementById('remarks').value = defaults.remarks;
            window.items = [{ ...defaultItem, addons:[] }];
            window.renderItemInputs();
            window.updateState();
        }
    });
}

window.resetForm = function() { 
  if(confirm("⚠ 警告：这将清空云端当前账单！\nWarning: This will clear the Cloud Draft.")) { 
      set(ref(db, 'draft'), null); 
      document.getElementById('invDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('payment').value = DEFAULT_PAYMENT;
      document.getElementById('remarks').value = DEFAULT_REMARKS;
      document.getElementById('invNo').value = "";
      document.getElementById('clientSelect').value = "";
      document.getElementById('billTradeName').value = "";
      document.getElementById('billCompany').value = "";
      document.getElementById('billTaxId').value = "";
      document.getElementById('billAddress').value = "";
      document.getElementById('billDefaultRate').value = 0;
      document.getElementById('billAddonRate').value = 0;
      document.getElementById('ship').value = "";
      document.getElementById('route').value = "";
      document.getElementById('sailingStart').value = "";
      document.getElementById('sailingEnd').value = "";
      // Removed global Ref reset
      window.items = [{ ...defaultItem, addons:[] }];
      window.renderItemInputs(); 
      window.updateState();
  } 
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        setStatus('connected', '已连接');
        initializeDatabase(); 
        initListeners();
        
        document.querySelectorAll('.pane-form input, .pane-form textarea').forEach(el => {
          if(!el.closest('#items-container') && el.id!=='sailingStart' && el.id!=='sailingEnd') {
              el.addEventListener('input', window.updateState);
          }
        });
    } else {
        setStatus('offline', '未连接');
    }
});

signInAnonymously(auth).catch((error) => {
    console.error(error);
    setStatus('offline', '验证失败');
});