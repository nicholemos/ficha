// --- DADOS E CONFIGURAÇÕES ---
const attrs = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];

// Perícias que só funcionam se treinadas (retornam 0 se não treinado)
const TRAINED_ONLY_SKILLS = ['Adestramento', 'Conhecimento', 'Guerra', 'Jogatina', 'Ladinagem', 'Misticismo', 'Nobreza', 'Pilotagem', 'Religião'];

// Tabela de XP por nível (T20)
const XP_TABLE = [0, 1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000, 55000, 66000, 78000, 91000, 105000, 120000, 136000, 153000, 171000, 190000];

const defaultSkills = [
    { n: 'Acrobacia', a: 'DES' }, { n: 'Adestramento', a: 'CAR' }, { n: 'Atletismo', a: 'FOR' },
    { n: 'Atuação', a: 'CAR' }, { n: 'Cavalgar', a: 'DES' }, { n: 'Conhecimento', a: 'INT' },
    { n: 'Cura', a: 'SAB' }, { n: 'Diplomacia', a: 'CAR' }, { n: 'Enganação', a: 'CAR' },
    { n: 'Fortitude', a: 'CON' }, { n: 'Furtividade', a: 'DES' }, { n: 'Guerra', a: 'INT' },
    { n: 'Iniciativa', a: 'DES' }, { n: 'Intimidação', a: 'CAR' }, { n: 'Intuição', a: 'SAB' },
    { n: 'Investigação', a: 'INT' }, { n: 'Jogatina', a: 'CAR' }, { n: 'Ladinagem', a: 'DES' },{ n: 'Luta', a: 'FOR' },
    { n: 'Misticismo', a: 'INT' }, { n: 'Nobreza', a: 'INT' },
    { n: 'Ofício', a: 'INT' }, { n: 'Ofício', a: 'INT' }, { n: 'Percepção', a: 'SAB' }, { n: 'Pilotagem', a: 'DES' },{ n: 'Pontaria', a: 'DES' },
    { n: 'Reflexos', a: 'DES' }, { n: 'Religião', a: 'SAB' },
    { n: 'Sobrevivência', a: 'SAB' }, { n: 'Vontade', a: 'SAB' }
];

const spellCosts = { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15 };
let currentSkills = [];
let currentLoadBonus = 0; // Bônus manual para a carga
let currentArmorLoadBonus = 0; // Bônus de slots da armadura
let isLoading = false;    // Flag para suprimir saveData() durante o carregamento inicial

const CONDICOES_T20 = {
    "abalado": { nome: "Abalado", pericias: -2, desc: "-2 em testes de perícia. Medo." },
    "agarrado": { nome: "Agarrado", ataque: -2, defesa: -5, desc: "Desprevenido e imóvel, -2 em ataque. Só armas leves." },
    "alquebrado": { nome: "Alquebrado", desc: "Custo de PM de habilidades aumenta em +1. Mental." },
    "apavorado": { nome: "Apavorado", pericias: -5, desc: "–5 em perícias e não pode se aproximar da fonte. Medo." },
    "atordoado": { nome: "Atordoado", defesa: -5, desc: "Desprevenido e não pode fazer ações. Mental." },
    "caido": { nome: "Caído", ataque: -5, defesa: -5, desc: "–5 em ataques corpo a corpo e Defesa. +5 Defesa contra distância." },
    "cego": { nome: "Cego", defesa: -5, pericias: -5, Reflexos: -2, desc: "Desprevenido, lento e –5 em perícias de FOR/DES. Sentidos." },
    "confuso": { nome: "Confuso", desc: "Comporta-se de modo aleatório (1d6). Mental." },
    "debilitado": { nome: "Debilitado", pericias: -5, desc: "–5 em testes de atributos físicos (FOR, DES, CON) e perícias relacionadas." },
    "desprevenido": { nome: "Desprevenido", defesa: -5, Reflexos: -5, desc: "–5 na Defesa e Reflexos." },
    "doente": { nome: "Doente", desc: "Sob efeito de uma doença. Metabolismo." },
    "em_chamas": { nome: "Em Chamas", desc: "Sofre 1d6 de fogo no início do turno." },
    "enfeitiçado": { nome: "Enfeitiçado", desc: "+10 em Diplomacia para a fonte contra o alvo. Mental." },
    "enjoado": { nome: "Enjoado", desc: "Só pode fazer 1 ação padrão OU movimento. Metabolismo." },
    "enredado": { nome: "Enredado", ataque: -2, defesa: -2, Reflexos: -2, desc: "Lento e vulnerável. Movimento." },
    "envenenado": { nome: "Envenenado", desc: "Efeito varia conforme o veneno. Veneno." },
    "esmorecido": { nome: "Esmorecido", pericias: -5, desc: "–5 em testes de atributos mentais (INT, SAB, CAR) e perícias relacionadas. Mental." },
    "exausto": { nome: "Exausto", pericias: -5, defesa: -2, ataque: -2, desc: "Debilitado, lento e vulnerável. Cansaço." },
    "fascinado": { nome: "Fascinado", pericias: -5, desc: "–5 em Percepção e não pode fazer ações. Mental." },
    "fatigado": { nome: "Fatigado", ataque: -2, defesa: -2, pericias: -2, desc: "Fraco e vulnerável. Cansaço." },
    "fraco": { nome: "Fraco", pericias: -2, desc: "–2 em testes de atributos físicos (FOR, DES, CON) e perícias relacionadas." },
    "frustrado": { nome: "Frustrado", pericias: -2, desc: "–2 em testes de atributos mentais (INT, SAB, CAR) e perícias relacionadas. Mental." },
    "imovel": { nome: "Imóvel", desc: "Deslocamento reduzido a 0m. Movimento." },
    "inconsciente": { nome: "Inconsciente", defesa: -10, Reflexos: -99, desc: "Indefeso e não pode fazer ações." },
    "indefeso": { nome: "Indefeso", defesa: -15, Reflexos: -99, desc: "Desprevenido e –10 na Defesa. Falha em Reflexos." },
    "lento": { nome: "Lento", Reflexos: -2, desc: "Deslocamento à metade, não pode correr/investir. Movimento." },
    "ofuscado": { nome: "Ofuscado", ataque: -2, pericias: -2, desc: "–2 em testes de ataque e Percepção. Sentidos." },
    "paralisado": { nome: "Paralisado", defesa: -15, Reflexos: -99, desc: "Imóvel e indefeso. Movimento." },
    "pasmo": { nome: "Pasmo", desc: "Não pode fazer ações. Mental." },
    "petrificacao": { nome: "Petrificação", desc: "Inconsciente com RD 8. Metamorfose." },
    "sangrando": { nome: "Sangrando", desc: "Teste de CON (CD 15) ou perde 1d6 PV. Metabolismo." },
    "surdo": { nome: "Surdo", pericias: -5, desc: "Falha em Percepção (ouvir), –5 em Iniciativa. Sentidos." },
    "surpreendido": { nome: "Surpreendido", defesa: -5, desc: "Desprevenido e não pode fazer ações." },
    "vulneravel": { nome: "Vulnerável", defesa: -2, desc: "–2 na Defesa." }
};

// --- INICIALIZAÇÃO ---
window.onload = () => {
    try {
        currentSkills = JSON.parse(JSON.stringify(defaultSkills));
        renderStructure();
        renderCondicoes(); // <--- ADICIONE ESTA LINHA AQUI
        loadData();
        attachGlobalListeners();
        enableDragAndDrop();
    } catch (e) { console.error(e); }

    setTimeout(updateCalculations, 100);
    setTimeout(checkImportedPowers, 400);
    // Verifica fila da loja via storage event (mesmo mecanismo usado entre abas)
    setTimeout(() => {
        const queue = localStorage.getItem('t20_sheet_queue');
        if (queue && JSON.parse(queue).length > 0) {
            window.dispatchEvent(new StorageEvent('storage', { key: 't20_sheet_queue', newValue: queue }));
        }
    }, 600);
};

function renderStructure() {
    const attrContainer = document.getElementById('attributesArea');
    const attrImages = { 'FOR': 'imagens/forca.png', 'DES': 'imagens/destreza.png', 'CON': 'imagens/constituicao.png', 'INT': 'imagens/inteligencia.png', 'SAB': 'imagens/sabedoria.png', 'CAR': 'imagens/carisma.png' };

    if (attrContainer) {
        attrContainer.innerHTML = attrs.map(a => {
            const bgImage = attrImages[a] ? `url('${attrImages[a]}')` : 'none';
            return `
            <div class="col-2">
                <div class="d-flex flex-column align-items-center attr-wrapper" id="wrap-${a}">
                    <button class="attr-btn-float attr-btn-up" onclick="updateAttr('${a}', 1)">+</button>
                    <div class="attr-token" style="background-image: ${bgImage};" onclick="toggleAttrButtons('${a}')">
                        <input type="number" inputmode="numeric" class="attr-val attr-input-overlay form-control" id="attr-${a}" value="0" min="-5">
                    </div>
                    <button class="attr-btn-float attr-btn-down" onclick="updateAttr('${a}', -1)">-</button>
                    <div class="attr-footer-label">${a}</div>
                </div>
            </div>`;
        }).join('');
    }
    renderSkills();
}

function renderCondicoes() {
    const grid = document.getElementById('condicoes-grid');
    if (!grid) return;

    grid.innerHTML = Object.keys(CONDICOES_T20).map(key => {
        const c = CONDICOES_T20[key];
        return `
        <div class="col-6 col-md-4 col-lg-3">
        <div class="form-check h-100 border rounded p-1 ps-4 hover-bg-light shadow-sm bg-white">
            <input class="form-check-input cond-check" type="checkbox" value="${key}" id="cond-${key}" onchange="updateCalculations(); saveData()">
            <label class="form-check-label d-block" for="cond-${key}" title="${c.desc}" style="cursor:pointer; font-size:0.7rem; line-height: 1.1;">
                ${c.nome}
            </label>
        </div>
    </div>`;
    }).join('');
}

// Novas Funções de Atributo
function toggleAttrButtons(attr) {
    const wrapper = document.getElementById(`wrap-${attr}`);
    // Fecha outros
    document.querySelectorAll('.attr-wrapper.active').forEach(el => {
        if (el !== wrapper) el.classList.remove('active');
    });
    wrapper.classList.toggle('active');
}

function updateAttr(attr, delta) {
    const input = document.getElementById(`attr-${attr}`);
    let val = parseInt(input.value) || 0;
    val += delta;
    if (val < -5) val = -5;
    input.value = val;
    updateCalculations();
    saveData();
}

// --- RENDERIZAÇÃO DE PERÍCIAS (COM BOTÕES FLUTUANTES) ---
function renderSkills() {
    const skillsContainer = document.getElementById('skillsList');
    if (!skillsContainer) return;

    skillsContainer.innerHTML = currentSkills.map((s, i) => {
        const attrOptions = attrs.map(a => `<option value="${a}" ${s.a === a ? 'selected' : ''}>${a}</option>`).join('');
        const isDefault = defaultSkills.some(ds => ds.n === s.n && !s.isCustom);

        const isTrainedOnly = TRAINED_ONLY_SKILLS.includes(s.n);
        const skillLabel = isDefault
            ? `${s.n}${isTrainedOnly ? '<span class="text-danger" title="Somente treinada">*</span>' : ''}`
            : s.n;

        const isOficio = isDefault && s.n === 'Ofício';
        const nameDisplay = isOficio
            ? `<div class="d-flex align-items-center gap-1" style="overflow:hidden;">
                 <span class="fw-bold" style="font-size:0.9em; white-space:nowrap;">Ofício</span>
                 <input type="text" class="form-control form-control-sm p-0 border-0 bg-transparent oficio-specialty"
                        data-skill-idx="${i}"
                        style="font-size:0.8em; min-width:0; width:100%; color:#555;"
                        value="${s.specialty || ''}"
                        placeholder="(tipo)"
                        oninput="updateSkillSpecialty(${i}, this.value)"
                        title="Ex: Metalurgia, Culinária...">
               </div>`
            : isDefault
                ? `<span class="fw-bold text-truncate d-block" title="${s.n}${isTrainedOnly ? ' (somente treinada)' : ''}" style="font-size:0.9em; padding-top:2px;">${skillLabel}</span>`
                : `<input type="text" class="form-control form-control-sm p-0 fw-bold border-0 bg-transparent" value="${s.n}" onchange="updateSkillName(${i}, this.value)" placeholder="Nome">`;

        const deleteBtn = !isDefault
            ? `<i class="bi bi-x text-danger" style="cursor:pointer; margin-left:2px;" onclick="deleteSkill(${i})" title="Remover"></i>`
            : ``;

        return `
        <div class="row g-0 align-items-center skill-row py-1 border-bottom">
            <div class="col-1 text-center"><input class="form-check-input border-dark" type="checkbox" id="skTrain${i}" ${s.trained ? 'checked' : ''}></div>
            
            <div class="col-1 text-center"><i class="bi bi-dice-20-fill dice-roller text-secondary" onclick="rollSkill(${i})" title="Rolar"></i></div>

            <div class="col-4 ps-1 d-flex align-items-center">
                <div style="flex: 1; overflow: hidden;">${nameDisplay}</div>
                <select class="border-0 bg-transparent text-muted fw-bold ms-1 p-0" style="font-size: 0.65em; width: 35px; cursor:pointer;" onchange="updateSkillAttr(${i}, this.value)">${attrOptions}</select>
                ${deleteBtn}
            </div>
            
            <div class="col-2 text-center fw-bold text-danger fs-6" id="skTotal${i}">0</div>
            
            <div class="col-1 text-center text-muted small" id="skHalfLevel${i}">0</div>
            <div class="col-1 text-center text-muted small" id="skAttrVal${i}">0</div>
            <div class="col-1 text-center text-muted small" id="skTrainVal${i}">0</div>
            
            <div class="col-1 px-1 position-relative skill-wrapper" id="wrap-skill-${i}">
                <button class="attr-btn-float attr-btn-up skill-btn-mini" onclick="updateSkillOther(${i}, 1)">+</button>
                
                <input type="number" inputmode="numeric" class="form-control form-control-sm p-0 text-center" id="skOther${i}" placeholder="0" value="${s.other || ''}" onclick="toggleSkillButtons(${i})">
                
                <button class="attr-btn-float attr-btn-down skill-btn-mini" onclick="updateSkillOther(${i}, -1)">-</button>
            </div>
        </div>`;
    }).join('');

    attachGlobalListeners();
}

// --- NOVAS FUNÇÕES PARA BOTÕES DE PERÍCIA ---

function toggleSkillButtons(index) {
    const wrapper = document.getElementById(`wrap-skill-${index}`);

    // Fecha outros abertos (atributos ou perícias)
    document.querySelectorAll('.attr-wrapper.active, .skill-wrapper.active').forEach(el => {
        if (el !== wrapper) el.classList.remove('active');
    });

    wrapper.classList.toggle('active');
}

function updateSkillOther(index, delta) {
    const input = document.getElementById(`skOther${index}`);
    let val = parseInt(input.value) || 0;
    val += delta;

    // Aqui permitimos negativo sem limite (penalidades existem!)
    input.value = val;

    // Atualiza no objeto state global para salvar corretamente
    if (currentSkills[index]) currentSkills[index].other = val;

    updateCalculations();
    saveData();
}

// --- GERENCIAMENTO DE PERÍCIAS ---
function addSkill() { currentSkills.push({ n: 'Nova Perícia', a: 'INT', trained: false, other: 0, isCustom: true }); renderSkills(); saveData(); }
function deleteSkill(index) { if (confirm("Remover perícia?")) { currentSkills.splice(index, 1); renderSkills(); saveData(); } }
function updateSkillAttr(index, newAttr) { currentSkills[index].a = newAttr; updateCalculations(); saveData(); }
function updateSkillName(index, newName) { currentSkills[index].n = newName; saveData(); updateCalculations(); }
function updateSkillSpecialty(index, value) { if (currentSkills[index]) currentSkills[index].specialty = value; saveData(); }

// --- ROLAGEM ---
function roll20() { return Math.floor(Math.random() * 20) + 1; }
function showToast(title, result, total, isCrit = false, type = 'normal') {
    const toastEl = document.getElementById('rollToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');
    const toastHeader = document.getElementById('toastHeader');
    toastHeader.className = 'toast-header text-white';
    if (isCrit) toastHeader.classList.add('bg-critical');
    else if (type === 'skill') toastHeader.classList.add('bg-skill');
    else toastHeader.classList.add('bg-attack');
    toastTitle.innerText = title;
    toastBody.innerHTML = `<div class="display-4 fw-bold">${total}</div><div class="small opacity-75">Dado: <strong>${result}</strong> ${result === 20 ? '★' : ''}</div>${isCrit ? '<div class="fw-bold text-warning mt-1">CRÍTICO!</div>' : ''}`;
    const toast = new bootstrap.Toast(toastEl); toast.show();
}
function rollAttack(btn) {
    const row = btn.closest('.atk-row');
    const name = row.querySelector('.inp-name').value || "Ataque";
    const bonus = parseInt(row.querySelector('.inp-bonus').value) || 0;
    const critRange = parseInt(row.querySelector('.inp-crit-range').value) || 20;
    const roll = roll20();
    const total = roll + bonus;
    const isCrit = roll >= critRange;
    showToast(`⚔️ ${name}`, roll, total, isCrit, 'attack');
}
function rollSkill(index) {
    const skill = currentSkills[index];
    const total = parseInt(document.getElementById(`skTotal${index}`).innerText) || 0;
    const roll = roll20();
    showToast(`🎲 ${skill.n}`, roll, roll + total, false, 'skill');
}

