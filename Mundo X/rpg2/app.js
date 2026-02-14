// Ficha editável (HTML + JS puro) - com cálculos + checkbox + select + image
const STORAGE_DATA_KEY = "ficha:rpg2:data:v1";
const STORAGE_LAYOUT_KEY = "ficha:rpg2:layout:v1";

const $ = (sel) => document.querySelector(sel);

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function downloadJSON(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function readJSONFile(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => { try{ resolve(JSON.parse(fr.result)); } catch(e){ reject(e); } };
    fr.onerror = reject;
    fr.readAsText(file);
  });
}

function debounce(fn, ms=200){
  let t=null;
  return (...args) => { clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
}

/**
 * ✅ DEFAULT_LAYOUT (o seu)
 * - Se quiser checkbox: { "id":"x", "type":"checkbox", ... }
 * - Se quiser select: { "id":"classe", "type":"select", "options":[{"label":"A","value":"A"}], ... }
 * - Se quiser imagem: { "id":"avatar", "type":"image", ... }
 */
const DEFAULT_LAYOUT = {"version":1,"pages":[
  {"id":"p1","bg":"assets/page_1.png","fields":[
    {"id":"nome","type":"text","x":7,"y":9.4,"w":23.5,"h":3.2},
    {"id":"tipo_ninja","type":"text","x":7,"y":12.7,"w":23.5,"h":3.2},
    {"id":"idade","type":"text","class":"numeric","x":7,"y":16.1,"w":7,"h":3.2},
    {"id":"level","type":"text","class":"numeric","x":23.5,"y":16.1,"w":7,"h":3.2},
    {"id":"rank","type":"text","x":7,"y":19.6,"w":23.5,"h":3.2},
    {"id":"vila","type":"text","x":7,"y":22.9,"w":23.5,"h":3.2},
    {"id":"cla","type":"text","x":7,"y":26.3,"w":23.5,"h":3.2},

    {"id":"forca","type":"text","class":"numeric","x":40,"y":11,"w":6,"h":3},
    {"id":"forca_bonus","type":"text","class":"numeric","x":47,"y":11,"w":6,"h":3},
    {"id":"destreza","type":"text","class":"numeric","x":40,"y":14.5,"w":6,"h":3},
    {"id":"destreza_bonus","type":"text","class":"numeric","x":47,"y":14.5,"w":6,"h":3},
    {"id":"agilidade","type":"text","class":"numeric","x":40,"y":18,"w":6,"h":3},
    {"id":"agilidade_bonus","type":"text","class":"numeric","x":47,"y":18,"w":6,"h":3},
    {"id":"percepcao","type":"text","class":"numeric","x":40,"y":21.5,"w":6,"h":3},
    {"id":"percepcao_bonus","type":"text","class":"numeric","x":47,"y":21.5,"w":6,"h":3},
    {"id":"inteligencia","type":"text","class":"numeric","x":40,"y":25,"w":6,"h":3},
    {"id":"inteligencia_bonus","type":"text","class":"numeric","x":47,"y":25,"w":6,"h":3},
    {"id":"vigor","type":"text","class":"numeric","x":40,"y":28.5,"w":6,"h":3},
    {"id":"vigor_bonus","type":"text","class":"numeric","x":47,"y":28.5,"w":6,"h":3},
    {"id":"espirito","type":"text","class":"numeric","x":40,"y":32,"w":6,"h":3},
    {"id":"espirito_bonus","type":"text","class":"numeric","x":47,"y":32,"w":6,"h":3},

    {"id":"taijutsu","type":"text","class":"numeric","x":70.2,"y":10.7,"w":5.5,"h":3},
    {"id":"arma_ninja","type":"text","class":"numeric","x":70.2,"y":14.2,"w":5.5,"h":3},
    {"id":"furtividade","type":"text","class":"numeric","x":70.2,"y":17.7,"w":5.5,"h":3},
    {"id":"medicina","type":"text","class":"numeric","x":70.2,"y":21.2,"w":5.5,"h":3},
    {"id":"controle_chakra","type":"text","class":"numeric","x":70.2,"y":24.7,"w":5.5,"h":3},
    {"id":"labia","type":"text","class":"numeric","x":70.2,"y":28.2,"w":5.5,"h":3},
    {"id":"sobrevivencia","type":"text","class":"numeric","x":70.2,"y":31.7,"w":5.5,"h":3},
    {"id":"conhecimento_ninja","type":"text","class":"numeric","x":70.2,"y":35.2,"w":5.5,"h":3},

    {"id":"dados_importantes","type":"textarea","x":6.5,"y":44,"w":24.5,"h":26},

    {"id":"fortitude","type":"text","class":"numeric","x":46.8,"y":49,"w":7,"h":3.2},
    {"id":"reflexo","type":"text","class":"numeric","x":46.8,"y":54.6,"w":7,"h":3.2},
    {"id":"vontade","type":"text","class":"numeric","x":46.8,"y":60.2,"w":7,"h":3.2},

    {"id":"elementos_ninja","type":"text","x":39,"y":66.5,"w":25,"h":3.8},

    {"id":"hp","type":"text","class":"numeric","x":86,"y":48,"w":10,"h":3,"readonly":true,"format":"int","calc":"(vigor*10) + (level*5)"},
    {"id":"ca","type":"text","class":"numeric","x":86,"y":53.5,"w":10,"h":3,"readonly":true,"format":"int","calc":"10 + agilidade_bonus"},
    {"id":"chack","type":"text","class":"numeric","x":86,"y":59,"w":10,"h":3,"readonly":true,"format":"int","calc":"(espirito*10) + (level*5)"},
    {"id":"inic","type":"text","class":"numeric","x":86,"y":64.5,"w":10,"h":3,"readonly":true,"format":"int","calc":"agilidade_bonus + percepcao_bonus"},
    {"id":"desloc","type":"text","class":"numeric","x":86,"y":70,"w":10,"h":3,"readonly":true,"format":"int","calc":"9 + max(0, agilidade_bonus)"},

    {"id":"jutsus_mais_usados","type":"textarea","x":7,"y":78,"w":89,"h":18.5}
  ]},

  {"id":"p2","bg":"assets/page_2.png","fields":[
    {"id":"mochila_1","type":"text","x":8,"y":12.2,"w":32,"h":3.4},
    {"id":"mochila_2","type":"text","x":8,"y":15.9,"w":32,"h":3.4},
    {"id":"mochila_3","type":"text","x":8,"y":19.6,"w":32,"h":3.4},
    {"id":"mochila_4","type":"text","x":8,"y":23.3,"w":32,"h":3.4},
    {"id":"mochila_5","type":"text","x":8,"y":27,"w":32,"h":3.4},
    {"id":"mochila_6","type":"text","x":8,"y":30.7,"w":32,"h":3.4},
    {"id":"mochila_7","type":"text","x":8,"y":34.4,"w":32,"h":3.4},
    {"id":"mochila_8","type":"text","x":8,"y":38.1,"w":32,"h":3.4},
    {"id":"mochila_9","type":"text","x":8,"y":41.8,"w":32,"h":3.4},
    {"id":"mochila_10","type":"text","x":8,"y":45.5,"w":32,"h":3.4},

    {"id":"ryos","type":"text","class":"numeric","x":47,"y":12,"w":10,"h":4.2},
    {"id":"talentos_passivas","type":"textarea","x":63,"y":12,"w":33,"h":40},

    {"id":"jutsu_situacional_1","type":"textarea","x":8,"y":66.5,"w":88,"h":13},
    {"id":"jutsu_situacional_2","type":"textarea","x":8,"y":81,"w":88,"h":13}
  ]}
]};

let LAYOUT = null;
let data = {};
let layoutMode = false;

// =====================
// Fórmulas / Campos calculados (sem eval)
// =====================
let fieldInputs = new Map();

function toNumber(v){
  const s = String(v ?? "").trim().replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
function num(id){ return toNumber(data?.[id]); }

const FN = {
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  min: Math.min, max: Math.max, abs: Math.abs,
};

// ---- Parser de expressão ----
function tokenize(expr){
  const s = String(expr || "");
  const tokens = [];
  let i = 0;

  const isSpace = (c) => /\s/.test(c);
  const isDigit = (c) => /[0-9]/.test(c);
  const isIdStart = (c) => /[a-zA-Z_]/.test(c);
  const isId = (c) => /[a-zA-Z0-9_]/.test(c);

  while(i < s.length){
    const c = s[i];
    if(isSpace(c)){ i++; continue; }

    if(isDigit(c) || (c === "." && isDigit(s[i+1]))){
      let j = i;
      while(j < s.length && (isDigit(s[j]) || s[j] === ".")) j++;
      tokens.push({ type: "num", value: parseFloat(s.slice(i, j)) });
      i = j;
      continue;
    }

    if(isIdStart(c)){
      let j = i;
      while(j < s.length && isId(s[j])) j++;
      tokens.push({ type: "id", value: s.slice(i, j) });
      i = j;
      continue;
    }

    if("+-*/(),".includes(c)){
      tokens.push({ type: c });
      i++;
      continue;
    }

    throw new Error("Token inválido: " + c);
  }

  return tokens;
}

function evalCalc(expr){
  if(!expr || typeof expr !== "string") return 0;

  try{
    const tokens = tokenize(expr);
    let idx = 0;

    const peek = () => tokens[idx];
    const eat = (type) => {
      const t = tokens[idx];
      if(!t || t.type !== type) throw new Error("Esperado " + type);
      idx++;
      return t;
    };

    function parseExpression(){
      let v = parseTerm();
      while(peek() && (peek().type === "+" || peek().type === "-")){
        const op = eat(peek().type).type;
        const r = parseTerm();
        v = op === "+" ? (v + r) : (v - r);
      }
      return v;
    }

    function parseTerm(){
      let v = parseFactor();
      while(peek() && (peek().type === "*" || peek().type === "/")){
        const op = eat(peek().type).type;
        const r = parseFactor();
        if(op === "*") v = v * r;
        else v = (r === 0 ? 0 : v / r);
      }
      return v;
    }

    function parseFactor(){
      if(peek() && (peek().type === "+" || peek().type === "-")){
        const op = eat(peek().type).type;
        const v = parseFactor();
        return op === "-" ? -v : v;
      }
      return parsePrimary();
    }

    function parsePrimary(){
      const t = peek();
      if(!t) return 0;

      if(t.type === "num"){
        eat("num");
        return Number.isFinite(t.value) ? t.value : 0;
      }

      if(t.type === "("){
        eat("(");
        const v = parseExpression();
        eat(")");
        return v;
      }

      if(t.type === "id"){
        const name = eat("id").value;

        // função: name(...)
        if(peek() && peek().type === "("){
          eat("(");
          const args = [];
          if(peek() && peek().type !== ")"){
            args.push(parseExpression());
            while(peek() && peek().type === ","){
              eat(",");
              args.push(parseExpression());
            }
          }
          eat(")");

          const fn = FN[name];
          if(typeof fn !== "function") return 0;
          return toNumber(fn(...args));
        }

        // variável
        return num(name);
      }

      return 0;
    }

    const value = parseExpression();
    if(idx < tokens.length) return 0;
    return toNumber(value);
  }catch{
    return 0;
  }
}

function recomputeAll(){
  if(!LAYOUT?.pages?.length) return;

  // 2 passadas (dependências entre campos calculados)
  for(let pass=0; pass<2; pass++){
    for(const page of LAYOUT.pages){
      for(const field of (page.fields || [])){
        if(!field?.calc) continue;

        const value = evalCalc(field.calc);
        const out = field.format === "int" ? String(Math.round(value)) : String(value);

        data[field.id] = out;

        const el = fieldInputs.get(field.id);
        if(!el) continue;

        if(el.tagName === "INPUT" && el.type === "checkbox"){
          el.checked = Number(out) === 1;
        }else if(el.tagName === "SELECT"){
          if(el.value !== out) el.value = out;
        }else if(el.tagName === "IMG"){
          // não costuma ter calc em imagem, mas mantém seguro
        }else if("value" in el){
          if(el.value !== out) el.value = out;
        }
      }
    }
  }

  saveData();
}

// =====================
// Persistência
// =====================
function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_DATA_KEY);
    data = raw ? JSON.parse(raw) : {};
  }catch{ data = {}; }
}
function saveData(){ localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(data)); }