function attachGlobalListeners() {
    document.body.oninput = (e) => { if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) { updateCalculations(); if (e.target.id !== 'charImgInput') saveData(); } };
    document.body.onchange = (e) => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') { updateCalculations(); saveData(); } };
}
function toggleDetail(btn) { const row = btn.closest('.atk-row') || btn.closest('.def-row') || btn.closest('.ability-row') || btn.closest('.spell-row'); if (!row) return; const details = row.querySelector('.atk-details') || row.querySelector('.def-details') || row.querySelector('.ability-details') || row.querySelector('.spell-details'); const icon = btn.querySelector('i'); if (details.classList.contains('d-none')) { details.classList.remove('d-none'); icon.classList.replace('bi-chevron-down', 'bi-chevron-up'); } else { details.classList.add('d-none'); icon.classList.replace('bi-chevron-up', 'bi-chevron-down'); } }
function toggleFixedDetail(id) { const el = document.getElementById(id); if (el) el.classList.toggle('d-none'); }

// --- COLAPSAR/EXPANDIR SEÇÕES ---
function toggleSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.classList.toggle('collapsed');
}

function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function getInt(id) { const v = parseInt(getVal(id)); return isNaN(v) ? 0 : v; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.innerText = val; }

function addAttack(data = null) {
    const container = document.getElementById('attacksList'); if (!container) return;
    const div = document.createElement('div'); div.className = 'border-bottom pb-2 mb-2 atk-row';
    // ... (logica de skills options igual) ...
    const mainSkills = ['Luta', 'Pontaria', 'Atuação', 'Misticismo'];
    let skillOptions = `<option value="">(Manual)</option>`;
    mainSkills.forEach(sn => skillOptions += `<option value="${sn}" ${data && data.skill === sn ? 'selected' : ''}>${sn}</option>`);

    div.innerHTML = `
        <div class="row g-1 align-items-center text-center atk-summary mb-2">
            <div class="col-1 d-flex align-items-center justify-content-center">
                <i class="bi bi-grip-vertical drag-handle me-1"></i>
                <i class="bi bi-sword fs-5 dice-roller text-danger" onclick="rollAttack(this)" title="Rolar"></i>
            </div>
            <div class="col-4"><input type="text" class="form-control form-control-sm inp-name text-start" placeholder="Ataque" value="${data ? data.name : ''}"></div>
            <div class="col-2"><input type="number" inputmode="numeric" class="form-control form-control-sm inp-bonus fw-bold" placeholder="+0" value="${data ? data.bonus : ''}"></div>
            <div class="col-2"><input type="text" class="form-control form-control-sm inp-dmg" placeholder="1d6" value="${data ? data.dmg : ''}"></div>
            <div class="col-1"><input type="number" inputmode="numeric" class="form-control form-control-sm text-center inp-crit-range p-0" placeholder="20" value="${data ? (data.critRange || '20') : '20'}"></div>
            <div class="col-1"><input type="text" class="form-control form-control-sm text-center inp-crit p-0" placeholder="x2" value="${data ? data.crit : 'x2'}"></div>
            <div class="col-1"><button class="btn btn-sm btn-outline-dark border-0 w-100 p-0" onclick="toggleDetail(this)"><i class="bi bi-chevron-down"></i></button></div>
        </div>
        <div class="atk-details p-2 rounded d-none">
            <div class="row g-2 mb-2">
                <div class="col-4"><label class="form-label-sm">PERÍCIA</label><select class="form-select form-select-sm border-0 border-bottom p-0 inp-atk-skill" onchange="updateCalculations()">${skillOptions}</select></div>
                <div class="col-3"><label class="form-label-sm">BÔNUS ITEM</label><input type="number" inputmode="numeric" class="form-control form-control-sm border-0 border-bottom p-0 text-center inp-atk-mod" placeholder="+0" value="${data ? data.mod : ''}" oninput="updateCalculations()"></div>
                <div class="col-3"><label class="form-label-sm">TIPO</label><input type="text" class="form-control form-control-sm text-center border-0 border-bottom inp-type" placeholder="Corte" value="${data ? data.type : ''}"></div>
                <div class="col-2"><label class="form-label-sm">ALCANCE</label><input type="text" class="form-control form-control-sm text-center border-0 border-bottom inp-range" placeholder="Curto" value="${data ? data.range : ''}"></div>
            </div>
            <div class="row g-2">
                <div class="col-10"><label class="form-label-sm">NOTAS</label><textarea class="form-control form-control-sm border-0 border-bottom inp-desc" rows="2" placeholder="Detalhes, efeitos, habilidades especiais...">${data ? (data.desc || '') : ''}</textarea></div>
                <div class="col-2 d-flex align-items-end"><button class="btn btn-sm btn-danger w-100 py-0" onclick="removeAttack(this)"><i class="bi bi-trash"></i></button></div>
            </div>
        </div>`;
    container.appendChild(div); if (!data) saveData();
}

function removeAttack(btn) { if (confirm('Remover ataque?')) { btn.closest('.atk-row').remove(); saveData(); } }

function addDefenseItem(data = null) {
    const container = document.getElementById('defenseList'); if (!container) return;
    const div = document.createElement('div'); div.className = 'border-bottom pb-2 mb-2 def-row';
    const hasNote = data && data.note && data.note.trim();
    div.innerHTML = `
        <div class="row g-1 align-items-center text-center def-summary">
            <div class="col-1 fs-5 d-flex align-items-center justify-content-center">
                <i class="bi bi-grip-vertical drag-handle me-1" style="font-size: 0.8rem;"></i>
                <i class="bi bi-magic"></i>
            </div>
            <div class="col-4"><input type="text" class="form-control form-control-sm inp-name text-start" placeholder="Item Extra" value="${data ? data.name : ''}"></div>
            <div class="col-2"><input type="number" inputmode="numeric" class="form-control form-control-sm inp-bonus fw-bold text-success" placeholder="+0" value="${data ? data.bonus : ''}" oninput="updateCalculations()"></div>
            <div class="col-2"></div>
            <div class="col-3 d-flex gap-1 justify-content-center">
                <button class="btn btn-sm border-0 item-note-btn ${hasNote ? 'text-warning' : 'btn-outline-secondary'}" onclick="toggleItemNote(this)" title="Anotação"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-sm btn-outline-danger border-0" onclick="removeDefenseItem(this)"><i class="bi bi-trash"></i></button>
            </div>
        </div>
        <div class="item-note-area ${hasNote ? '' : 'd-none'} mt-1 px-1">
            <textarea class="form-control form-control-sm inp-note" rows="2" placeholder="Anotação sobre este item..." oninput="saveData()">${data && data.note ? data.note : ''}</textarea>
        </div>`;
    container.appendChild(div); if (!data) saveData();
}
function removeDefenseItem(btn) { if (confirm('Remover item?')) { btn.closest('.def-row').remove(); updateCalculations(); saveData(); } }
function checkHeavyArmor() { if (getVal('armorType') === 'heavy') { const chk = document.getElementById('applyDefAttr'); if (chk) chk.checked = false; } updateCalculations(); }

function addInventoryItem(data = null) {
    const container = document.getElementById('inventoryList'); if (!container) return;
    const div = document.createElement('div'); div.className = 'mb-2 inv-row border-bottom pb-1';
    const hasNote = data?.note?.trim();
    const hasCombat  = !!(data?.combatData);
    const hasDefense = !!(data?.defenseData);
    const isImported = hasCombat || hasDefense;
    if (data?.combatData)  div.dataset.combat  = JSON.stringify(data.combatData);
    if (data?.defenseData) div.dataset.defense = JSON.stringify(data.defenseData);

    const noteBtnIcon  = isImported ? 'bi-box-arrow-in-down' : 'bi-pencil-square';
    const noteBtnClass = isImported ? 'text-primary' : (hasNote ? 'text-warning' : 'btn-outline-secondary');
    const noteBtnTitle = isImported ? 'Item importado da loja' : 'Anotação';

    // Decide label do botão de defesa baseado no tipo
    const defLabel = data?.defenseData?.tipo?.toLowerCase().includes('escudo') ? 'Escudo' : 'Armadura';

    div.innerHTML = `
        <div class="row g-1 align-items-center">
            <div class="col-1 text-center"><i class="bi bi-grip-vertical drag-handle"></i></div>
            <div class="col-4"><input type="text" class="form-control form-control-sm fw-bold inp-name" placeholder="Item" value="${data ? data.name : ''}"></div>
            <div class="col-2"><input type="number" inputmode="numeric" class="form-control form-control-sm text-center inp-qtd" placeholder="1" value="${data ? data.qtd : '1'}" oninput="updateCalculations()"></div>
            <div class="col-2"><input type="number" inputmode="numeric" class="form-control form-control-sm text-center inp-slots" placeholder="0" value="${data ? data.slots : '0'}" step="0.5" oninput="updateCalculations()"></div>
            <div class="col-3 text-center d-flex gap-1 justify-content-center">
                <button class="btn btn-sm border-0 item-note-btn ${noteBtnClass}" onclick="toggleItemNote(this)" title="${noteBtnTitle}"><i class="bi ${noteBtnIcon}"></i></button>
                <button class="btn btn-sm btn-outline-danger border-0" onclick="removeInventoryItem(this)"><i class="bi bi-trash"></i></button>
            </div>
        </div>
        <div class="item-note-area ${hasNote || isImported ? '' : 'd-none'} mt-1 px-1">
            ${hasCombat ? `<div class="d-flex align-items-center gap-2 mb-1 p-1 rounded" style="background:#eef4ff;border-left:3px solid #0d6efd;font-size:0.78rem;">
                <span class="text-muted"><i class="bi bi-sword me-1"></i><strong>${data.combatData.dano}</strong> · crít ${data.combatData.critico} · ${data.combatData.tipo_dano||'—'}</span>
                <button class="btn btn-sm btn-primary py-0 ms-auto" style="font-size:0.75rem;" onclick="pullToAttack(this)"><i class="bi bi-arrow-right-circle"></i> Ataques</button>
            </div>` : ''}
            ${hasDefense ? `<div class="d-flex align-items-center gap-2 mb-1 p-1 rounded" style="background:#efffef;border-left:3px solid #198754;font-size:0.78rem;">
                <span class="text-muted"><i class="bi bi-shield-check me-1"></i>Defesa <strong>${data.defenseData.bonus}</strong> · Pen. ${data.defenseData.penalidade||'0'}</span>
                <button class="btn btn-sm btn-success py-0 ms-auto" style="font-size:0.75rem;" onclick="pullToDefense(this)"><i class="bi bi-arrow-right-circle"></i> ${defLabel}</button>
            </div>` : ''}
            <textarea class="form-control form-control-sm inp-note" rows="2" placeholder="Anotação sobre este item..." oninput="saveData()">${data?.note || ''}</textarea>
        </div>`;
    container.appendChild(div); if (!data) saveData();
}
function removeInventoryItem(btn) { if (confirm('Remover item?')) { btn.closest('.inv-row').remove(); updateCalculations(); saveData(); } }

function toggleItemNote(btn) {
    const row = btn.closest('.inv-row') || btn.closest('.def-row');
    if (!row) return;
    const noteArea = row.querySelector('.item-note-area');
    if (!noteArea) return;
    const isNowHidden = noteArea.classList.toggle('d-none');
    const hasContent = !!row.querySelector('.inp-note')?.value?.trim();
    const active = !isNowHidden || hasContent;
    btn.classList.toggle('text-warning', active && !row.dataset.combat && !row.dataset.defense);
    btn.classList.toggle('btn-outline-secondary', !active && !row.dataset.combat && !row.dataset.defense);
    if (!isNowHidden) row.querySelector('.inp-note')?.focus();
}


// Processa um item da fila: adiciona SOMENTE ao inventário
// (push para Ataques/Defesa fica a cargo dos botões manuais)
function processShopItem(item) {
    addInventoryItem(item);
}

// Importa tudo da fila ao carregar a ficha
function importFromShop(silent = false) {
    const queue = JSON.parse(localStorage.getItem('t20_sheet_queue') || '[]');
    if (queue.length === 0) {
        if (!silent) alert('Nenhum item pendente.\n\nAdicione itens na loja — eles aparecem aqui automaticamente!');
        return 0;
    }
    queue.forEach(item => processShopItem(item));
    localStorage.removeItem('t20_sheet_queue');
    saveData();
    return queue.length;
}

// Escuta mudanças no localStorage (dispara em outras abas quando a loja adiciona itens)
window.addEventListener('storage', (e) => {
    if (e.key === 't20_sheet_queue' && e.newValue) {
        try {
            const queue = JSON.parse(e.newValue);
            if (queue.length === 0) return;
            queue.forEach(item => processShopItem(item));
            localStorage.removeItem('t20_sheet_queue');
            saveData();
            showSheetToast(`📥 ${queue.length} item(s) recebido(s) da loja!`);
        } catch(err) { console.error('Erro ao importar da loja:', err); }
    }
});

// ── Botão "→ Ataques" ──────────────────────────────────────────────────
// Converte o campo "critico" do banco (ex: "19", "x3", "19/x3") em {critRange, crit}
function parseCritico(critico) {
    if (!critico || critico === '—') return { critRange: '20', crit: 'x2' };
    const parts = String(critico).trim().split('/');
    let critRange = '20', crit = 'x2';
    for (const part of parts) {
        const t = part.trim();
        if (/^\d+$/.test(t)) critRange = t;
        else if (/^x\d+$/i.test(t)) crit = t.toLowerCase();
    }
    return { critRange, crit };
}

function pullToAttack(btn) {
    const row = btn.closest('.inv-row');
    if (!row?.dataset.combat) return;
    const cd = JSON.parse(row.dataset.combat);
    const { critRange, crit } = parseCritico(cd.critico);
    addAttack({ name: cd.nome, bonus: '', dmg: cd.dano || '', critRange, crit, type: cd.tipo_dano || '', range: cd.alcance || '', desc: '' });
    saveData();
    btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Adicionado!';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = '<i class="bi bi-arrow-right-circle"></i> Ataques'; btn.disabled = false; }, 3000);
    document.getElementById('attacksList')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Botão "→ Defesa" — preenche Armadura ou Escudo ────────────────────
function pullToDefense(btn) {
    const row = btn.closest('.inv-row');
    if (!row?.dataset.defense) return;
    const dd = JSON.parse(row.dataset.defense);

    // Penalidade: tira sinais/traços e usa número positivo
    const penAbs = Math.abs(parseInt(String(dd.penalidade).replace(/[^0-9]/g, '')) || 0);
    // Bônus: extrai número (pode vir como "+10" ou "10")
    const bonusNum = parseInt(String(dd.bonus).replace(/[^0-9]/g, '')) || 0;

    const isShield = String(dd.tipo).toLowerCase().includes('escudo');

    if (isShield) {
        const nameEl   = document.getElementById('shieldName');
        const bonusEl  = document.getElementById('shieldBonus');
        const penEl    = document.getElementById('shieldPenalty');
        if (nameEl)  nameEl.value  = dd.nome;
        if (bonusEl) bonusEl.value = bonusNum;
        if (penEl)   penEl.value   = penAbs;
    } else {
        const nameEl   = document.getElementById('armorName');
        const bonusEl  = document.getElementById('armorBonus');
        const penEl    = document.getElementById('armorPenalty');
        if (nameEl)  nameEl.value  = dd.nome;
        if (bonusEl) bonusEl.value = bonusNum;
        if (penEl)   penEl.value   = penAbs;
    }

    updateCalculations();
    saveData();
    btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Aplicado!';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = '<i class="bi bi-arrow-right-circle"></i> ' + (isShield ? 'Escudo' : 'Armadura'); btn.disabled = false; }, 3000);
    document.getElementById('armorName')?.closest('section, .card, [class*="card"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSheetToast(html) {
    let container = document.getElementById('sheet-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sheet-toast-container';
        container.style.cssText = 'position:fixed;bottom:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.4rem;';
        document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.style.cssText = 'background:#1a1a2e;color:#fff;padding:0.5rem 1rem;border-radius:8px;font-size:0.85rem;display:flex;align-items:center;gap:0.5rem;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:toastIn 0.25s ease;';
    t.innerHTML = html;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// CSS do toast
const _toastStyle = document.createElement('style');
_toastStyle.textContent = `@keyframes toastIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`;
document.head.appendChild(_toastStyle);

function addAbility(targetId = 'abilitiesClassList', name = '', desc = '') {
    const list = document.getElementById(targetId);
    if (!list) return;

    const div = document.createElement('div');
    div.className = 'ability-row list-group-item bg-light p-2 mb-2 border rounded shadow-sm';

    // Layout: grip (drag) | chevron | input (flexível) | botão lixeira
    // Sem data-bs-toggle no input — evita conflito de toque no mobile
    div.innerHTML = `
        <div style="display:flex; align-items:center; gap:6px;">
            <span class="ability-drag-handle text-secondary" style="cursor:grab; flex-shrink:0; padding:4px; font-size:1rem; line-height:1; touch-action:none;">
                <i class="bi bi-grip-vertical"></i>
            </span>
            <span class="ability-chevron text-danger" style="cursor:pointer; flex-shrink:0; padding:6px; font-size:1rem; line-height:1;">
                <i class="bi bi-chevron-right collapse-icon"></i>
            </span>
            <input type="text"
                   class="form-control form-control-sm fw-bold border-0 bg-transparent inp-name"
                   placeholder="Nome da Habilidade"
                   value="${name.replace(/"/g, '&quot;')}"
                   style="flex:1 1 auto; min-width:0;">
            <button type="button"
                    class="btn btn-outline-danger btn-sm border-0 ability-delete-btn"
                    style="flex-shrink:0; min-width:34px; min-height:34px; padding:4px 8px;">
                <i class="bi bi-trash"></i>
            </button>
        </div>
        <div class="ability-body d-none mt-2">
            <textarea class="form-control form-control-sm inp-desc border-danger-subtle"
                      rows="3" placeholder="Descrição detalhada...">${desc}</textarea>
        </div>
    `;

    const chevron = div.querySelector('.ability-chevron');
    const icon = div.querySelector('.collapse-icon');
    const body = div.querySelector('.ability-body');
    const deleteBtn = div.querySelector('.ability-delete-btn');

    // --- Toggle (apenas pelo chevron, sem tocar no input) ---
    chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        const hidden = body.classList.toggle('d-none');
        icon.classList.toggle('bi-chevron-right', hidden);
        icon.classList.toggle('bi-chevron-down', !hidden);
        div.classList.toggle('border-danger', !hidden);
    });

    // --- Excluir (click normal — funciona em desktop e mobile) ---
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Excluir poder?')) {
            div.remove();
            saveData();
        }
    });

    // --- Salvar ao editar ---
    div.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', saveData);
    });

    list.appendChild(div);
    if (!isLoading) saveData();
}

function removeAbility(btn) { if (confirm('Excluir poder?')) { btn.closest('.ability-row').remove(); saveData(); } }

function addSpell(circle, data = null) {
    const container = document.getElementById(`spellsList${circle}`); if (!container) return;
    const div = document.createElement('div'); div.className = 'border-bottom pb-2 mb-2 spell-row';
    const defaultCost = spellCosts[circle]; const costValue = data ? data.pm : defaultCost;
    div.innerHTML = `
        <div class="row g-1 align-items-center text-center mb-2">
            <div class="col-1"><i class="bi bi-grip-vertical drag-handle"></i></div>
            <div class="col-8"><input type="text" class="form-control form-control-sm fw-bold inp-name text-start" placeholder="Nome da Magia" value="${data ? data.name : ''}"></div>
            <div class="col-2 position-relative"><input type="number" inputmode="numeric" class="form-control form-control-sm text-center inp-pm" placeholder="${defaultCost}" value="${costValue}"><span style="position: absolute; right: 5px; top: 20%; font-size: 0.6em; color: #6f42c1; font-weight:bold;">PM</span></div>
            <div class="col-1"><button class="btn btn-sm btn-light border text-primary w-100 p-0" onclick="toggleDetail(this)"><i class="bi bi-chevron-down"></i></button></div>
        </div>
        <div class="spell-details p-2 rounded d-none">
            <input type="hidden" class="inp-circle" value="${circle}">
            <div class="row g-2 mb-2">
                <div class="col-4"><label class="spell-label">ESCOLA</label><input type="text" class="form-control form-control-sm border-0 border-bottom p-0 inp-school" placeholder="Evocação" value="${data ? data.school : ''}"></div>
                <div class="col-4"><label class="spell-label">EXECUÇÃO</label><input type="text" class="form-control form-control-sm border-0 border-bottom p-0 inp-exec" placeholder="Padrão" value="${data ? data.exec : ''}"></div>
                <div class="col-4"><label class="spell-label">ALCANCE</label><input type="text" class="form-control form-control-sm border-0 border-bottom p-0 inp-range" placeholder="Curto" value="${data ? data.range : ''}"></div>
                <div class="col-4"><label class="spell-label">ALVO/ÁREA</label><input type="text" class="form-control form-control-sm border-0 border-bottom p-0 inp-target" placeholder="1 ser" value="${data ? data.target : ''}"></div>
                <div class="col-4"><label class="spell-label">DURAÇÃO</label><input type="text" class="form-control form-control-sm border-0 border-bottom p-0 inp-dur" placeholder="Inst." value="${data ? data.dur : ''}"></div>
                <div class="col-4"><label class="spell-label">RESISTÊNCIA</label><input type="text" class="form-control form-control-sm border-0 border-bottom p-0 inp-res" placeholder="Nenhuma" value="${data ? data.res : ''}"></div>
            </div>
            <label class="spell-label mt-2">DESCRIÇÃO</label><textarea class="form-control form-control-sm border-0 bg-transparent inp-desc" rows="3" placeholder="Efeito...">${data ? data.desc : ''}</textarea>
            <div class="text-end mt-2"><button class="btn btn-sm btn-danger py-0" onclick="removeSpell(this)">Excluir</button></div>
        </div>`;
    container.appendChild(div); if (!data) saveData();
}
function removeSpell(btn) { if (confirm('Remover magia?')) { btn.closest('.spell-row').remove(); saveData(); } }

// --- NOVAS FUNÇÕES DE CARGA ---
function changeLoadBonus(amount) {
    currentLoadBonus += amount;
    document.getElementById('loadBonusDisplay').innerText = currentLoadBonus > 0 ? `+${currentLoadBonus}` : currentLoadBonus;
    calcLoad(); // Recalcula o total
    saveData(); // Salva a alteração
}

function changeArmorLoadBonus(amount) {
    currentArmorLoadBonus += amount;
    const disp = document.getElementById('armorLoadBonusDisplay');
    if (disp) {
        // Mantém o sinal de + para positivos e mostra o - naturalmente para negativos
        disp.innerText = currentArmorLoadBonus > 0 ? `+${currentArmorLoadBonus}` : currentArmorLoadBonus;
    }

    calcLoad();
    saveData();
}

function calcLoad() {
    const selectedAttr = getVal('loadAttrSelect') || 'FOR';
    const attrVal = getInt(`attr-${selectedAttr}`);
    let baseLimit = 10;

    // Lógica de cálculo de carga: 10 + (Atributo * 2) se positivo, ou 10 + Atributo se negativo/zero
    if (attrVal > 0) {
        baseLimit += (attrVal * 2);
    } else {
        baseLimit += attrVal;
    }

    // Adiciona o bônus manual + bônus de armadura
    const totalSlots = baseLimit + currentLoadBonus + currentArmorLoadBonus;

    const currentSlots = Array.from(document.querySelectorAll('#inventoryList .inv-row .inp-slots')).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);

    setText('loadCurrent', currentSlots.toFixed(1));
    setText('loadLimit', totalSlots);
}
// --- FIM NOVAS FUNÇÕES DE CARGA ---


function updateCalculations() {
    let condAtq = 0, condDef = 0, condPer = 0, condRef = 0;

    document.querySelectorAll('.cond-check:checked').forEach(chk => {
        const efeito = CONDICOES_T20[chk.value];
        if (efeito.ataque) condAtq += efeito.ataque;
        if (efeito.defesa) condDef += efeito.defesa;
        if (efeito.pericias) condPer += efeito.pericias;
        if (efeito.Reflexos) condRef += efeito.Reflexos;
    });
    try {
        let level = getInt('charLevel');
        if (level < 1) level = 1; if (level > 20) level = 20;
        const halfLevel = Math.floor(level / 2);

        // --- CÁLCULO DE CARGA ---
        if (typeof calcLoad === 'function') calcLoad();

        const armorPen = getInt('armorPenalty'); const shieldPen = getInt('shieldPenalty');
        const totalPenalty = Math.abs(armorPen) + Math.abs(shieldPen);
        const penaltySkills = ['Acrobacia', 'Furtividade', 'Ladinagem'];
        const sizeVal = getInt('charSize');

        let trainBonus = 2; if (level >= 15) trainBonus = 6; else if (level >= 7) trainBonus = 4;

        const skillValues = {};

        currentSkills.forEach((s, i) => {
            const baseAttr = getInt(`attr-${s.a}`);
            const tempAttr = getInt(`mod-attr-${s.a}`); // NOVO: Atributo temporário
            const attrVal = baseAttr + tempAttr;
            const check = document.getElementById(`skTrain${i}`); if (check) s.trained = check.checked;
            const trained = s.trained ? trainBonus : 0;

            // --- CORREÇÃO AQUI ---
            const other = getInt(`skOther${i}`);
            s.other = other; // Salva o valor no objeto global
            // ---------------------

            // Perícias somente treinadas: se não treinar, total = 0
            const isTrainedOnly = TRAINED_ONLY_SKILLS.includes(s.n);
            let total;
            if (isTrainedOnly && !s.trained) {
                total = 0;
            } else {
                total = halfLevel + attrVal + trained + other + condPer;
                if (s.n === 'Reflexos') total += condRef;
                // Penalidade de Armadura/Escudo
                if (penaltySkills.includes(s.n)) {
                    total -= totalPenalty;
                }
                // Penalidade de Tamanho (Furtividade)
                if (s.n === 'Furtividade') {
                    total += sizeVal;
                }
            }

            // ── MODIFICADORES TEMPORÁRIOS ──────────────────────
            if (total !== 0 || s.trained) { // só aplica se a perícia é funcional
                const modPericias = getTempMod('mod-pericias');
                const modRolagens = getTempMod('mod-rolagens');
                const SKIP_PERICIAS = ['Luta', 'Pontaria'];
                if (!SKIP_PERICIAS.includes(s.n)) {
                    total += modPericias + modRolagens;
                }
                // Bônus em perícia específica
                document.querySelectorAll('#mod-pericias-list .mod-pericia-row').forEach(row => {
                    const sel = row.querySelector('.mod-per-sel')?.value;
                    const val = parseInt(row.querySelector('.mod-per-val')?.value) || 0;
                    if (sel === s.n) total += val;
                });
            }
            // ───────────────────────────────────────────────────

            setText(`skHalfLevel${i}`, halfLevel);
            setText(`skAttrVal${i}`, attrVal);
            setText(`skTrainVal${i}`, trained);
            setText(`skTotal${i}`, total);
            skillValues[s.n] = total;
        });

        // --- DEFESA ---
        const defAttr = getVal('defAttrSelect');
        const defAttrVal = getInt(`attr-${defAttr}`) + getInt(`mod-attr-${defAttr}`);
        const applyDefAttr = document.getElementById('applyDefAttr') ? document.getElementById('applyDefAttr').checked : true;
        const armorHalfLevel = document.getElementById('armorHalfLevel') ? document.getElementById('armorHalfLevel').checked : false;
        const armorBonus = getInt('armorBonus') + (armorHalfLevel ? halfLevel : 0);
        const shieldBonus = getInt('shieldBonus');
        let otherBonus = 0;
        document.querySelectorAll('#defenseList .def-row .inp-bonus').forEach(input => { otherBonus += (parseInt(input.value) || 0); });
        // ── Mod temp: defesa + outros bônus livres ──
        otherBonus += getTempMod('mod-defesa');
        document.querySelectorAll('#mod-bonus-list .mod-bonus-row').forEach(row => {
            otherBonus += parseInt(row.querySelector('.mod-bonus-val')?.value) || 0;
        });
        // ────────────────────────────────────────────
        const totalDefense = 10 + (applyDefAttr ? defAttrVal : 0) + armorBonus + shieldBonus + otherBonus + condDef;

        setText('defAttrVal', applyDefAttr ? defAttrVal : 0);
        setText('dispArmorBonus', armorBonus);
        setText('dispShieldBonus', shieldBonus);
        setText('dispOtherBonus', otherBonus);
        setText('defenseTotal', totalDefense);

        // --- PV/PM ---
        const pvMax = getInt('pvMax');
        const pvCurrent = getInt('pvCurrent');
        const pmMax = getInt('pmMax');
        const pmCurrent = getInt('pmCurrent');

        const barPV = document.getElementById('barPV');
        if (barPV) {
            const isExceeded = pvCurrent > pvMax;
            const percPV = Math.min((pvCurrent / pvMax) * 100, 100);
            barPV.style.width = `${percPV}%`;

            // Toggle da classe de destaque e do símbolo +
            barPV.classList.toggle('bar-exceeded', isExceeded);
            barPV.innerHTML = isExceeded ? '<span class="bar-plus">+</span>' : '';
        }

        const barPM = document.getElementById('barPM');
        if (barPM) {
            const isExceeded = pmCurrent > pmMax;
            const percPM = Math.min((pmCurrent / pmMax) * 100, 100);
            barPM.style.width = `${percPM}%`;

            // Toggle da classe de destaque e do símbolo +
            barPM.classList.toggle('bar-exceeded', isExceeded);
            barPM.innerHTML = isExceeded ? '<span class="bar-plus">+</span>' : '';
        }

        // --- MAGIAS CD ---
        const spellCDAttr = getVal('spellCDAttrSelect');
        const spellCDAttrVal = getInt(`attr-${spellCDAttr}`) + getInt(`mod-attr-${spellCDAttr}`);
        const spellCDPowers = getInt('spellCDPowers');
        const spellCDItems = getInt('spellCDItems');
        const spellCDOther = getInt('spellCDOther');
        const spellCDTotal = 10 + halfLevel + spellCDAttrVal + spellCDPowers + spellCDItems + spellCDOther;

        setText('spellCDHalfLevel', halfLevel);
        setText('spellCDAttrVal', spellCDAttrVal);
        setText('spellCDTotal', spellCDTotal);

        // --- ATAQUES ---
        document.querySelectorAll('.atk-row').forEach(row => {
            const skillSelect = row.querySelector('.inp-atk-skill');
            const bonusInput = row.querySelector('.inp-bonus');
            const modInput = row.querySelector('.inp-atk-mod');

            if (skillSelect && bonusInput && modInput) {
                const selectedSkill = skillSelect.value;
                const skillIndex = currentSkills.findIndex(s => s.n === selectedSkill);
                let skillBonus = 0;
                if (skillIndex !== -1) {
                    const skillTotalEl = document.getElementById(`skTotal${skillIndex}`);
                    if (skillTotalEl) skillBonus = parseInt(skillTotalEl.innerText) || 0;
                }
                const modBonus = parseInt(modInput.value) || 0;
                // ── Mod temp: ataque e rolagens ──
                const modAtq = getTempMod('mod-ataque') + getTempMod('mod-rolagens');
                // ────────────────────────────────
                const totalBonus = skillBonus + modBonus + modAtq + condAtq;
                bonusInput.value = totalBonus;
            }
        });

        // ── Mod temp: atualiza displays e HUD ──
        if (typeof GLOBAL_MOD_TYPES !== 'undefined') {
            GLOBAL_MOD_TYPES.forEach(t => getTempMod(`mod-${t}`));
        }
        atualizarHudMods();
        // ────────────────────────────

    } catch (e) { console.error("Erro em updateCalculations:", e); }
}

function saveData() {
    if (isLoading) return; // Não salvar durante o carregamento inicial

    // 0. Sincroniza trained e other das perícias diretamente do DOM antes de salvar
    currentSkills.forEach((s, i) => {
        const chk = document.getElementById(`skTrain${i}`);
        if (chk) s.trained = chk.checked;
        const otherEl = document.getElementById(`skOther${i}`);
        if (otherEl) s.other = parseInt(otherEl.value) || 0;
        const specEl = document.querySelector(`.oficio-specialty[data-skill-idx="${i}"]`);
        if (specEl) s.specialty = specEl.value;
    });

    // 1. Coletamos as novas listas primeiro para evitar erros de escopo
    const raceAbilities = [];
    document.querySelectorAll('#abilitiesRaceList .ability-row').forEach(row => {
        raceAbilities.push({
            name: row.querySelector('.inp-name').value,
            desc: row.querySelector('.inp-desc').value
        });
    });

    const classAbilities = [];
    document.querySelectorAll('#abilitiesClassList .ability-row').forEach(row => {
        classAbilities.push({
            name: row.querySelector('.inp-name').value,
            desc: row.querySelector('.inp-desc').value
        });
    });

    // 2. Montagem do objeto principal
    const data = {
        loadBonus: typeof currentLoadBonus !== 'undefined' ? currentLoadBonus : 0,
        armorLoadBonus: typeof currentArmorLoadBonus !== 'undefined' ? currentArmorLoadBonus : 0,
        armorHalfLevel: document.getElementById('armorHalfLevel')?.checked ?? false,
        version: 15.4,
        charName: getVal('charName'),
        playerName: getVal('playerName'),
        charRace: getVal('charRace'),
        charOrigin: getVal('charOrigin'),
        charClass: getVal('charClass'),
        charLevel: getVal('charLevel'),
        charDeity: getVal('charDeity'),

        extras: {
            profs: getVal('charProfs'),
            size: getVal('charSize'),
            speed: getVal('charSpeed'),
            xp: getVal('charXP'),
            cash: getVal('charCash')
        },

        attrs: {}, // Preenchido logo abaixo

        status: {
            pvM: getVal('pvMax'),
            pvC: getVal('pvCurrent'),
            pmM: getVal('pmMax'),
            pmC: getVal('pmCurrent')
        },

        defense: {
            config: {
                attr: getVal('defAttrSelect'),
                apply: document.getElementById('applyDefAttr')?.checked ?? true
            },
            armor: {
                name: getVal('armorName'),
                bonus: getVal('armorBonus'),
                penalty: getVal('armorPenalty'),
                type: getVal('armorType'),
                desc: getVal('armorDesc')
            },
            shield: {
                name: getVal('shieldName'),
                bonus: getVal('shieldBonus'),
                penalty: getVal('shieldPenalty'),
                type: getVal('shieldType'),
                desc: getVal('shieldDesc')
            },
            other: []
        },

        skills: currentSkills.map(s => ({
            n: s.n,
            a: s.a,
            trained: s.trained,
            other: s.other,
            isCustom: s.isCustom,
            specialty: s.specialty || ''
        })),

        attacks: [],
        inventory: [],
        raceAbilities: raceAbilities,
        classAbilities: classAbilities,
        notes: document.getElementById('charNotes')?.value || '',
        notesCampanha: document.getElementById('charNotesCampanha')?.value || '',
        notesOutros: document.getElementById('charNotesOutros')?.value || '',

        spells: {
            config: {
                attr: getVal('spellCDAttrSelect'),
                powers: getVal('spellCDPowers'),
                items: getVal('spellCDItems'),
                other: getVal('spellCDOther')
            },
            list: []
        },
        loadConfig: { attr: getVal('loadAttrSelect') || 'FOR' }
    };

    // --- PREENCHIMENTO DAS LISTAS DINÂMICAS ---

    // Atributos
    attrs.forEach(a => {
        data.attrs[a] = getVal(`attr-${a}`);
    });

    // Bônus de Defesa Extras
    document.querySelectorAll('#defenseList .def-row').forEach(row => {
        data.defense.other.push({
            name: row.querySelector('.inp-name').value,
            bonus: row.querySelector('.inp-bonus').value,
            note: row.querySelector('.inp-note')?.value || ''
        });
    });

    // Ataques
    document.querySelectorAll('#attacksList .atk-row').forEach(row => {
        data.attacks.push({
            name: row.querySelector('.inp-name').value,
            bonus: row.querySelector('.inp-bonus').value,
            dmg: row.querySelector('.inp-dmg').value,
            critRange: row.querySelector('.inp-crit-range').value,
            crit: row.querySelector('.inp-crit').value,
            skill: row.querySelector('.inp-atk-skill').value,
            mod: row.querySelector('.inp-atk-mod').value,
            type: row.querySelector('.inp-type').value,
            range: row.querySelector('.inp-range').value,
            desc: row.querySelector('.inp-desc').value
        });
    });

    // Inventário
    document.querySelectorAll('#inventoryList .inv-row').forEach(row => {
        data.inventory.push({
            name: row.querySelector('.inp-name').value,
            qtd: row.querySelector('.inp-qtd').value,
            slots: row.querySelector('.inp-slots').value,
            note: row.querySelector('.inp-note')?.value || '',
            combatData: row.dataset.combat ? JSON.parse(row.dataset.combat) : null,
            defenseData: row.dataset.defense ? JSON.parse(row.dataset.defense) : null
        });
    });

    // Magias
    [1, 2, 3, 4, 5].forEach(circle => {
        document.querySelectorAll(`#spellsList${circle} .spell-row`).forEach(row => {
            data.spells.list.push({
                circle: circle,
                name: row.querySelector('.inp-name').value,
                pm: row.querySelector('.inp-pm').value,
                school: row.querySelector('.inp-school').value,
                exec: row.querySelector('.inp-exec').value,
                range: row.querySelector('.inp-range').value,
                target: row.querySelector('.inp-target').value,
                dur: row.querySelector('.inp-dur').value,
                res: row.querySelector('.inp-res').value,
                desc: row.querySelector('.inp-desc').value
            });
        });
    });

    // --- SALVAMENTO FINAL ---
    // --- COLETA DE MODIFICADORES TEMPORÁRIOS ---
    data.tempMods = {
        globais: {
            // Mantido apenas para compatibilidade com atributos temporários
            attrFOR: getVal('mod-attr-FOR'),
            attrDES: getVal('mod-attr-DES'),
            attrCON: getVal('mod-attr-CON'),
            attrINT: getVal('mod-attr-INT'),
            attrSAB: getVal('mod-attr-SAB'),
            attrCAR: getVal('mod-attr-CAR')
        },
        // Listas de bônus globais individuais (Rolagens, Perícias, Ataque, Dano, Defesa)
        globaisListas: {
            rolagens: Array.from(document.querySelectorAll('#mod-rolagens-list .mod-global-row')).map(row => ({
                nome: row.querySelector('.mod-global-nome')?.value || '',
                val: row.querySelector('.mod-global-val')?.value || ''
            })),
            pericias: Array.from(document.querySelectorAll('#mod-pericias-global-list .mod-global-row')).map(row => ({
                nome: row.querySelector('.mod-global-nome')?.value || '',
                val: row.querySelector('.mod-global-val')?.value || ''
            })),
            ataque: Array.from(document.querySelectorAll('#mod-ataque-list .mod-global-row')).map(row => ({
                nome: row.querySelector('.mod-global-nome')?.value || '',
                val: row.querySelector('.mod-global-val')?.value || ''
            })),
            dano: Array.from(document.querySelectorAll('#mod-dano-list .mod-global-row')).map(row => ({
                nome: row.querySelector('.mod-global-nome')?.value || '',
                val: row.querySelector('.mod-global-val')?.value || ''
            })),
            defesa: Array.from(document.querySelectorAll('#mod-defesa-list .mod-global-row')).map(row => ({
                nome: row.querySelector('.mod-global-nome')?.value || '',
                val: row.querySelector('.mod-global-val')?.value || ''
            }))
        },
        // Mantém o salvamento das listas e condições
        bonusLivres: Array.from(document.querySelectorAll('#mod-bonus-list .mod-bonus-row')).map(row => ({
            nome: row.querySelector('.mod-bonus-nome').value,
            val: row.querySelector('.mod-bonus-val').value
        })),
        periciasEspecificas: Array.from(document.querySelectorAll('#mod-pericias-list .mod-pericia-row')).map(row => ({
            pericia: row.querySelector('.mod-per-sel').value,
            val: row.querySelector('.mod-per-val').value,
            origem: row.querySelector('.mod-per-origem')?.value || ''
        })),
        parceiros: Array.from(document.querySelectorAll('#mod-parceiros-list .mod-parceiro-row')).map(row => ({
            nome: row.querySelector('.mod-par-nome').value,
            tipo: row.querySelector('.mod-par-tipo').value,
            bonus: row.querySelector('.mod-par-bonus').value
        })),
        condicoes: Array.from(document.querySelectorAll('.cond-check:checked')).map(c => c.value)
    };




    localStorage.setItem('t20SheetData', JSON.stringify(data));
}