function loadLayout(){
  try{
    const raw = localStorage.getItem(STORAGE_LAYOUT_KEY);
    if(raw) return JSON.parse(raw);
  }catch{}
  return DEFAULT_LAYOUT;
}
function saveLayout(layout){
  localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(layout));
}

// =====================
// Drag/Resize global (evita 300 listeners)
// =====================
let currentDrag = null;

window.addEventListener("mousemove", (e) => {
  if(!currentDrag) return;

  const { field, wrap, rect, startX, startY, startLeft, startTop, startW, startH, isResize } = currentDrag;

  const dx = (e.clientX - startX) / rect.width * 100;
  const dy = (e.clientY - startY) / rect.height * 100;

  if(isResize){
    field.w = clamp(startW + dx, 1, 95);
    field.h = clamp(startH + dy, 1, 95);
  }else{
    field.x = clamp(startLeft + dx, 0, 99);
    field.y = clamp(startTop + dy, 0, 99);
  }

  wrap.style.left = field.x + "%";
  wrap.style.top  = field.y + "%";
  wrap.style.width  = field.w + "%";
  wrap.style.height = field.h + "%";
});

window.addEventListener("mouseup", () => {
  if(!currentDrag) return;
  saveLayout(LAYOUT);
  currentDrag = null;
});

// =====================
// Render
// =====================
function createFieldEl(field, sheetEl){
  const wrap = document.createElement("div");
  wrap.className = "field" + (field.class ? " " + field.class : "");
  wrap.dataset.id = field.id;
  wrap.style.left = field.x + "%";
  wrap.style.top  = field.y + "%";
  wrap.style.width  = field.w + "%";
  wrap.style.height = field.h + "%";

  const resizer = document.createElement("div");
  resizer.className = "resizer";

  // mousedown (modo layout)
  wrap.addEventListener("mousedown", (e) => {
    if(!layoutMode) return;
    const rect = sheetEl.getBoundingClientRect();
    const isResize = e.target === resizer;

    currentDrag = {
      field,
      wrap,
      rect,
      isResize,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: field.x,
      startTop: field.y,
      startW: field.w,
      startH: field.h,
    };
    e.preventDefault();
  });

  // =========================
  // ✅ IMAGE FIELD
  // =========================
  if(field.type === "image"){
    wrap.classList.add("image");

    const img = document.createElement("img");
    img.className = "imgField";
    img.draggable = false;

    const saved = data[field.id];
    if(saved) img.src = saved;

    const file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";
    file.style.display = "none";

    const btnPick = document.createElement("button");
    btnPick.type = "button";
    btnPick.className = "imgBtn btnPick";
    btnPick.textContent = saved ? "Trocar" : "Adicionar";

    const btnClear = document.createElement("button");
    btnClear.type = "button";
    btnClear.className = "imgBtn btnClear";
    btnClear.textContent = "Remover";

    // não arrastar campo ao clicar nos botões
    btnPick.addEventListener("mousedown", (e)=> e.stopPropagation());
    btnClear.addEventListener("mousedown", (e)=> e.stopPropagation());

    btnPick.addEventListener("click", () => file.click());

    file.addEventListener("change", () => {
      const f = file.files?.[0];
      if(!f) return;

      // limite: localStorage é pequeno
      if(f.size > 800 * 1024){
        alert("Imagem muito grande. Tente até ~800KB (comprima a imagem).");
        file.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        data[field.id] = reader.result; // base64 dataURL
        saveData();
        img.src = reader.result;
        btnPick.textContent = "Trocar";
      };
      reader.readAsDataURL(f);
      file.value = "";
    });

    btnClear.addEventListener("click", () => {
      delete data[field.id];
      saveData();
      img.removeAttribute("src");
      btnPick.textContent = "Adicionar";
    });

    wrap.appendChild(img);
    wrap.appendChild(btnPick);
    wrap.appendChild(btnClear);
    wrap.appendChild(file);
    wrap.appendChild(resizer);

    fieldInputs.set(field.id, img);
    return wrap;
  }

  // =========================
  // ✅ CHECKBOX (salva 1/0)
  // =========================
  if(field.type === "checkbox"){
    wrap.classList.add("checkbox");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "input checkbox";
    cb.checked = Number(data[field.id] ?? 0) === 1;

    if(field.readonly || field.calc) cb.disabled = true;

    cb.addEventListener("change", () => {
      data[field.id] = cb.checked ? 1 : 0;
      saveData();
      recomputeAll();
    });

    cb.addEventListener("mousedown", (e)=> e.stopPropagation());

    wrap.appendChild(cb);
    wrap.appendChild(resizer);

    fieldInputs.set(field.id, cb);
    return wrap;
  }

  // =========================
  // ✅ SELECT
  // =========================
  if(field.type === "select"){
    const sel = document.createElement("select");
    sel.className = "input";

    (field.options || []).forEach(opt => {
      const o = document.createElement("option");
      o.value = String(opt.value);
      o.textContent = opt.label;
      sel.appendChild(o);
    });

    const fallback = field.options?.[0]?.value ?? "";
    sel.value = String(data[field.id] ?? fallback);

    if(field.readonly || field.calc){
      sel.disabled = true;
      sel.classList.add("readonly");
    }

    sel.addEventListener("change", () => {
      data[field.id] = sel.value;
      saveData();
      recomputeAll();
    });

    sel.addEventListener("mousedown", (e)=> e.stopPropagation());

    wrap.appendChild(sel);
    wrap.appendChild(resizer);

    fieldInputs.set(field.id, sel);
    return wrap;
  }

  // =========================
  // TEXT / TEXTAREA (padrão)
  // =========================
  const input = field.type === "textarea"
    ? document.createElement("textarea")
    : document.createElement("input");

  input.className = "input";
  if(input.tagName === "INPUT") input.type = "text";

  input.value = data[field.id] ?? "";

  if(field.readonly || field.calc){
    input.readOnly = true;
    input.tabIndex = -1;
    input.classList.add("readonly");
  }

  input.addEventListener("input", debounce(() => {
    data[field.id] = input.value;
    saveData();
    recomputeAll();
  }, 120));

  input.addEventListener("mousedown", (e)=> e.stopPropagation());

  wrap.appendChild(input);
  wrap.appendChild(resizer);

  fieldInputs.set(field.id, input);
  return wrap;
}