function loadData() {

    const savedData = localStorage.getItem('t20SheetData');
    if (savedData) {
        isLoading = true; // Impede que saveData() seja chamado durante o carregamento
        const data = JSON.parse(savedData);

        // Carregar bônus de carga manual
        currentLoadBonus = data.loadBonus || 0;
        const loadBonusDisplay = document.getElementById('loadBonusDisplay');
        if (loadBonusDisplay) loadBonusDisplay.innerText = currentLoadBonus > 0 ? `+${currentLoadBonus}` : currentLoadBonus;

        // Carregar bônus de carga da armadura
        currentArmorLoadBonus = data.armorLoadBonus || 0;
        const armorLoadBonusDisplay = document.getElementById('armorLoadBonusDisplay');
        if (armorLoadBonusDisplay) armorLoadBonusDisplay.innerText = currentArmorLoadBonus > 0 ? `+${currentArmorLoadBonus}` : currentArmorLoadBonus;

        // Carregar checkbox ½ nível na armadura
        const armorHalfLevelEl = document.getElementById('armorHalfLevel');
        if (armorHalfLevelEl && data.armorHalfLevel !== undefined) armorHalfLevelEl.checked = data.armorHalfLevel;

        // --- DADOS GERAIS ---
        if (data.charName) document.getElementById('charName').value = data.charName;
        if (data.playerName) document.getElementById('playerName').value = data.playerName;
        if (data.charRace) document.getElementById('charRace').value = data.charRace;
        if (data.charOrigin) document.getElementById('charOrigin').value = data.charOrigin;
        if (data.charClass) document.getElementById('charClass').value = data.charClass;
        if (data.charLevel) document.getElementById('charLevel').value = data.charLevel;
        if (data.charDeity) document.getElementById('charDeity').value = data.charDeity;

        // --- EXTRAS ---
        if (data.extras) {
            if (data.extras.profs) document.getElementById('charProfs').value = data.extras.profs;
            if (data.extras.size) document.getElementById('charSize').value = data.extras.size;
            if (data.extras.speed) document.getElementById('charSpeed').value = data.extras.speed;
            if (data.extras.xp) { document.getElementById('charXP').value = data.extras.xp; autoLevelFromXP(); }
            if (data.extras.cash) document.getElementById('charCash').value = data.extras.cash;
        }

        // --- ATRIBUTOS ---
        if (data.attrs) {
            attrs.forEach(a => {
                if (data.attrs[a]) document.getElementById(`attr-${a}`).value = data.attrs[a];
            });
        }

        // No local onde carrega as habilidades (normalmente após o parse do JSON)
        if (data.raceAbilities) {
            document.getElementById('abilitiesRaceList').innerHTML = '';
            data.raceAbilities.forEach(a => addAbility('abilitiesRaceList', a.name, a.desc));
        }

        if (data.classAbilities) {
            document.getElementById('abilitiesClassList').innerHTML = '';
            data.classAbilities.forEach(a => addAbility('abilitiesClassList', a.name, a.desc));
        }

        // --- STATUS ---
        if (data.status) {
            if (data.status.pvM) document.getElementById('pvMax').value = data.status.pvM;
            if (data.status.pvC) document.getElementById('pvCurrent').value = data.status.pvC;
            if (data.status.pmM) document.getElementById('pmMax').value = data.status.pmM;
            if (data.status.pmC) document.getElementById('pmCurrent').value = data.status.pmC;
        }

        // --- DEFESA ---
        if (data.defense) {
            if (data.defense.config) {
                if (data.defense.config.attr) document.getElementById('defAttrSelect').value = data.defense.config.attr;
                const chk = document.getElementById('applyDefAttr');
                if (chk) chk.checked = data.defense.config.apply;
            }
            if (data.defense.armor) {
                if (data.defense.armor.name) document.getElementById('armorName').value = data.defense.armor.name;
                if (data.defense.armor.bonus) document.getElementById('armorBonus').value = data.defense.armor.bonus;
                if (data.defense.armor.penalty) document.getElementById('armorPenalty').value = data.defense.armor.penalty;
                if (data.defense.armor.type) document.getElementById('armorType').value = data.defense.armor.type;
                if (data.defense.armor.desc) document.getElementById('armorDesc').value = data.defense.armor.desc;
            }
            if (data.defense.shield) {
                if (data.defense.shield.name) document.getElementById('shieldName').value = data.defense.shield.name;
                if (data.defense.shield.bonus) document.getElementById('shieldBonus').value = data.defense.shield.bonus;
                if (data.defense.shield.penalty) document.getElementById('shieldPenalty').value = data.defense.shield.penalty;
                if (data.defense.shield.type) document.getElementById('shieldType').value = data.defense.shield.type;
                if (data.defense.shield.desc) document.getElementById('shieldDesc').value = data.defense.shield.desc;
            }
            if (data.defense.other) {
                data.defense.other.forEach(item => addDefenseItem(item));
            }
        }

        // --- PERÍCIAS ---
        if (data.skills && data.skills.length > 0) {
            currentSkills = data.skills;
            renderSkills();
        }

        // --- ATAQUES ---
        if (data.attacks) {
            data.attacks.forEach(item => addAttack(item));
        }

        // --- INVENTÁRIO ---
        if (data.inventory) {
            data.inventory.forEach(item => addInventoryItem(item));
        }

        // --- PODERES ---
        if (data.abilities) {
            data.abilities.forEach(item => addAbility(item));
        }

        // --- NOTAS  ---
        if (data.notes !== undefined) document.getElementById('charNotes').value = data.notes;
        if (data.notesCampanha !== undefined) document.getElementById('charNotesCampanha').value = data.notesCampanha;
        if (data.notesOutros !== undefined) document.getElementById('charNotesOutros').value = data.notesOutros;

        // --- MAGIAS ---
        if (data.spells) {
            if (data.spells.config) {
                if (data.spells.config.attr) document.getElementById('spellCDAttrSelect').value = data.spells.config.attr;
                if (data.spells.config.powers) document.getElementById('spellCDPowers').value = data.spells.config.powers;
                if (data.spells.config.items) document.getElementById('spellCDItems').value = data.spells.config.items;
                if (data.spells.config.other) document.getElementById('spellCDOther').value = data.spells.config.other;
            }
            if (data.spells.list) {
                data.spells.list.forEach(item => addSpell(item.circle, item));
            }
        }

        // --- CARGA ---
        if (data.loadConfig && data.loadConfig.attr) {
            document.getElementById('loadAttrSelect').value = data.loadConfig.attr;
        }

        if (data.condicoes) {
            data.condicoes.forEach(key => {
                const chk = document.getElementById(`cond-${key}`);
                if (chk) chk.checked = true;
            });
        }

        // --- CARREGAR MODIFICADORES TEMPORÁRIOS ---
        if (data.tempMods) {
            const m = data.tempMods;

            // Globais — atributos temporários
            if (m.globais) {
                const setMod = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val || ''; };
                setMod('mod-attr-FOR', m.globais.attrFOR);
                setMod('mod-attr-DES', m.globais.attrDES);
                setMod('mod-attr-CON', m.globais.attrCON);
                setMod('mod-attr-INT', m.globais.attrINT);
                setMod('mod-attr-SAB', m.globais.attrSAB);
                setMod('mod-attr-CAR', m.globais.attrCAR);

                // Compatibilidade retroativa: saves antigos tinham valor único, migra como 1 linha
                const LEGADO = { rolagens: m.globais.rolagens, pericias: m.globais.pericias, ataque: m.globais.ataque, dano: m.globais.dano, defesa: m.globais.defesa };
                if (!m.globaisListas) {
                    Object.entries(LEGADO).forEach(([tipo, val]) => {
                        if (val && parseInt(val) !== 0) {
                            addModGlobal(tipo);
                            const listId = tipo === 'pericias' ? 'mod-pericias-global-list' : `mod-${tipo}-list`;
                            const container = document.getElementById(listId);
                            if (container) {
                                const rows = container.querySelectorAll('.mod-global-row');
                                const last = rows[rows.length - 1];
                                if (last) {
                                    last.querySelector('.mod-global-nome').value = 'Legado';
                                    last.querySelector('.mod-global-val').value = val;
                                }
                            }
                        }
                    });
                }
            }

            // Listas individuais de bônus globais
            if (m.globaisListas) {
                const gl = m.globaisListas;
                const tipoMap = { rolagens: 'mod-rolagens-list', pericias: 'mod-pericias-global-list', ataque: 'mod-ataque-list', dano: 'mod-dano-list', defesa: 'mod-defesa-list' };
                Object.entries(tipoMap).forEach(([tipo, listId]) => {
                    const lista = gl[tipo] || [];
                    const container = document.getElementById(listId);
                    if (container) container.innerHTML = '';
                    lista.forEach(item => {
                        addModGlobal(tipo);
                        const rows = document.getElementById(listId)?.querySelectorAll('.mod-global-row');
                        if (rows && rows.length > 0) {
                            const last = rows[rows.length - 1];
                            last.querySelector('.mod-global-nome').value = item.nome || '';
                            last.querySelector('.mod-global-val').value = item.val || '';
                        }
                    });
                });
            }

            // Bônus Livres
            if (m.bonusLivres) {
                const container = document.getElementById('mod-bonus-list');
                if (container) container.innerHTML = '';
                m.bonusLivres.forEach(b => {
                    addModBonus(); // Chama a função que cria a linha
                    const rows = container.querySelectorAll('.mod-bonus-row');
                    const lastRow = rows[rows.length - 1];
                    lastRow.querySelector('.mod-bonus-nome').value = b.nome;
                    lastRow.querySelector('.mod-bonus-val').value = b.val;
                });
            }

            // Perícias Específicas
            if (m.periciasEspecificas) {
                const container = document.getElementById('mod-pericias-list');
                if (container) container.innerHTML = '';
                m.periciasEspecificas.forEach(p => {
                    addModPericia();
                    const rows = container.querySelectorAll('.mod-pericia-row');
                    const lastRow = rows[rows.length - 1];
                    lastRow.querySelector('.mod-per-sel').value = p.pericia;
                    lastRow.querySelector('.mod-per-val').value = p.val;
                    if (lastRow.querySelector('.mod-per-origem')) {
                        lastRow.querySelector('.mod-per-origem').value = p.origem || '';
                    }
                });
            }

            // Parceiros
            if (m.parceiros) {
                const container = document.getElementById('mod-parceiros-list');
                if (container) container.innerHTML = '';
                m.parceiros.forEach(par => {
                    addParceiro();
                    const rows = container.querySelectorAll('.mod-parceiro-row');
                    const lastRow = rows[rows.length - 1];
                    lastRow.querySelector('.mod-par-nome').value = par.nome;
                    lastRow.querySelector('.mod-par-tipo').value = par.tipo;
                    lastRow.querySelector('.mod-par-bonus').value = par.bonus;
                });
            }
        }

        isLoading = false; // Carregamento concluído - salvar normalmente a partir daqui

    } else {
        // Se não houver dados salvos, renderiza as perícias padrão
        renderSkills();
    }
}

//Abas de resumos
function switchNoteTab(tabId, btn) {
    // Esconde todos os textareas de notas
    document.querySelectorAll('.note-area').forEach(el => el.classList.add('d-none'));

    // Mostra o selecionado
    if (tabId === 'historia') document.getElementById('charNotes').classList.remove('d-none');
    if (tabId === 'campanha') document.getElementById('charNotesCampanha').classList.remove('d-none');
    if (tabId === 'outros') document.getElementById('charNotesOutros').classList.remove('d-none');

    // Atualiza o estilo dos botões
    document.querySelectorAll('#notesTabs .nav-link').forEach(el => {
        el.classList.remove('active', 'fw-bold', 'text-danger');
        el.classList.add('text-secondary');
    });
    btn.classList.add('active', 'fw-bold', 'text-danger');
    btn.classList.remove('text-secondary');
}

// ============================================================
//  IMPORTAÇÃO DO CARRINHO DE PODERES
//  Lê a chave 't20PoderesCarrinho' gravada pelo Compilado de Poderes
//  e mescla os itens em classAbilities, evitando duplicatas.
// ============================================================
function importPoderesDoCarrinho() {
    const raw = localStorage.getItem('t20PoderesCarrinho');
    if (!raw) return;

    let incoming;
    try { incoming = JSON.parse(raw); } catch { return; }
    if (!Array.isArray(incoming) || incoming.length === 0) return;

    // Remove a chave ANTES de qualquer coisa (evita loop em reloads)
    localStorage.removeItem('t20PoderesCarrinho');

    const list = document.getElementById('abilitiesClassList');
    if (!list) return;

    // Nomes já presentes na lista (case-insensitive)
    const existing = new Set(
        Array.from(list.querySelectorAll('.inp-name'))
            .map(el => el.value.trim().toLowerCase())
    );

    let added = 0;
    incoming.forEach(item => {
        if (!item.name) return;
        if (existing.has(item.name.trim().toLowerCase())) return; // não duplica
        // Strip HTML da desc para manter a ficha limpa
        const tmp = document.createElement('div');
        tmp.innerHTML = item.desc || '';
        const cleanDesc = tmp.textContent || tmp.innerText || '';
        addAbility('abilitiesClassList', item.name.trim(), cleanDesc.trim());
        existing.add(item.name.trim().toLowerCase());
        added++;
    });

    if (added > 0) {
        saveData();
        // Toast de confirmação
        const toast = document.createElement('div');
        toast.textContent = `✅ ${added} poder(es) importado(s) do Compilado!`;
        Object.assign(toast.style, {
            position: 'fixed', bottom: '24px', left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a6636', color: '#fff',
            padding: '12px 24px', borderRadius: '8px',
            fontWeight: '700', fontSize: '0.95rem',
            zIndex: '9999', boxShadow: '0 4px 18px rgba(0,0,0,.3)',
            transition: 'opacity .4s'
        });
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; }, 2800);
        setTimeout(() => toast.remove(), 3300);
    }
}

// --- RESET IMAGEM DO PERSONAGEM ---
function resetCharImage(e) {
    e.stopPropagation(); // evita abrir o file picker
    const defaultSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 16 16'%3E%3Cpath fill='%23ccc' d='M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'/%3E%3Cpath fill='%23ccc' fill-rule='evenodd' d='M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z'/%3E%3C/svg%3E";
    document.getElementById('charImgPreview').src = defaultSrc;
    localStorage.removeItem('charImage');
    const fileInput = document.getElementById('charImgInput');
    if (fileInput) fileInput.value = '';
}

// --- AUTO-NÍVEL POR XP ---
function autoLevelFromXP() {
    const xp = parseInt(document.getElementById('charXP').value) || 0;
    let newLevel = 1;
    for (let i = XP_TABLE.length - 1; i >= 0; i--) {
        if (xp >= XP_TABLE[i]) { newLevel = i + 1; break; }
    }
    if (newLevel > 20) newLevel = 20;
    const levelEl = document.getElementById('charLevel');
    if (levelEl && parseInt(levelEl.value) !== newLevel) {
        levelEl.value = newLevel;
        updateCalculations();
    }
    // Exibe XP para o próximo nível
    const nextEl = document.getElementById('xpNextLevel');
    if (nextEl) {
        if (newLevel < 20) {
            const nextXP = XP_TABLE[newLevel];
            const diff = nextXP - xp;
            nextEl.textContent = `Próx. nv: ${nextXP.toLocaleString('pt-BR')} (faltam ${diff.toLocaleString('pt-BR')})`;
        } else {
            nextEl.textContent = 'Nível máximo!';
        }
    }
}

// Atualiza o XP mínimo baseado no nível selecionado
function autoXPFromLevel() {
    const levelEl = document.getElementById('charLevel');
    const xpEl = document.getElementById('charXP');
    if (!levelEl || !xpEl) return;

    let level = parseInt(levelEl.value) || 1;
    if (level < 1) level = 1;
    if (level > 20) level = 20;

    // O índice na XP_TABLE é (nível - 1)
    const minXP = XP_TABLE[level - 1];

    // Só atualiza se o XP atual for menor que o mínimo do novo nível
    // ou se o usuário estiver "rebaixando" o nível manualmente
    xpEl.value = minXP;

    // Atualiza o texto de "Próximo nível"
    autoLevelFromXP();
    saveData();
}

function clearSheet() {
    if (confirm("Tem certeza que deseja apagar todos os dados da ficha?")) {
        localStorage.removeItem('t20SheetData');
        window.location.reload();
    }
}