function renderSheet(sheetEl, page){
  sheetEl.innerHTML = "";
  const img = document.createElement("img");
  img.className = "bg";
  img.src = page.bg;
  img.alt = "Fundo";
  img.draggable = false;
  sheetEl.appendChild(img);

  for(const field of page.fields){
    sheetEl.appendChild(createFieldEl(field, sheetEl));
  }
}

function setPage(n){
  const sheets = Array.from(document.querySelectorAll(".sheet"));
  const btns = Array.from($("#pageNav").querySelectorAll("button"));
  sheets.forEach((s, idx) => s.classList.toggle("hidden", idx !== (n-1)));
  btns.forEach((b, idx) => b.classList.toggle("primary", idx === (n-1)));
}

function renderAll(){
  fieldInputs = new Map();
  const sheetsWrap = $("#sheets");
  sheetsWrap.innerHTML = "";
  const nav = $("#pageNav");
  nav.innerHTML = "";

  LAYOUT.pages.forEach((page, idx) => {
    const n = idx+1;

    const btn = document.createElement("button");
    btn.className = "btn" + (n===1 ? " primary" : "");
    btn.textContent = `Página ${n}`;
    btn.addEventListener("click", () => setPage(n));
    nav.appendChild(btn);

    const section = document.createElement("section");
    section.id = `sheet${n}`;
    section.className = "sheet" + (n===1 ? "" : " hidden");
    section.classList.toggle("layout", layoutMode);

    sheetsWrap.appendChild(section);
    renderSheet(section, page);
  });

  recomputeAll();
}