function exportSheet() {
    saveData();
    const data = localStorage.getItem('t20SheetData');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ficha_t20_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importSheet(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                localStorage.setItem('t20SheetData', JSON.stringify(data));
                window.location.reload();
            } catch (error) {
                alert('Erro ao carregar o arquivo. Certifique-se de que é um arquivo JSON de backup válido.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
}

// --- DRAG AND DROP ---
// Opções base para mobile: delay evita conflito com scroll/toque em inputs
const sortableMobileOpts = {
    delay: 200,
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    forceFallback: false
};

function enableDragAndDrop() {
    // Ataques
    const attacksList = document.getElementById('attacksList');
    if (attacksList) new Sortable(attacksList, {
        ...sortableMobileOpts,
        animation: 150,
        handle: '.drag-handle',
        filter: 'input, textarea, select, button',
        preventOnFilter: false,
        onEnd: saveData
    });

    // Defesa
    const defenseList = document.getElementById('defenseList');
    if (defenseList) new Sortable(defenseList, {
        ...sortableMobileOpts,
        animation: 150,
        handle: '.drag-handle',
        filter: 'input, textarea, select, button',
        preventOnFilter: false,
        onEnd: saveData
    });

    // Inventário
    const inventoryList = document.getElementById('inventoryList');
    if (inventoryList) new Sortable(inventoryList, {
        ...sortableMobileOpts,
        animation: 150,
        handle: '.drag-handle',
        filter: 'input, textarea, select, button',
        preventOnFilter: false,
        onEnd: saveData
    });

    // Poderes — inicialização única com handle no grip e filtro em inputs/botões
    const raceList = document.getElementById('abilitiesRaceList');
    if (raceList) new Sortable(raceList, {
        ...sortableMobileOpts,
        group: 'sharedAbilities',
        animation: 150,
        handle: '.ability-drag-handle',
        filter: 'input, textarea, button, .ability-delete-btn, .ability-chevron',
        preventOnFilter: false,
        ghostClass: 'bg-warning-subtle',
        onEnd: saveData
    });

    const classList = document.getElementById('abilitiesClassList');
    if (classList) new Sortable(classList, {
        ...sortableMobileOpts,
        group: 'sharedAbilities',
        animation: 150,
        handle: '.ability-drag-handle',
        filter: 'input, textarea, button, .ability-delete-btn, .ability-chevron',
        preventOnFilter: false,
        ghostClass: 'bg-danger-subtle',
        onEnd: saveData
    });

    // Magias
    [1, 2, 3, 4, 5].forEach(circle => {
        const spellsList = document.getElementById(`spellsList${circle}`);
        if (spellsList) new Sortable(spellsList, {
            ...sortableMobileOpts,
            animation: 150,
            handle: '.drag-handle',
            filter: 'input, textarea, select, button',
            preventOnFilter: false,
            onEnd: saveData
        });
    });
}

// --- IMAGEM ---
function uploadImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.getElementById('charImgPreview');
            img.src = e.target.result;
            localStorage.setItem('charImage', e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Carregar imagem salva
document.addEventListener('DOMContentLoaded', () => {
    const savedImage = localStorage.getItem('charImage');
    if (savedImage) {
        const img = document.getElementById('charImgPreview');
        if (img) img.src = savedImage;
    }
});

function escapeHtml(str) {
    // Para evitar quebrar o HTML na renderização
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


function copyToClipboard() {
    // Coleta de Dados Básicos
    const nome = document.getElementById('charName').value || 'Sem Nome';
    const raca = document.getElementById('charRace').value || '-';
    const classe = document.getElementById('charClass').value || '-';
    const nivel = document.getElementById('charLevel').value || '1';
    const divindade = document.getElementById('charDeity').value || '-';

    // Atributos
    const attrs = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
    const attrVals = {};
    attrs.forEach(a => attrVals[a] = document.getElementById(`attr-${a}`).value);

    // Função auxiliar para buscar bônus total de perícias
    const getSkillVal = (name) => {
        const idx = currentSkills.findIndex(s => s.n === name);
        if (idx !== -1) {
            const val = parseInt(document.getElementById(`skTotal${idx}`).innerText);
            return val >= 0 ? `+${val}` : `${val}`;
        }
        return '+0';
    };

    let resumo = `**Nome:** ${nome}\n`;
    resumo += `**Raça:** ${raca} | **Classe:** ${classe} ND ${nivel}\n`;
    resumo += `**Devoto:** ${divindade}\n`;
    resumo += `------------------------------------------------\n`;

    // Iniciativa e Percepção em destaque
    resumo += `⚡ **INICIATIVA:** ${getSkillVal('Iniciativa')} | **PERCEPÇÃO:** ${getSkillVal('Percepção')}\n`;
    resumo += `🛡️ **DEFESA:** ${document.getElementById('defenseTotal').innerText}\n`;
    resumo += `💪 **RESISTÊNCIAS:** Fort ${getSkillVal('Fortitude')} | Ref ${getSkillVal('Reflexos')} | Von ${getSkillVal('Vontade')}\n`;
    resumo += `❤️ **PV:** ${document.getElementById('pvCurrent').value}/${document.getElementById('pvMax').value}\n`;
    resumo += `🔹 **PM:** ${document.getElementById('pmCurrent').value}/${document.getElementById('pmMax').value}\n`;
    resumo += `🏃 **DESLOCAMENTO:** ${document.getElementById('charSpeed').value || '9m'}\n`;
    resumo += `------------------------------------------------\n`;

    // Perícias Treinadas (Excluindo as que já estão no topo)
    const skillsIgnorar = ['Iniciativa', 'Percepção', 'Fortitude', 'Reflexos', 'Vontade'];
    let outrasPericias = [];
    currentSkills.forEach((s, i) => {
        if (s.trained && !skillsIgnorar.includes(s.n)) {
            const total = document.getElementById(`skTotal${i}`).innerText;
            const formatado = parseInt(total) >= 0 ? `+${total}` : total;
            outrasPericias.push(`${s.n} ${formatado}`);
        }
    });
    if (outrasPericias.length > 0) {
        resumo += `📊 **PERÍCIAS:** ${outrasPericias.join(' | ')}\n`;
        resumo += `------------------------------------------------\n`;
    }

    // Ataques
    const ataques = document.querySelectorAll('#attacksList .atk-row');
    if (ataques.length > 0) {
        resumo += `⚔️ **AÇÕES E ATAQUES:**\n`;
        ataques.forEach(row => {
            const n = row.querySelector('.inp-name').value || 'Ataque';
            const bValue = parseInt(row.querySelector('.inp-bonus').value) || 0;
            const bFormatado = bValue >= 0 ? `+${bValue}` : bValue;
            const d = row.querySelector('.inp-dmg').value || '-';
            const cr = row.querySelector('.inp-crit-range').value || '20';
            const c = row.querySelector('.inp-crit').value || '-';
            resumo += `▫️ ${n} ${bFormatado} (${d}, ${cr}/${c})\n`;
        });
        resumo += `------------------------------------------------\n`;
    }

    // HABILIDADES E PODERES (Versão atualizada para as duas listas)
    let poderes = [];

    // Coleta da lista de Raça e Origem
    document.querySelectorAll('#abilitiesRaceList .inp-name').forEach(el => {
        if (el.value) poderes.push(el.value);
    });

    // Coleta da lista de Classe e Poderes
    document.querySelectorAll('#abilitiesClassList .inp-name').forEach(el => {
        if (el.value) poderes.push(el.value);
    });

    if (poderes.length > 0) {
        resumo += `✨ **HABILIDADES E PODERES:**\n`;
        resumo += `▫️ ${poderes.join(' ▫️ ')}\n\n`;
    }

    // Magias
    const temMagias = document.querySelectorAll('.spell-row .inp-name').length > 0;
    if (temMagias) {
        resumo += `🔮 **MAGIAS:**\n`;
        [1, 2, 3, 4, 5].forEach(circulo => {
            const magiasCirculo = document.querySelectorAll(`#spellsList${circulo} .inp-name`);
            if (magiasCirculo.length > 0) {
                let nomesMagias = [];
                magiasCirculo.forEach(m => { if (m.value) nomesMagias.push(m.value); });
                if (nomesMagias.length > 0) {
                    resumo += `*${circulo}º Círculo:* ${nomesMagias.join(', ')}\n`;
                }
            }
        });
        resumo += `\n`;
    }

    // Equipamentos (Versão "Inline" para economizar espaço)
    const itens = document.querySelectorAll('#inventoryList .inv-row');
    if (itens.length > 0) {
        resumo += `🎒 **EQUIPAMENTO:**\n`;
        let listaItens = [];
        itens.forEach(row => {
            const nomeItem = row.querySelector('.inp-name').value;
            const qtd = row.querySelector('.inp-qtd').value || '1';
            if (nomeItem) listaItens.push(`${nomeItem} (x${qtd})`);
        });
        resumo += `▫️ ${listaItens.join(' ▫️ ')}\n`;
    }

    resumo += `------------------------------------------------\n`;
    resumo += `FOR ${attrVals.FOR} | DES ${attrVals.DES} | CON ${attrVals.CON} | INT ${attrVals.INT} | SAB ${attrVals.SAB} | CAR ${attrVals.CAR}\n`;

    // Copiar para o clipboard com feedback visual
    navigator.clipboard.writeText(resumo).then(() => {
        const btn = document.querySelector('button[onclick="copyToClipboard()"]');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check-lg"></i> Copiado!';
            setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
        } else {
            alert("Resumo copiado para o Discord!");
        }
    });
}

async function exportarParaPDF() {
    try {
        const binaryString = window.atob(FICHA_PDF_BASE64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const form = pdfDoc.getForm();
        const data = JSON.parse(localStorage.getItem('t20SheetData'));
        if (!data) return alert("Nenhum dado encontrado!");

        // Constantes para cálculos automáticos do PDF
        const level = parseInt(data.charLevel) || 1;
        const halfLevel = Math.floor(level / 2);
        const trainBonus = level >= 15 ? 6 : (level >= 7 ? 4 : 2);

        // --- DADOS BÁSICOS ---
        form.getTextField('Nome do Personagem').setText(data.charName || '');
        form.getTextField('Nome do Jogador').setText(data.playerName || '');
        form.getTextField('Raca do Personagem').setText(data.charRace || '');
        form.getTextField('Origem do Personagem').setText(data.charOrigin || '');
        form.getTextField('Classe(s) do personagem').setText(data.charClass || '');
        form.getTextField('Lv').setText(data.charLevel?.toString() || '1');
        form.getTextField('Divindade').setText(data.charDeity || '');
        form.getTextField('Experiencia total do personagem').setText(data.extras?.xp?.toString() || '0');

        // --- ATRIBUTOS (MODIFICADORES) ---
        const attrMap = { 'FOR': 'ModFor', 'DES': 'ModDes', 'CON': 'ModCon', 'INT': 'ModInt', 'SAB': 'ModSab', 'CAR': 'ModCar' };
        Object.keys(attrMap).forEach(key => {
            try { form.getTextField(attrMap[key]).setText(data.attrs[key]?.toString() || '0'); } catch (e) { }
        });

        // --- STATUS (PV/PM) ---
        form.getTextField('Pontos de Vida m#C3#A1ximos').setText(data.status.pvM?.toString() || '0');
        form.getTextField('Pontos de Vida atuais').setText(data.status.pvC?.toString() || '0');
        form.getTextField('Pontos de Mana m#C3#A1ximos').setText(data.status.pmM?.toString() || '0');
        form.getTextField('Pontos de Mana atuais').setText(data.status.pmC?.toString() || '0');

        // --- PERÍCIAS ---
        const skillSuffix = {
            'Acrobacia': 'acro', 'Adestramento': 'ades', 'Atletismo': 'atle', 'Atuação': 'atua',
            'Cavalgar': 'caval', 'Conhecimento': 'conhe', 'Cura': 'cura', 'Diplomacia': 'dipl',
            'Enganação': 'enga', 'Fortitude': 'forti', 'Furtividade': 'furti', 'Guerra': 'guerra',
            'Iniciativa': 'ini', 'Intimidação': 'inti', 'Intuição': 'intu', 'Investigação': 'inve',
            'Jogatina': 'joga', 'Ladinagem': 'ladi', 'Luta': 'luta', 'Misticismo': 'misti',
            'Nobreza': 'nobre', 'Percepção': 'perce', 'Pilotagem': 'pilo', 'Pontaria': 'ponta',
            'Reflexos': 'refle', 'Religião': 'reli', 'Sobrevivência': 'sobre', 'Vontade': 'vonta'
        };

        data.skills.forEach((s, i) => {
            // Determine suffix: for Ofício default skills, use ofi1 for the first and ofi2 for the second
            let suf = skillSuffix[s.n];
            if (!suf && s.n === 'Ofício') {
                const oficiosBefore = data.skills.slice(0, i).filter(sk => sk.n === 'Ofício').length;
                suf = oficiosBefore === 0 ? 'ofi1' : 'ofi2';
            } else if (!suf && s.n.includes('Ofício')) {
                suf = 'ofi1';
            }
            if (suf) {
                try {
                    const baseId = (i + 1).toString().padStart(2, '0');
                    if (s.trained) { form.getCheckBox(`Mar Trei ${suf}`).check(); }
                    form.getTextField(`${baseId}0`).setText(document.getElementById(`skTotal${i}`)?.innerText || '0');
                    form.getTextField(`${baseId}1`).setText(halfLevel.toString());
                    form.getTextField(`${baseId}3`).setText(s.trained ? trainBonus.toString() : '0');
                    form.getTextField(`${baseId}4`).setText(s.other?.toString() || '0');
                    const attrFieldName = `ModAtrib${suf.charAt(0).toUpperCase() + suf.slice(1, 4)}`;
                    form.getTextField(attrFieldName).setText(data.attrs[s.a]?.toString() || '0');
                } catch (e) { }
            }
        });

        // --- ATAQUES ---
        if (data.attacks && data.attacks.length > 0) {
            data.attacks.slice(0, 5).forEach((atk, i) => {
                const n = i + 1;
                form.getTextField(`Ataque ${n}`).setText(atk.name || '');
                form.getTextField(`Bonus do ataque ${n}`).setText(atk.bonus || '');
                form.getTextField(`Dano causado pelo ataque ${n}`).setText(atk.dmg || '');
                form.getTextField(`Margem de cr#C3#ADtico e multiplicador ${n}`).setText(`${atk.critRange}/${atk.crit}`);
                form.getTextField(`Tipo de dano do ataque ${n}`).setText(atk.type || '');
                form.getTextField(`Alcance do ataque ${n}`).setText(atk.range || '');
            });
        }

        // --- DEFESA (FÓRMULA E DETALHES CORRIGIDOS) ---
        try {
            form.getTextField('CA').setText(document.getElementById('defenseTotal')?.innerText || '10');

            // Pegamos o atributo selecionado (DES, INT, SAB, etc.) e colocamos no campo ModAtribDefe
            const defAttr = data.defense.config.attr || 'DES';
            const defAttrVal = data.attrs[defAttr]?.toString() || '0';
            form.getTextField('ModAtribDefe').setText(defAttrVal);


            // Armadura
            form.getTextField('Armadura').setText(data.defense.armor.name || '');
            const armBonus = data.defense.armor.bonus?.toString() || '0';
            form.getTextField('B.Arm').setText(armBonus);   // Campo da fórmula (topo)
            form.getTextField('B.Arm1').setText(armBonus);  // Campo do detalhe (embaixo)
            form.getTextField('Pa').setText(data.defense.armor.penalty?.toString() || '0');

            // Escudo
            form.getTextField('Escudo').setText(data.defense.shield.name || '');
            const escBonus = data.defense.shield.bonus?.toString() || '0';
            form.getTextField('B.Esc').setText(escBonus);   // Campo da fórmula (topo)
            form.getTextField('B.Esc2').setText(escBonus);  // Campo do detalhe (embaixo)
            form.getTextField('Pe').setText(data.defense.shield.penalty?.toString() || '0');

            // Outros modificadores de Defesa
            let defOutros = 0;
            document.querySelectorAll('#defenseList .def-row .inp-bonus').forEach(input => defOutros += (parseInt(input.value) || 0));
            form.getTextField('Outros B.CA').setText(defOutros.toString());

        } catch (e) { }


        // --- PODERES E PROFICIÊNCIAS ---
        const txtRace = data.raceAbilities ? data.raceAbilities.map(a => `${a.name.toUpperCase()}: ${a.desc}`).join('\n\n') : '';
        try { form.getTextField('Habilidades de raca e origem').setText(txtRace); } catch (e) { }

        const txtClass = data.classAbilities ? data.classAbilities.map(a => `${a.name.toUpperCase()}: ${a.desc}`).join('\n\n') : '';
        try { form.getTextField('Habilidades de Classe e poderes').setText(txtClass); } catch (e) { }

        try { form.getTextField('Proficiencias e outras caracteristicas').setText(data.extras?.profs || ''); } catch (e) { }

        // --- TAMANHO E DESLOCAMENTO ---
        form.getTextField('Deslocamento do personagem').setText(data.extras?.speed || '9m');
        let tamanhoTexto = '';
        try {
            const tamanhoSel = document.getElementById('charSize');
            if (tamanhoSel && tamanhoSel.options.length > 0) {
                tamanhoTexto = tamanhoSel.options[tamanhoSel.selectedIndex].text;
                form.getDropdown('SeleTamanho').select(tamanhoTexto);
            }
        } catch (e) {
            try { form.getTextField('SeleTamanho').setText(tamanhoTexto); } catch (err) { }
        }

        // --- EQUIPAMENTO E DINHEIRO ---
        form.getTextField('Tibares').setText(data.extras?.cash?.toString() || '0');
        form.getTextField('Anotacoes').setText(data.notes || '');
        if (data.inventory) {
            data.inventory.slice(0, 17).forEach((item, i) => {
                const n = i + 1;
                try {
                    form.getTextField(`Item ${n}`).setText(item.name || '');
                    form.getTextField(`Quantidade Item ${n}`).setText(item.qtd?.toString() || '1');
                    form.getTextField(`Slots Item ${n}`).setText(item.slots?.toString() || '0');
                } catch (e) { }
            });
        }

        // --- MAGIAS (Página 2) ---
        if (data.spells && data.spells.list.length > 0) {
            const magiasTexto = data.spells.list.map(m =>
                `[${m.circle}º Circ] ${m.name.toUpperCase()} (${m.pm} PM) - Exec: ${m.exec}, Alc: ${m.range}, Dur: ${m.dur}`
            ).join('\n\n');
            try { form.getTextField('Magias').setText(magiasTexto); } catch (e) { }
        }

        // --- FINALIZAÇÃO ---
        form.updateFieldAppearances(); // Força a atualização visual dos campos
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Ficha_${data.charName || 'Personagem'}.pdf`;
        link.click();

    } catch (error) {
        console.error("Erro na exportação completa:", error);
        alert("Erro ao exportar o PDF. Verifique os dados.");
    }
}



// ============================================================
// INTEGRAÇÃO COM O GRIMÓRIO DE PODERES
// ============================================================
function checkImportedPowers() {
    const importedData = localStorage.getItem('selectedPowers');

    if (importedData) {
        try {
            const powers = JSON.parse(importedData);

        } catch (e) {
            console.error("Erro ao importar poderes do Grimório:", e);
        }
    }
}

// ================================================================
//  FICHA DE AMEAÇA
// ================================================================

let _fichaView = 'personagem'; // 'personagem' | 'ameaca'

function toggleFichaView(mode) {
    _fichaView = mode;
    const personagem = document.getElementById('fichaPersonagemContent');
    const ameaca = document.getElementById('fichaAmeacaSection');
    const modsSection = document.getElementById('fichaModsSection');
    const btnP = document.getElementById('btnViewPersonagem');
    const btnA = document.getElementById('btnViewAmeaca');
    const btnM = document.getElementById('btnViewMods');
    const headerContent = document.querySelector('.header-content');
    const btnsPerson = document.getElementById('headerBtnsPersonagem');
    const btnsAmeaca = document.getElementById('headerBtnsAmeaca');
    const btnPDF = document.getElementById('btnGerarPDF');

    // Reset all
    [personagem, ameaca, modsSection].forEach(el => { if (el) el.style.display = 'none'; });
    if (headerContent) headerContent.style.display = 'none';
    if (btnsPerson) btnsPerson.style.setProperty('display', 'none', 'important');
    if (btnsAmeaca) btnsAmeaca.style.setProperty('display', 'none', 'important');
    if (btnPDF) btnPDF.style.display = '';
    [btnP, btnA, btnM].forEach(b => {
        if (!b) return;
        b.classList.remove('btn-danger', 'btn-warning', 'fw-bold');
        b.classList.add('btn-outline-danger');
    });
    if (btnM) { btnM.classList.remove('btn-outline-danger'); btnM.classList.add('btn-outline-warning'); }

    if (mode === 'ameaca') {
        if (ameaca) ameaca.style.display = 'block';
        if (btnsAmeaca) btnsAmeaca.style.removeProperty('display');
        if (btnPDF) { btnPDF.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> PDF Ameaça'; btnPDF.onclick = exportarAmeacaPDF; btnPDF.title = 'Gerar PDF da Ficha de Ameaça'; }
        if (btnA) { btnA.classList.remove('btn-outline-danger'); btnA.classList.add('btn-danger'); }
        syncAmeacaFromSheet();
    } else if (mode === 'mods') {
        if (modsSection) modsSection.style.display = 'block';
        if (btnsPerson) btnsPerson.style.removeProperty('display');
        if (btnPDF) btnPDF.style.display = 'none';
        if (btnM) { btnM.classList.remove('btn-outline-warning'); btnM.classList.add('btn-warning', 'fw-bold'); }
    } else { // personagem
        if (personagem) personagem.style.display = '';
        if (headerContent) headerContent.style.display = '';
        if (btnsPerson) btnsPerson.style.removeProperty('display');
        if (btnPDF) { btnPDF.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Gerar PDF Oficial'; btnPDF.onclick = exportarParaPDF; btnPDF.title = 'Gerar PDF Oficial'; }
        if (btnP) { btnP.classList.remove('btn-outline-danger'); btnP.classList.add('btn-danger'); }
    }
}

// Lê o valor calculado de uma perícia pelo nome
function getSkillTotalByName(name) {
    const idx = currentSkills.findIndex(s => s.n === name);
    if (idx === -1) return null;
    const el = document.getElementById(`skTotal${idx}`);
    if (!el) return null;
    const v = parseInt(el.innerText);
    return isNaN(v) ? null : v;
}

function fmtBonus(v) {
    if (v === null || v === undefined) return '–';
    return v >= 0 ? `+${v}` : `${v}`;
}

// Sincroniza valores calculados da ficha principal para a visualização de ameaça
function syncAmeacaFromSheet() {
    updateCalculations();

    // Helper: preenche o input apenas se estiver vazio (não sobrescreve edições do usuário)
    const fill = (id, val) => {
        const el = document.getElementById(id);
        if (el && !el.value) el.value = val || '';
    };
    // Helper: sempre atualiza (re-sync forçado)
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    // Iniciativa, Percepção, Fortitude, Reflexos, Vontade — sempre sincronizados
    set('am-iniciativa', fmtBonus(getSkillTotalByName('Iniciativa')));
    set('am-percepcao', fmtBonus(getSkillTotalByName('Percepção')));
    set('am-fort', fmtBonus(getSkillTotalByName('Fortitude')));
    set('am-ref', fmtBonus(getSkillTotalByName('Reflexos')));
    set('am-von', fmtBonus(getSkillTotalByName('Vontade')));

    // Defesa
    set('am-defesa', document.getElementById('defenseTotal')?.innerText || '');

    // PV / PM
    set('am-pv', getVal('pvMax') || '');
    const pmMax = getVal('pmMax') || '';
    set('am-pm', (pmMax && pmMax !== '0') ? pmMax : '');

    // Deslocamento
    fill('am-desl', getVal('charSpeed') || '');

    // Nome, tipo — preenche só se vazio
    fill('am-nome', getVal('charName') || '');
    const raca = getVal('charRace');
    const classeEl = document.getElementById('charClass');
    const tamanhoEl = document.getElementById('charSize');
    const tamanho = tamanhoEl ? tamanhoEl.options[tamanhoEl.selectedIndex]?.text : '';
    fill('am-tipo', [raca, tamanho].filter(Boolean).join(' '));

    // Atributos — preenche só se vazio
    [['FOR', 'am-for'], ['DES', 'am-des'], ['CON', 'am-con'], ['INT', 'am-int'], ['SAB', 'am-sab'], ['CAR', 'am-car']].forEach(([a, id]) => {
        fill(id, fmtBonus(getInt(`attr-${a}`)));
    });

    // Proficiências (obs de percepção)
    const profs = getVal('charProfs') || '';
    fill('am-percepcao-obs', profs);
}

function getSavedAmeacaData() {
    try { return JSON.parse(localStorage.getItem('t20AmeacaData') || '{}'); } catch { return {}; }
}

// ============================================================
// FIX 3 — Importar Ataques da ficha
// ============================================================
function importarAtaquesDaFicha() {
    const rows = document.querySelectorAll('#attacksList .atk-row');
    if (!rows.length) { alert('Nenhum ataque encontrado na ficha.'); return; }

    const existing = new Set(
        Array.from(document.querySelectorAll('#am-ataques-list .am-atk-nome'))
            .map(el => el.value.trim().toLowerCase())
    );

    let added = 0;
    rows.forEach(row => {
        const nome = row.querySelector('.inp-name')?.value?.trim() || '';
        const bonus = row.querySelector('.inp-bonus')?.value?.trim() || '';
        const dmg = row.querySelector('.inp-dmg')?.value?.trim() || '';
        const critR = row.querySelector('.inp-crit-range')?.value?.trim() || '20';
        const crit = row.querySelector('.inp-crit')?.value?.trim() || 'x2';
        if (!nome || existing.has(nome.toLowerCase())) return;
        const danoCompleto = critR && critR !== '20' ? `${dmg}, ${critR}-20/${crit}` : `${dmg}, ${crit}`;
        const bonusFmt = (parseInt(bonus) >= 0 && !bonus.startsWith('-')) ? `+${bonus}` : bonus;
        addAmeacaAtaque({ nome, bonus: bonusFmt, dano: danoCompleto });
        existing.add(nome.toLowerCase());
        added++;
    });

    saveAmeaca();
    if (added > 0) mostrarToastAmeaca(`⚔️ ${added} ataque(s) importado(s)!`);
    else mostrarToastAmeaca('Todos os ataques já estão na lista.');
}

// ============================================================
// FIX 4 — Importar Magias como habilidades (com botão ocultar)
// ============================================================
function importarMagiasDaFicha() {
    const magias = [];
    [1, 2, 3, 4, 5].forEach(circulo => {
        document.querySelectorAll(`#spellsList${circulo} .spell-row`).forEach(row => {
            const nome = row.querySelector('.inp-name')?.value?.trim();
            const pm = row.querySelector('.inp-pm')?.value?.trim();
            const escola = row.querySelector('.inp-school')?.value?.trim();
            const exec = row.querySelector('.inp-exec')?.value?.trim();
            const alcance = row.querySelector('.inp-range')?.value?.trim();
            const alvo = row.querySelector('.inp-target')?.value?.trim();
            const dur = row.querySelector('.inp-dur')?.value?.trim();
            const desc = row.querySelector('.inp-desc')?.value?.trim();
            if (!nome) return;
            const detalhes = [escola, exec && `Exec.: ${exec}`, alcance && `Alc.: ${alcance}`, alvo && `Alvo: ${alvo}`, dur && `Dur.: ${dur}`].filter(Boolean).join(' · ');
            magias.push({ nome: `${nome}${pm ? ` (${pm} PM)` : ''}`, tipo: 'Passiva', desc: [detalhes, desc].filter(Boolean).join('\n') });
        });
    });

    if (!magias.length) { alert('Nenhuma magia encontrada na ficha.'); return; }

    const existing = new Set(Array.from(document.querySelectorAll('#am-habilidades-list .am-hab-nome')).map(el => el.value.trim().toLowerCase()));
    let added = 0;
    magias.forEach(m => {
        if (existing.has(m.nome.toLowerCase())) return;
        addAmeacaHabilidade(m);
        existing.add(m.nome.toLowerCase());
        added++;
    });
    saveAmeaca();
    if (added > 0) mostrarToastAmeaca(`✨ ${added} magia(s) importada(s)!`);
    else mostrarToastAmeaca('Todas as magias já estão na lista.');
}

function toggleMagiasAmeaca() {
    document.querySelectorAll('#am-habilidades-list .am-row').forEach(row => {
        // Identifica linhas de magia pela presença de " PM)" no nome
        const nome = row.querySelector('.am-hab-nome')?.value || '';
        if (nome.includes(' PM)') || nome.includes('PM)')) {
            row.style.display = row.style.display === 'none' ? '' : 'none';
        }
    });
}

// ============================================================
// FIX 5 — Importar Perícias com checklist modal
// ============================================================
const PERICIAS_FIXAS = ['Iniciativa', 'Percepção', 'Fortitude', 'Reflexos', 'Vontade', 'Luta', 'Pontaria']; // já têm campos próprios

function abrirModalImportarPericias() {
    // Monta lista de perícias (excluindo as 5 fixas)
    const pericias = currentSkills
        .map((s, i) => ({
            nome: s.n === 'Ofício' && s.specialty ? `Ofício (${s.specialty})` : s.n,
            total: parseInt(document.getElementById(`skTotal${i}`)?.innerText) || 0
        }))
        .filter(s => {
            const base = s.nome.startsWith('Ofício') ? 'Ofício' : s.nome;
            return !PERICIAS_FIXAS.includes(s.nome) && !PERICIAS_FIXAS.includes(base);
        });

    if (!pericias.length) { alert('Nenhuma perícia disponível.'); return; }

    const modal = document.getElementById('modalImportarPericias');
    const lista = document.getElementById('pericias-import-list');
    lista.innerHTML = pericias.map((s, i) => `
        <label class="d-flex align-items-center gap-2 py-1 border-bottom" style="cursor:pointer;">
            <input type="checkbox" class="form-check-input m-0" id="pck-${i}" value="${i}">
            <span class="fw-bold" style="min-width:140px;">${s.nome}</span>
            <span class="text-danger fw-bold">${s.total >= 0 ? '+' : ''}${s.total}</span>
        </label>
    `).join('');

    // Guarda referência para confirmar
    modal._pericias = pericias;
    modal.style.display = 'flex';
}

function fecharModalPericias() {
    document.getElementById('modalImportarPericias').style.display = 'none';
}

function confirmarImportarPericias() {
    const modal = document.getElementById('modalImportarPericias');
    const pericias = modal._pericias || [];
    const checks = document.querySelectorAll('#pericias-import-list input[type=checkbox]:checked');
    const existing = new Set(Array.from(document.querySelectorAll('#am-pericias-list .am-per-nome')).map(el => el.value.trim().toLowerCase()));
    let added = 0;
    checks.forEach(chk => {
        const p = pericias[parseInt(chk.value)];
        if (!p || existing.has(p.nome.toLowerCase())) return;
        addAmeacaPericia({ nome: p.nome, valor: (p.total >= 0 ? '+' : '') + p.total });
        existing.add(p.nome.toLowerCase());
        added++;
    });
    saveAmeaca();
    fecharModalPericias();
    if (added > 0) mostrarToastAmeaca(`📋 ${added} perícia(s) importada(s)!`);
}

function marcarTodasPericias(val) {
    document.querySelectorAll('#pericias-import-list input[type=checkbox]').forEach(c => c.checked = val);
}

// Toast simples para ameaça (sem depender do sistema principal)
function mostrarToastAmeaca(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        background: '#1a2a1a', color: '#c8e6a0', padding: '10px 22px',
        borderRadius: '8px', fontWeight: '700', zIndex: '9999',
        boxShadow: '0 4px 14px rgba(0,0,0,.4)', fontSize: '0.9rem', transition: 'opacity .3s'
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; }, 2400);
    setTimeout(() => t.remove(), 2800);
}

// ============================================================
// FICHA DE AMEAÇA
// ============================================================

function saveAmeaca() {
    const ataques = [];
    document.querySelectorAll('#am-ataques-list .am-row').forEach(row => {
        ataques.push({
            nome: row.querySelector('.am-atk-nome')?.value || '',
            tipo: row.querySelector('.am-atk-tipo')?.value || '',
            bonus: row.querySelector('.am-atk-bonus')?.value || '',
            dano: row.querySelector('.am-atk-dano')?.value || '',
            desc: row.querySelector('.am-atk-desc')?.value || ''
        });
    });

    const habilidades = [];
    document.querySelectorAll('#am-habilidades-list .am-row').forEach(row => {
        habilidades.push({
            nome: row.querySelector('.am-hab-nome')?.value || '',
            tipo: row.querySelector('.am-hab-tipo')?.value || '',
            desc: row.querySelector('.am-hab-desc')?.value || ''
        });
    });

    const pericias = [];
    document.querySelectorAll('#am-pericias-list .am-row').forEach(row => {
        pericias.push({
            nome: row.querySelector('.am-per-nome')?.value || '',
            valor: row.querySelector('.am-per-valor')?.value || ''
        });
    });

    const data = {
        nome: document.getElementById('am-nome')?.value || '',
        tipo: document.getElementById('am-tipo')?.value || '',
        nd: document.getElementById('am-nd')?.value || '',
        iniciativa: document.getElementById('am-iniciativa')?.value || '',
        percepcao: document.getElementById('am-percepcao')?.value || '',
        percepcaoObs: document.getElementById('am-percepcao-obs')?.value || '',
        defesa: document.getElementById('am-defesa')?.value || '',
        fort: document.getElementById('am-fort')?.value || '',
        ref: document.getElementById('am-ref')?.value || '',
        von: document.getElementById('am-von')?.value || '',
        defesaObs: document.getElementById('am-defesa-obs')?.value || '',
        pv: document.getElementById('am-pv')?.value || '',
        desl: document.getElementById('am-desl')?.value || '',
        pm: document.getElementById('am-pm')?.value || '',
        atributos: {
            for: document.getElementById('am-for')?.value || '',
            des: document.getElementById('am-des')?.value || '',
            con: document.getElementById('am-con')?.value || '',
            int: document.getElementById('am-int')?.value || '',
            sab: document.getElementById('am-sab')?.value || '',
            car: document.getElementById('am-car')?.value || ''
        },
        ataques,
        habilidades,
        pericias,
        tesouro: document.getElementById('am-tesouro')?.value || ''
    };

    localStorage.setItem('t20AmeacaData', JSON.stringify(data));
}

function loadAmeaca() {
    const raw = localStorage.getItem('t20AmeacaData');
    if (!raw) return;
    try {
        const d = JSON.parse(raw);
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

        set('am-nome', d.nome);
        set('am-tipo', d.tipo);
        set('am-nd', d.nd);
        set('am-iniciativa', d.iniciativa);
        set('am-percepcao', d.percepcao);
        set('am-percepcao-obs', d.percepcaoObs);
        set('am-defesa', d.defesa);
        set('am-fort', d.fort);
        set('am-ref', d.ref);
        set('am-von', d.von);
        set('am-defesa-obs', d.defesaObs);
        set('am-pv', d.pv);
        set('am-desl', d.desl);
        set('am-pm', d.pm);
        set('am-tesouro', d.tesouro);

        if (d.atributos) {
            set('am-for', d.atributos.for);
            set('am-des', d.atributos.des);
            set('am-con', d.atributos.con);
            set('am-int', d.atributos.int);
            set('am-sab', d.atributos.sab);
            set('am-car', d.atributos.car);
        }

        if (d.ataques) d.ataques.forEach(a => addAmeacaAtaque(a));
        if (d.habilidades) d.habilidades.forEach(h => addAmeacaHabilidade(h));
        if (d.pericias) d.pericias.forEach(p => addAmeacaPericia(p));
    } catch (e) {
        console.error('Erro ao carregar ficha de ameaça:', e);
    }
}

function addAmeacaAtaque(data = {}) {
    const container = document.getElementById('am-ataques-list');
    const row = document.createElement('div');
    row.className = 'am-row am-ataque-row';
    row.innerHTML = `
        <div class="am-row-grip"><i class="bi bi-grip-vertical text-muted"></i></div>
        <div class="am-row-body">
            <div class="am-row-line">
                <input type="text" class="am-input am-atk-nome" placeholder="Nome (ex: Mordida)" value="${data.nome || ''}" oninput="saveAmeaca()">
                <select class="am-select am-atk-tipo" onchange="saveAmeaca()">
                    <option value="">Ação</option>
                    <option value="Padrão" ${data.tipo === 'Padrão' ? 'selected' : ''}>Padrão</option>
                    <option value="Livre" ${data.tipo === 'Livre' ? 'selected' : ''}>Livre</option>
                    <option value="Completa" ${data.tipo === 'Completa' ? 'selected' : ''}>Completa</option>
                    <option value="Movimento" ${data.tipo === 'Movimento' ? 'selected' : ''}>Movimento</option>
                    <option value="Reação" ${data.tipo === 'Reação' ? 'selected' : ''}>Reação</option>
                </select>
                <input type="text" class="am-input am-atk-bonus am-val-sm" placeholder="Bônus (+12)" value="${data.bonus || ''}" oninput="saveAmeaca()">
                <input type="text" class="am-input am-atk-dano am-val-md" placeholder="Dano (1d8+5, 19)" value="${data.dano || ''}" oninput="saveAmeaca()">
            </div>
            <textarea class="am-textarea am-atk-desc" placeholder="Descrição adicional (opcional)" oninput="saveAmeaca()">${data.desc || ''}</textarea>
        </div>
        <button class="am-row-del" onclick="this.closest('.am-row').remove(); updateCalculations(); saveAmeaca()" title="Remover"><i class="bi bi-x-lg"></i></button>
    `;
    container.appendChild(row);
}

function addAmeacaHabilidade(data = {}) {
    const container = document.getElementById('am-habilidades-list');
    const row = document.createElement('div');
    row.className = 'am-row am-hab-row';
    row.innerHTML = `
        <div class="am-row-grip"><i class="bi bi-grip-vertical text-muted"></i></div>
        <div class="am-row-body">
            <div class="am-row-line">
                <input type="text" class="am-input am-hab-nome fw-bold" placeholder="Nome da Habilidade" value="${data.nome || ''}" oninput="saveAmeaca()">
                <span class="am-paren">(</span>
                <select class="am-select am-hab-tipo" onchange="saveAmeaca()">
                    <option value="" ${!data.tipo ? 'selected' : ''}>— tipo —</option>
                    <option value="Padrão" ${data.tipo === 'Padrão' ? 'selected' : ''}>Padrão</option>
                    <option value="Livre" ${data.tipo === 'Livre' ? 'selected' : ''}>Livre</option>
                    <option value="Completa" ${data.tipo === 'Completa' ? 'selected' : ''}>Completa</option>
                    <option value="Movimento" ${data.tipo === 'Movimento' ? 'selected' : ''}>Movimento</option>
                    <option value="Reação" ${data.tipo === 'Reação' ? 'selected' : ''}>Reação</option>
                    <option value="Passiva" ${data.tipo === 'Passiva' ? 'selected' : ''}>Passiva</option>
                </select>
                <span class="am-paren">)</span>
            </div>
            <textarea class="am-textarea am-hab-desc" placeholder="Descrição da habilidade..." oninput="saveAmeaca()">${data.desc || ''}</textarea>
        </div>
        <button class="am-row-del" onclick="this.closest('.am-row').remove(); saveAmeaca()" title="Remover"><i class="bi bi-x-lg"></i></button>
    `;
    container.appendChild(row);
}

function addAmeacaPericia(data = {}) {
    const container = document.getElementById('am-pericias-list');
    const row = document.createElement('div');
    row.className = 'am-row am-per-row';
    row.innerHTML = `
        <input type="text" class="am-input am-per-nome" placeholder="Perícia" value="${data.nome || ''}" oninput="saveAmeaca()">
        <input type="text" class="am-input am-per-valor am-val-sm" placeholder="+0" value="${data.valor || ''}" oninput="saveAmeaca()">
        <button class="am-row-del" onclick="this.closest('.am-row').remove(); saveAmeaca()" title="Remover"><i class="bi bi-x-lg"></i></button>
    `;
    container.appendChild(row);
}