// =====================
// UI
// =====================
function wireUI(){
  $("#btnToggleLayout").addEventListener("click", () => {
    layoutMode = !layoutMode;
    $("#btnToggleLayout").classList.toggle("primary", layoutMode);
    renderAll();
  });

  $("#btnExportData").addEventListener("click", () => downloadJSON("ficha_dados.json", data));

  $("#fileImportData").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    try{
      data = (await readJSONFile(file)) || {};
      saveData();
      renderAll();
    }catch(err){
      alert("JSON inválido para dados.");
      console.error(err);
    }finally{
      e.target.value = "";
    }
  });

  $("#btnExportLayout").addEventListener("click", () => downloadJSON("ficha_layout.json", LAYOUT));

  $("#fileImportLayout").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    try{
      const obj = await readJSONFile(file);
      if(!obj?.pages?.length) throw new Error("layout sem pages");
      LAYOUT = obj;
      saveLayout(LAYOUT);
      renderAll();
    }catch(err){
      alert("JSON inválido para layout.");
      console.error(err);
    }finally{
      e.target.value = "";
    }
  });

  $("#btnPrint").addEventListener("click", () => window.print());

  $("#btnReset").addEventListener("click", () => {
    const ok = confirm("Resetar dados e layout salvos no navegador?");
    if(!ok) return;
    localStorage.removeItem(STORAGE_DATA_KEY);
    localStorage.removeItem(STORAGE_LAYOUT_KEY);
    loadData();
    LAYOUT = loadLayout();
    renderAll();
  });
}

(function init(){
  loadData();
  LAYOUT = loadLayout();
  renderAll();
  wireUI();
})();