function limparAmeaca() {
    if (!confirm('Limpar todos os dados da Ficha de Ameaça?')) return;
    localStorage.removeItem('t20AmeacaData');
    document.getElementById('am-ataques-list').innerHTML = '';
    document.getElementById('am-habilidades-list').innerHTML = '';
    document.getElementById('am-pericias-list').innerHTML = '';
    ['am-nome', 'am-tipo', 'am-nd', 'am-iniciativa', 'am-percepcao', 'am-percepcao-obs',
        'am-defesa', 'am-fort', 'am-ref', 'am-von', 'am-defesa-obs', 'am-pv', 'am-desl', 'am-pm',
        'am-for', 'am-des', 'am-con', 'am-int', 'am-sab', 'am-car', 'am-tesouro'
    ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    mostrarToastAmeaca('🗑️ Ameaça limpa.');
}

// ─── PDF da Ameaça ──────────────────────────────────────────────
function exportarAmeacaPDF() {
    const nome = document.getElementById('am-nome')?.value || 'Ameaça';
    const tipo = document.getElementById('am-tipo')?.value || '';
    const nd = document.getElementById('am-nd')?.value || '—';

    const g = id => document.getElementById(id)?.value || '—';

    // Monta HTML para impressão
    const ataques = Array.from(document.querySelectorAll('#am-ataques-list .am-row')).map(r => {
        const nome = r.querySelector('.am-atk-nome')?.value || '';
        const tipo = r.querySelector('.am-atk-tipo')?.value || '';
        const bon = r.querySelector('.am-atk-bonus')?.value || '';
        const dano = r.querySelector('.am-atk-dano')?.value || '';
        const desc = r.querySelector('.am-atk-desc')?.value || '';
        if (!nome) return '';
        return `<div class="am-pdf-linha"><span class="am-pdf-chave">Ataque</span> ${nome}${tipo ? ' (' + tipo + ')' : ''} ${bon} (${dano})${desc ? '<br><small class="text-muted">' + desc + '</small>' : ''}</div>`;
    }).join('');

    const habilidades = Array.from(document.querySelectorAll('#am-habilidades-list .am-row')).map(r => {
        const hn = r.querySelector('.am-hab-nome')?.value || '';
        const htipo = r.querySelector('.am-hab-tipo')?.value || '';
        const hdesc = r.querySelector('.am-hab-desc')?.value || '';
        if (!hn) return '';
        return `<div class="am-pdf-linha"><span class="am-pdf-chave">${hn}${htipo ? ' (' + htipo + ')' : ''}</span> ${hdesc}</div>`;
    }).join('');

    const pericias = Array.from(document.querySelectorAll('#am-pericias-list .am-per-row')).map(r => {
        const pn = r.querySelector('.am-per-nome')?.value || '';
        const pv = r.querySelector('.am-per-valor')?.value || '';
        return pn ? `${pn} ${pv}` : '';
    }).filter(Boolean).join(', ');

    const atributos = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].map(a => {
        const v = document.getElementById(`am-${a.toLowerCase()}`)?.value || '—';
        return `<span><strong>${a}</strong> ${v}</span>`;
    }).join(' , ');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>${nome}</title>
    <style>
        body { font-family: Georgia, serif; font-size: 11pt; max-width: 680px; margin: 30px auto; color: #111; }
        h1 { font-size: 20pt; color: #8b0000; text-transform: uppercase; letter-spacing: .06em; margin: 0; border-bottom: 3px solid #8b0000; padding-bottom: 6px; }
        .tipo { font-style: italic; color: #444; font-size: 10pt; margin: 2px 0 10px; }
        .nd-badge { float: right; background: #8b0000; color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 14pt; font-weight: bold; margin-top: -4px; }
        .bloco { margin-bottom: 6px; }
        .chave { font-weight: bold; font-style: italic; color: #8b0000; }
        .am-pdf-chave { font-weight: bold; font-style: italic; color: #8b0000; }
        .am-pdf-linha { margin-bottom: 4px; }
        hr { border: none; border-top: 1px solid #d0b0b0; margin: 8px 0; }
        .atributos { background: #f9f4f4; border: 1px solid #e0c8c8; border-radius: 5px; padding: 6px 10px; text-align: center; display: flex; gap: 14px; justify-content: center; font-size: 10pt; }
        @media print { body { margin: 15mm; } }
    </style></head><body>
    <div class="nd-badge">ND ${nd}</div>
    <h1>${nome}</h1>
    <div class="tipo">${tipo}</div>
    <div class="bloco"><span class="chave">Iniciativa</span> ${g('am-iniciativa')} , <span class="chave">Percepção</span> ${g('am-percepcao')} ${g('am-percepcao-obs') !== '—' ? `<em>${g('am-percepcao-obs')}</em>` : ''}</div>
    <div class="bloco"><span class="chave">Defesa</span> ${g('am-defesa')} , <span class="chave">Fort</span> ${g('am-fort')} , <span class="chave">Ref</span> ${g('am-ref')} , <span class="chave">Von</span> ${g('am-von')} ${g('am-defesa-obs') !== '—' ? `<em>${g('am-defesa-obs')}</em>` : ''}</div>
    <div class="bloco"><span class="chave">Pontos de Vida</span> ${g('am-pv')}</div>
    <div class="bloco"><span class="chave">Deslocamento</span> ${g('am-desl')}</div>
    <hr>
    ${g('am-pm') !== '—' ? `<div class="bloco"><span class="chave">Pontos de Mana</span> ${g('am-pm')}</div>` : ''}
    ${ataques ? `<div class="bloco"><span class="chave" style="font-size:10.5pt;text-transform:uppercase;">Ataques</span>${ataques}</div><hr>` : ''}
    ${habilidades ? `<div class="bloco"><span class="chave" style="font-size:10.5pt;text-transform:uppercase;">Habilidades Especiais</span>${habilidades}</div><hr>` : ''}
    <div class="atributos">${atributos}</div>
    <hr>
    ${pericias ? `<div class="bloco"><span class="chave">Perícias</span> ${pericias}</div><hr>` : ''}
    <div class="bloco"><span class="chave">Tesouro</span> ${g('am-tesouro')}</div>
    </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
}

// ─── Copiar Resumo Ameaça (Discord) ─────────────────────────────
function copiarResumoAmeaca() {
    const g = id => document.getElementById(id)?.value?.trim() || '—';
    const nome = g('am-nome');
    const tipo = g('am-tipo');
    const nd = g('am-nd');

    const pericias = Array.from(document.querySelectorAll('#am-pericias-list .am-per-row')).map(r => {
        const pn = r.querySelector('.am-per-nome')?.value || '';
        const pv = r.querySelector('.am-per-valor')?.value || '';
        return pn ? `${pn} ${pv}` : '';
    }).filter(Boolean).join(', ');

    const ataques = Array.from(document.querySelectorAll('#am-ataques-list .am-row')).map(r => {
        const an = r.querySelector('.am-atk-nome')?.value || '';
        const ab = r.querySelector('.am-atk-bonus')?.value || '';
        const ad = r.querySelector('.am-atk-dano')?.value || '';
        return an ? `${an} ${ab} (${ad})` : '';
    }).filter(Boolean).join(' | ');
    // --- LÓGICA DE COLETA DE MAGIAS CORRIGIDA ---
    const habs = Array.from(document.querySelectorAll('#am-habilidades-list .am-row'));
    let magiasPorCirculo = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    let temMagia = false;

    habs.forEach(row => {
        const nomeHab = row.querySelector('.am-hab-nome')?.value?.trim() || '';
        const descHab = row.querySelector('.am-hab-desc')?.value?.trim() || '';

        // SÓ PROCESSA SE O NOME NÃO ESTIVER VAZIO
        if (nomeHab !== '') {
            const matchCirculo = descHab.match(/\[(\d)º\s*Circ\]/i);
            const matchPM = nomeHab.match(/\((\d+)\s*PM\)/i);
            const pmToCirculo = { "1": 1, "3": 2, "6": 3, "10": 4, "15": 5 };

            let circ = null;
            if (matchCirculo) {
                circ = parseInt(matchCirculo[1]);
            } else if (matchPM) {
                circ = pmToCirculo[matchPM[1]] || null;
            }

            if (circ && circ >= 1 && circ <= 5) {
                const nomeLimpo = nomeHab.split(' (')[0];
                magiasPorCirculo[circ].push(nomeLimpo);
                temMagia = true;
            }
        }
    });

    let txtMagias = "";
    if (temMagia) {
        txtMagias = "Magias:\n";
        for (let c = 1; c <= 5; c++) {
            if (magiasPorCirculo[c].length > 0) {
                txtMagias += `* ${c}º círculo: ${magiasPorCirculo[c].join(', ')}\n`;
            }
        }
    }
    // --------------------------------------------

    let txt = `**${nome.toUpperCase()}** — ND ${nd}\n`;
    if (tipo && tipo !== '—') txt += `*${tipo}*\n`;
    txt += `\`\`\`\n`;
    txt += `Ini ${g('am-iniciativa')} · Per ${g('am-percepcao')}`;
    if (g('am-percepcao-obs') !== '—') txt += ` (${g('am-percepcao-obs')})`;
    txt += `\n`;
    txt += `Def ${g('am-defesa')} · Fort ${g('am-fort')} · Ref ${g('am-ref')} · Von ${g('am-von')}\n`;
    if (g('am-defesa-obs') !== '—') txt += `${g('am-defesa-obs')}\n`;
    txt += `PV ${g('am-pv')} · Desl. ${g('am-desl')}\n`;
    if (g('am-pm') !== '—') txt += `PM ${g('am-pm')}\n`;
    if (ataques) txt += `Atq: ${ataques}\n`;
    if (txtMagias) txt += txtMagias;
    txt += `FOR ${g('am-for')} · DES ${g('am-des')} · CON ${g('am-con')} · INT ${g('am-int')} · SAB ${g('am-sab')} · CAR ${g('am-car')}\n`;
    if (pericias) txt += `Perícias: ${pericias}\n`;
    txt += `Tesouro: ${g('am-tesouro')}\n`;
    txt += `\`\`\``;

    navigator.clipboard.writeText(txt).then(() => mostrarToastAmeaca('📋 Resumo copiado para o Discord!'))
        .catch(() => { prompt('Copie o texto abaixo:', txt); });
}

// ─── Exportar / Importar JSON da Ameaça ─────────────────────────
function exportAmeaca() {
    saveAmeaca();
    const data = localStorage.getItem('t20AmeacaData') || '{}';
    const nome = document.getElementById('am-nome')?.value?.trim() || 'ameaca';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ameaca_${nome.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    mostrarToastAmeaca('💾 Ameaça salva como JSON!');
}

function importAmeacaArquivo(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            localStorage.setItem('t20AmeacaData', JSON.stringify(data));
            // Limpa listas dinâmicas antes de recarregar
            ['am-ataques-list', 'am-habilidades-list', 'am-pericias-list'].forEach(id => {
                const el = document.getElementById(id); if (el) el.innerHTML = '';
            });
            loadAmeaca();
            mostrarToastAmeaca('✅ Ameaça carregada!');
        } catch {
            alert('Arquivo JSON inválido.');
        }
    };
    reader.readAsText(file);
    input.value = ''; // reset para permitir recarregar o mesmo arquivo
}

// Exporta habilidades especiais da ameaça → abilitiesClassList da ficha
function exportarHabilidadesParaFicha() {
    const habs = [];
    document.querySelectorAll('#am-habilidades-list .am-row').forEach(row => {
        const nome = row.querySelector('.am-hab-nome')?.value?.trim();
        const tipo = row.querySelector('.am-hab-tipo')?.value;
        const desc = row.querySelector('.am-hab-desc')?.value?.trim();
        if (nome) {
            const nomeCompleto = tipo ? `${nome} (${tipo})` : nome;
            habs.push({ name: nomeCompleto, desc: desc || '' });
        }
    });
    if (habs.length === 0) { alert('Nenhuma habilidade para exportar.'); return; }

    const list = document.getElementById('abilitiesClassList');
    if (!list) { alert('Aba de personagem não encontrada.'); return; }
    const existing = new Set(Array.from(list.querySelectorAll('.inp-name')).map(el => el.value.trim().toLowerCase()));
    let added = 0;
    habs.forEach(h => {
        if (!existing.has(h.name.toLowerCase())) {
            addAbility('abilitiesClassList', h.name, h.desc);
            existing.add(h.name.toLowerCase());
            added++;
        }
    });
    saveData();
    alert(`✅ ${added} habilidade(s) exportada(s) para Poderes & Habilidades.`);
    // Vai para a aba personagem
    document.getElementById('tab-personagem-btn')?.click();
}

// Importa habilidades de classe/raça da ficha → Ficha de Ameaça
function importarHabilidadesDaFicha() {
    const habs = [];
    ['#abilitiesRaceList', '#abilitiesClassList'].forEach(sel => {
        document.querySelectorAll(`${sel} .ability-row`).forEach(row => {
            const nome = row.querySelector('.inp-name')?.value?.trim();
            const desc = row.querySelector('.inp-desc')?.value?.trim();
            if (nome) habs.push({ nome, desc: desc || '' });
        });
    });
    if (habs.length === 0) { alert('Nenhuma habilidade encontrada na aba Personagem.'); return; }

    const existing = new Set(Array.from(document.querySelectorAll('#am-habilidades-list .am-hab-nome')).map(el => el.value.trim().toLowerCase()));
    let added = 0;
    habs.forEach(h => {
        // Parse nome (tipo) se houver parêntese
        const m = h.nome.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
        const data = m ? { nome: m[1].trim(), tipo: m[2].trim(), desc: h.desc } : { nome: h.nome, tipo: '', desc: h.desc };
        if (!existing.has(data.nome.toLowerCase())) {
            addAmeacaHabilidade(data);
            existing.add(data.nome.toLowerCase());
            added++;
        }
    });
    saveAmeaca();
    alert(`✅ ${added} habilidade(s) importada(s) da ficha.`);
}

// Preenche campos básicos da ameaça usando dados da ficha atual (personagem)
function preencherAmeacaDaFicha() {
    if (!confirm('Preencher campos da Ameaça com os dados atuais da ficha do Personagem? Os campos existentes serão sobrescritos.')) return;

    const get = id => document.getElementById(id)?.value || '';

    // Nome e tipo
    const nome = get('charName'); if (nome) document.getElementById('am-nome').value = nome;
    const raca = get('charRace');
    const tamanho = document.getElementById('charSize');
    const tamanhoTexto = tamanho ? tamanho.options[tamanho.selectedIndex]?.text : '';
    if (raca || tamanhoTexto) document.getElementById('am-tipo').value = [raca, tamanhoTexto].filter(Boolean).join(' ');

    // Defesa
    const defTotal = document.getElementById('defenseTotal')?.textContent;
    if (defTotal) document.getElementById('am-defesa').value = defTotal;

    // PV e PM
    const pv = get('pvMax'); if (pv) document.getElementById('am-pv').value = pv;
    const pm = get('pmMax'); if (pm) document.getElementById('am-pm').value = pm;

    // Deslocamento
    const speed = get('charSpeed'); if (speed) document.getElementById('am-desl').value = speed;

    // Atributos
    ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].forEach(a => {
        const val = get(`attr-${a}`);
        if (val) document.getElementById(`am-${a.toLowerCase()}`).value = val;
    });

    saveAmeaca();
    alert('✅ Campos preenchidos da ficha do Personagem!');
}

// Inicialização da aba de ameaça
document.addEventListener('DOMContentLoaded', () => {
    loadAmeaca();
});


// Grimorio

let circuloAtual = 1;

function abrirGrimorio(circulo) {
    circuloAtual = circulo;
    document.getElementById('grimorioTitulo').innerText = `🔮 Grimório: ${circulo}º Círculo`;
    document.getElementById('modalGrimorio').style.display = 'flex';
    document.getElementById('inputBuscaMagia').value = '';
    filtrarMagias();
}

function fecharGrimorio() {
    document.getElementById('modalGrimorio').style.display = 'none';
}

function filtrarMagias() {
    const termo = document.getElementById('inputBuscaMagia').value.toLowerCase();
    const lista = document.getElementById('listaMagiasBusca');

    // Filtra pelo círculo e pelo nome (buscando no spells_db.js)
    const magiasFiltradas = SPELLS_DB.filter(m => m.c === circuloAtual && m.n.toLowerCase().includes(termo));

    lista.innerHTML = magiasFiltradas.map(m => `
        <div class="d-flex justify-content-between align-items-center p-2 border-bottom hover-bg-light" style="cursor:pointer;" onclick="selecionarMagia('${m.n}')">
            <div>
                <div class="fw-bold" style="color: #6f42c1;">${m.n}</div>
                <small class="text-muted">${m.e} | ${m.ex}</small>
            </div>
            <i class="bi bi-plus-circle-fill text-primary"></i>
        </div>
    `).join('');
}

function selecionarMagia(nomeMagia) {
    const magia = SPELLS_DB.find(m => m.n === nomeMagia);
    if (magia) {
        // Formata os aprimoramentos para texto
        let descCompleta = magia.desc;

        if (magia.aprimoramentos && magia.aprimoramentos.length > 0) {
            descCompleta += "\n\n--- APRIMORAMENTOS ---";
            magia.aprimoramentos.forEach(aprim => {
                descCompleta += `\n• +${aprim.cost} PM: ${aprim.desc}`;
            });
        }

        const spellData = {
            name: magia.n,
            pm: spellCosts[magia.c], // Puxa 1, 3, 6, 10 ou 15 conforme o círculo
            school: magia.e,
            exec: magia.ex,
            range: magia.a,
            target: magia.al,
            dur: magia.d,
            res: magia.r,
            desc: descCompleta // Agora inclui a descrição + aprimoramentos formatados
        };

        addSpell(magia.c, spellData); // Insere na ficha
        fecharGrimorio(); // Fecha o modal
    }
}
// ================================================================
// SISTEMA DE MODIFICADORES TEMPORÁRIOS
// ================================================================

// Tipos de bônus globais que têm listas individuais
const GLOBAL_MOD_TYPES = ['rolagens', 'pericias', 'ataque', 'dano', 'defesa'];

// Helper: soma todas as linhas da lista de um bônus global e atualiza o input readonly
function getTempMod(id) {
    // Identifica se este id corresponde a um tipo global com lista
    const tipo = GLOBAL_MOD_TYPES.find(t => `mod-${t}` === id);
    if (tipo) {
        // Para 'pericias' global, a lista tem id 'mod-pericias-global-list'
        const listId = tipo === 'pericias' ? 'mod-pericias-global-list' : `mod-${tipo}-list`;
        const container = document.getElementById(listId);
        let total = 0;
        if (container) {
            container.querySelectorAll('.mod-global-row').forEach(row => {
                total += parseInt(row.querySelector('.mod-global-val')?.value) || 0;
            });
        }
        // Sincroniza o campo readonly de exibição e classe de highlight
        const display = document.getElementById(id);
        if (display) {
            display.value = total !== 0 ? total : '';
            display.classList.toggle('has-value', total !== 0);
        }
        return total;
    }
    return parseInt(document.getElementById(id)?.value) || 0;
}

// Chamado em oninput de qualquer campo de modificador
function aplicarModificadores() {
    updateCalculations();
}

// ── Toggle da lista de bônus globais ───────────────────────────
function toggleModGlobalList(tipo) {
    const wrapId = tipo === 'pericias' ? 'mod-pericias-list-wrap' : `mod-${tipo}-list-wrap`;
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.classList.toggle('d-none');
}

// ── Adicionar linha em bônus global ────────────────────────────
function addModGlobal(tipo) {
    const listId = tipo === 'pericias' ? 'mod-pericias-global-list' : `mod-${tipo}-list`;
    const container = document.getElementById(listId);
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'mod-global-row d-flex align-items-center gap-1 mb-1';
    row.innerHTML = `
        <input type="text" class="form-control form-control-sm mod-global-nome" placeholder="Fonte" style="flex:1; font-size:0.75rem;" oninput="aplicarModificadores()">
        <input type="number" class="form-control form-control-sm mod-global-val" placeholder="+0" style="width:58px; font-size:0.75rem;" oninput="aplicarModificadores()">
        <button class="btn btn-sm btn-outline-danger p-0 px-1" onclick="this.closest('.mod-global-row').remove(); aplicarModificadores();" title="Remover">
            <i class="bi bi-x-lg"></i>
        </button>`;
    container.appendChild(row);
}

// ── Adicionar/remover linhas dinâmicas ──────────────────────────

function addModBonus() {
    const container = document.getElementById('mod-bonus-list');
    const row = document.createElement('div');
    row.className = 'mod-bonus-row d-flex align-items-center gap-2 mb-2';
    row.innerHTML = `
        <input type="text" class="form-control form-control-sm mod-bonus-nome" placeholder="Nome do bônus (ex: Benção)" style="flex:1;">
        <input type="number" class="form-control form-control-sm mod-bonus-val" placeholder="+0" style="width:70px;" oninput="aplicarModificadores()">
        <button class="btn btn-sm btn-outline-danger p-0 px-1" onclick="this.closest('.mod-bonus-row').remove(); aplicarModificadores();" title="Remover">
            <i class="bi bi-x-lg"></i>
        </button>`;
    container.appendChild(row);
}

function addModPericia() {
    const container = document.getElementById('mod-pericias-list');
    // Monta opções a partir das perícias atuais
    const opts = currentSkills.map(s => `<option value="${s.n}">${s.n}</option>`).join('');
    const row = document.createElement('div');
    row.className = 'mod-pericia-row d-flex align-items-center gap-2 mb-2';
    row.innerHTML = `
        <select class="form-select form-select-sm mod-per-sel" style="flex:1;" onchange="aplicarModificadores()">
            <option value="">— Perícia —</option>${opts}
        </select>
        <input type="number" class="form-control form-control-sm mod-per-val" placeholder="+0" style="width:70px;" oninput="aplicarModificadores()">
        <input type="text" class="form-control form-control-sm mod-per-origem" placeholder="Fonte" style="width:100px;" oninput="aplicarModificadores()">
        <button class="btn btn-sm btn-outline-danger p-0 px-1" onclick="this.closest('.mod-pericia-row').remove(); aplicarModificadores();" title="Remover">
            <i class="bi bi-x-lg"></i>
        </button>`;
    container.appendChild(row);
}

function addParceiro() {
    const container = document.getElementById('mod-parceiros-list');
    const row = document.createElement('div');
    // d-flex com flex-wrap permite que os itens se organizem conforme a largura
    row.className = 'mod-parceiro-row d-flex flex-wrap align-items-start gap-2 mb-3 p-2 border-bottom';

    row.innerHTML = `
        <div class="d-flex gap-2 flex-grow-1" style="min-width: 250px;">
            <input type="text" class="form-control form-control-sm mod-par-nome" placeholder="Nome" style="flex: 2;" oninput="atualizarHudMods()">
            <input type="text" class="form-control form-control-sm mod-par-tipo" placeholder="Tipo" style="flex: 1;" oninput="atualizarHudMods()">
            <button class="btn btn-sm btn-outline-danger p-0 px-2" onclick="this.closest('.mod-parceiro-row').remove(); atualizarHudMods();" title="Remover">
                <i class="bi bi-trash"></i>
            </button>
        </div>
        
        <div class="flex-grow-1" style="min-width: 300px;">
            <textarea class="form-control form-control-sm mod-par-bonus" placeholder="Bônus e Habilidades do Parceiro" rows="2" style="width: 100%;" oninput="atualizarHudMods()"></textarea>
        </div>`;

    container.appendChild(row);
}

// ── Limpar tudo ─────────────────────────────────────────────────

function limparModificadores() {
    if (!confirm('Limpar todos os modificadores temporários e condições?')) return;

    // 1. Limpa os displays readonly dos globais e classe de highlight
    ['mod-rolagens', 'mod-pericias', 'mod-ataque', 'mod-dano', 'mod-defesa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.classList.remove('has-value'); }
    });
    // Limpa os atributos temporários
    ['mod-attr-FOR', 'mod-attr-DES', 'mod-attr-CON', 'mod-attr-INT', 'mod-attr-SAB', 'mod-attr-CAR'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // 2. Limpa as listas globais individuais
    ['mod-rolagens-list', 'mod-pericias-global-list', 'mod-ataque-list', 'mod-dano-list', 'mod-defesa-list'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    // Fecha os painéis expansíveis
    GLOBAL_MOD_TYPES.forEach(t => {
        const wrap = document.getElementById(`mod-${t}-list-wrap`);
        if (wrap) wrap.classList.add('d-none');
    });

    // 3. Limpa as listas dinâmicas (Bônus livres, Perícias específicas e Parceiros)
    ['mod-bonus-list', 'mod-pericias-list', 'mod-parceiros-list'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    // 4. Desmarca todas as condições de jogo
    document.querySelectorAll('.cond-check').forEach(chk => {
        chk.checked = false;
    });

    // 5. Salva o estado limpo e atualiza toda a ficha
    saveData();
    updateCalculations();
}

// ── HUD: indicador compacto abaixo da foto ──────────────────────

function atualizarHudMods() {
    const hud = document.getElementById('modHud');
    if (!hud) return;

    const partes = [];

    // Ícones de modificadores globais — agora mostra cada fonte individualmente
    const globalDefs = [
        { tipo: 'rolagens', icon: '🎲', label: 'Rolagens' },
        { tipo: 'pericias', icon: '📖', label: 'Perícias' },
        { tipo: 'ataque', icon: '⚔️', label: 'Ataque' },
        { tipo: 'dano', icon: '🔥', label: 'Dano' },
        { tipo: 'defesa', icon: '🛡️', label: 'Defesa' },
    ];
    globalDefs.forEach(({ tipo, icon, label }) => {
        const listId = tipo === 'pericias' ? 'mod-pericias-global-list' : `mod-${tipo}-list`;
        const container = document.getElementById(listId);
        if (!container) return;
        container.querySelectorAll('.mod-global-row').forEach(row => {
            const nome = row.querySelector('.mod-global-nome')?.value?.trim() || label;
            const v = parseInt(row.querySelector('.mod-global-val')?.value) || 0;
            if (v !== 0) {
                const sinal = v > 0 ? `+${v}` : `${v}`;
                partes.push(`<span class="mod-hud-item" title="${label}: ${nome} ${sinal}">${icon}<span class="mod-hud-val">${sinal}</span></span>`);
            }
        });
    });

    // Bônus livres ativos
    document.querySelectorAll('#mod-bonus-list .mod-bonus-row').forEach(row => {
        const nome = row.querySelector('.mod-bonus-nome')?.value?.trim() || 'Bônus';
        const v = parseInt(row.querySelector('.mod-bonus-val')?.value) || 0;
        if (v !== 0) partes.push(`<span class="mod-hud-item" title="${nome}">✨<span class="mod-hud-val">${v > 0 ? '+' : ''}${v}</span></span>`);
    });

    // Perícias específicas
    document.querySelectorAll('#mod-pericias-list .mod-pericia-row').forEach(row => {
        const per = row.querySelector('.mod-per-sel')?.value;
        const v = parseInt(row.querySelector('.mod-per-val')?.value) || 0;
        const origem = row.querySelector('.mod-per-origem')?.value;
        if (per && v !== 0) {
            const origemStr = origem ? ` (${origem})` : '';
            partes.push(`<span class="mod-hud-item" title="${per}${origemStr}">📊<span class="mod-hud-val">${v > 0 ? '+' : ''}${v}</span></span>`);
        }
    });

    // Parceiros
    document.querySelectorAll('#mod-parceiros-list .mod-parceiro-row').forEach(row => {
        const nome = row.querySelector('.mod-par-nome')?.value?.trim();
        const bonus = row.querySelector('.mod-par-bonus')?.value?.trim();
        if (nome) partes.push(`<span class="mod-hud-parceiro" title="${bonus || ''}">👥 ${nome}</span>`);
    });

    //Condições
    document.querySelectorAll('.cond-check:checked').forEach(chk => {
        const nome = CONDICOES_T20[chk.value].nome;
        partes.push(`<span class="mod-hud-item bg-warning text-dark" title="${nome}">⚠️<span class="mod-hud-val">${nome}</span></span>`);
    });

    ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].forEach(a => {
        const v = getInt(`mod-attr-${a}`);
        if (v !== 0) partes.push(`<span class="mod-hud-item bg-primary text-white" title="${a} Temp">${a} <span class="mod-hud-val">${v > 0 ? '+' : ''}${v}</span></span>`);
    });

    if (partes.length === 0) {
        hud.classList.add('d-none');
        hud.innerHTML = '';
    } else {
        hud.classList.remove('d-none');
        hud.innerHTML = partes.join('');
    }
}
