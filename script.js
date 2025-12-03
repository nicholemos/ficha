// --- DADOS E CONFIGURAÇÕES ---
const attrs = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];

const defaultSkills = [
    { n: 'Acrobacia', a: 'DES' }, { n: 'Adestramento', a: 'CAR' }, { n: 'Atletismo', a: 'FOR' },
    { n: 'Atuação', a: 'CAR' }, { n: 'Cavalgar', a: 'DES' }, { n: 'Conhecimento', a: 'INT' },
    { n: 'Cura', a: 'SAB' }, { n: 'Diplomacia', a: 'CAR' }, { n: 'Enganação', a: 'CAR' },
    { n: 'Fortitude', a: 'CON' }, { n: 'Furtividade', a: 'DES' }, { n: 'Guerra', a: 'INT' },
    { n: 'Iniciativa', a: 'DES' }, { n: 'Intimidação', a: 'CAR' }, { n: 'Intuição', a: 'SAB' },
    { n: 'Investigação', a: 'INT' }, { n: 'Jogatina', a: 'CAR' }, { n: 'Ladinagem', a: 'DES' },
    { n: 'Luta', a: 'FOR' }, { n: 'Misticismo', a: 'INT' }, { n: 'Nobreza', a: 'INT' },
    { n: 'Ofício', a: 'INT' }, { n: 'Percepção', a: 'SAB' }, { n: 'Pilotagem', a: 'DES' },
    { n: 'Pontaria', a: 'DES' }, { n: 'Reflexos', a: 'DES' }, { n: 'Religião', a: 'SAB' },
    { n: 'Sobrevivência', a: 'SAB' }, { n: 'Vontade', a: 'SAB' }
];

const spellCosts = { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15 };
let currentSkills = [];
let currentLoadBonus = 0; // Bônus manual para a carga

// --- INICIALIZAÇÃO ---
window.onload = () => {
    try {
        currentSkills = JSON.parse(JSON.stringify(defaultSkills));
        renderStructure();
        loadData();
        attachGlobalListeners();
        // NOVA CHAMADA:
        enableDragAndDrop();
    } catch (e) { console.error(e); }
    setTimeout(updateCalculations, 100);
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

        const nameDisplay = isDefault
            ? `<span class="fw-bold text-truncate d-block" title="${s.n}" style="font-size:0.9em; padding-top:2px;">${s.n}</span>`
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
                <div class="col-10"><label class="form-label-sm">DESCRIÇÃO</label><input type="text" class="form-control form-control-sm border-0 border-bottom inp-desc" placeholder="Detalhes..." value="${data ? data.desc : ''}"></div>
                <div class="col-2 d-flex align-items-end"><button class="btn btn-sm btn-danger w-100 py-0" onclick="removeAttack(this)"><i class="bi bi-trash"></i></button></div>
            </div>
        </div>`;
    container.appendChild(div); if (!data) saveData();
}

function removeAttack(btn) { if (confirm('Remover ataque?')) { btn.closest('.atk-row').remove(); saveData(); } }

function addDefenseItem(data = null) {
    const container = document.getElementById('defenseList'); if (!container) return;
    const div = document.createElement('div'); div.className = 'border-bottom pb-2 mb-2 def-row';
    div.innerHTML = `
        <div class="row g-1 align-items-center text-center def-summary mb-2">
            <div class="col-1 fs-5 d-flex align-items-center justify-content-center">
                <i class="bi bi-grip-vertical drag-handle me-1" style="font-size: 0.8rem;"></i>
                <i class="bi bi-magic"></i>
            </div>
            <div class="col-5"><input type="text" class="form-control form-control-sm inp-name text-start" placeholder="Item Extra" value="${data ? data.name : ''}"></div>
            <div class="col-2"><input type="number" inputmode="numeric" class="form-control form-control-sm inp-bonus fw-bold text-success" placeholder="+0" value="${data ? data.bonus : ''}" oninput="updateCalculations()"></div>
            <div class="col-2"></div>
            <div class="col-2"><button class="btn btn-sm btn-outline-danger border-0" onclick="removeDefenseItem(this)"><i class="bi bi-trash"></i></button></div>
        </div>`;
    container.appendChild(div); if (!data) saveData();
}
function removeDefenseItem(btn) { if (confirm('Remover item?')) { btn.closest('.def-row').remove(); updateCalculations(); saveData(); } }
function checkHeavyArmor() { if (getVal('armorType') === 'heavy') { const chk = document.getElementById('applyDefAttr'); if (chk) chk.checked = false; } updateCalculations(); }

function addInventoryItem(data = null) {
    const container = document.getElementById('inventoryList'); if (!container) return;
    const div = document.createElement('div'); div.className = 'row g-1 align-items-center mb-2 inv-row border-bottom pb-1';
    div.innerHTML = `
        <div class="col-1 text-center"><i class="bi bi-grip-vertical drag-handle"></i></div>
        <div class="col-5"><input type="text" class="form-control form-control-sm fw-bold inp-name" placeholder="Item" value="${data ? data.name : ''}"></div>
        <div class="col-2"><input type="number" inputmode="numeric" class="form-control form-control-sm text-center inp-qtd" placeholder="1" value="${data ? data.qtd : '1'}" oninput="updateCalculations()"></div>
        <div class="col-2"><input type="number" inputmode="numeric" class="form-control form-control-sm text-center inp-slots" placeholder="0" value="${data ? data.slots : '0'}" step="0.5" oninput="updateCalculations()"></div>
        <div class="col-2 text-center"><button class="btn btn-sm btn-outline-danger border-0" onclick="removeInventoryItem(this)"><i class="bi bi-trash"></i></button></div>`;
    container.appendChild(div); if (!data) saveData();
}
function removeInventoryItem(btn) { if (confirm('Remover item?')) { btn.closest('.inv-row').remove(); updateCalculations(); saveData(); } }

function addAbility(data = null) {
    const container = document.getElementById('abilitiesList'); if (!container) return;
    const div = document.createElement('div'); div.className = 'col-md-6 ability-row';
    div.innerHTML = `
        <div class="border rounded p-2 h-100 position-relative" style="background-color: #fdfdfd;">
            <div class="d-flex align-items-center gap-2 mb-1">
                <i class="bi bi-grip-vertical drag-handle"></i>
                <i class="bi bi-lightning-charge-fill text-warning fs-5"></i>
                <input type="text" class="form-control form-control-sm fw-bold border-0 border-bottom p-0 inp-name" placeholder="Nome do Poder" value="${data ? data.name : ''}">
                <button class="btn btn-sm btn-light border-0 p-0 ms-auto" onclick="toggleDetail(this)"><i class="bi bi-chevron-down"></i></button>
            </div>
            <div class="ability-details d-none mt-2 pt-2 border-top">
                <textarea class="form-control form-control-sm border-0 bg-light inp-desc" rows="4" placeholder="Descrição...">${data ? data.desc : ''}</textarea>
                <div class="text-end mt-1"><button class="btn btn-sm btn-outline-danger border-0 py-0" onclick="removeAbility(this)">Excluir</button></div>
            </div>
        </div>`;
    container.appendChild(div); if (!data) saveData();
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

    // Adiciona o bônus manual
    const totalSlots = baseLimit + currentLoadBonus;

    const currentSlots = Array.from(document.querySelectorAll('#inventoryList .inv-row .inp-slots')).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);

    setText('loadCurrent', currentSlots.toFixed(1));
    setText('loadLimit', totalSlots);
}
// --- FIM NOVAS FUNÇÕES DE CARGA ---


function updateCalculations() {
    try {
        let level = getInt('charLevel');
        if (level < 1) level = 1; if (level > 20) level = 20;
        const halfLevel = Math.floor(level / 2);

        // --- CÁLCULO DE CARGA ---
        calcLoad();

        const armorPen = getInt('armorPenalty'); const shieldPen = getInt('shieldPenalty');
        const totalPenalty = Math.abs(armorPen) + Math.abs(shieldPen);
        const penaltySkills = ['Acrobacia', 'Furtividade', 'Ladinagem'];
        const sizeVal = getInt('charSize');

        let trainBonus = 2; if (level >= 15) trainBonus = 6; else if (level >= 7) trainBonus = 4;

        const skillValues = {};

        currentSkills.forEach((s, i) => {
            const attrVal = getInt(`attr-${s.a}`);
            const check = document.getElementById(`skTrain${i}`); if (check) s.trained = check.checked;
            const trained = s.trained ? trainBonus : 0;
            const other = getInt(`skOther${i}`);
            let total = halfLevel + attrVal + trained + other;

            // Penalidade de Armadura/Escudo
            if (penaltySkills.includes(s.n)) {
                total -= totalPenalty;
            }

            // Penalidade de Tamanho (Furtividade)
            if (s.n === 'Furtividade') {
                total += sizeVal;
            }

            setText(`skHalfLevel${i}`, halfLevel);
            setText(`skAttrVal${i}`, attrVal);
            setText(`skTrainVal${i}`, trained);
            setText(`skTotal${i}`, total);
            skillValues[s.n] = total;
        });

        // --- DEFESA ---
        const defAttr = getVal('defAttrSelect');
        const defAttrVal = getInt(`attr-${defAttr}`);
        const applyDefAttr = document.getElementById('applyDefAttr') ? document.getElementById('applyDefAttr').checked : true;
        const armorBonus = getInt('armorBonus');
        const shieldBonus = getInt('shieldBonus');
        let otherBonus = 0;
        document.querySelectorAll('#defenseList .def-row .inp-bonus').forEach(input => { otherBonus += (parseInt(input.value) || 0); });
        const totalDefense = 10 + (applyDefAttr ? defAttrVal : 0) + armorBonus + shieldBonus + otherBonus;

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
        if (barPV) barPV.style.width = `${(pvCurrent / pvMax) * 100}%`;
        const barPM = document.getElementById('barPM');
        if (barPM) barPM.style.width = `${(pmCurrent / pmMax) * 100}%`;

        // --- MAGIAS CD ---
        const spellCDAttr = getVal('spellCDAttrSelect');
        const spellCDAttrVal = getInt(`attr-${spellCDAttr}`);
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
                const skillBonus = skillValues[selectedSkill] || 0;
                const modBonus = getInt(modInput.id || modInput.value);
                const totalBonus = skillBonus + modBonus;
                bonusInput.value = totalBonus > 0 ? `+${totalBonus}` : totalBonus;
            }
        });

    } catch (e) { console.error("Erro em updateCalculations:", e); }
}

function saveData() {
    const data = {
        loadBonus: currentLoadBonus, // Salvar bônus de carga manual
        // --- DADOS GERAIS ---
        version: 15.3,
        charName: getVal('charName'), playerName: getVal('playerName'),
        charRace: getVal('charRace'), charOrigin: getVal('charOrigin'), charClass: getVal('charClass'),
        charLevel: getVal('charLevel'), charDeity: getVal('charDeity'),
        // --- EXTRAS ---
        extras: { profs: getVal('charProfs'), size: getVal('charSize'), speed: getVal('charSpeed'), xp: getVal('charXP'), cash: getVal('charCash') },
        // --- ATRIBUTOS ---
        attrs: {},
        // --- STATUS ---
        status: { pvM: getVal('pvMax'), pvC: getVal('pvCurrent'), pmM: getVal('pmMax'), pmC: getVal('pmCurrent') },
        // --- DEFESA ---
        defense: {
            config: { attr: getVal('defAttrSelect'), apply: document.getElementById('applyDefAttr') ? document.getElementById('applyDefAttr').checked : true },
            armor: { name: getVal('armorName'), bonus: getVal('armorBonus'), penalty: getVal('armorPenalty'), type: getVal('armorType'), desc: getVal('armorDesc') },
            shield: { name: getVal('shieldName'), bonus: getVal('shieldBonus'), penalty: getVal('shieldPenalty'), type: getVal('shieldType'), desc: getVal('shieldDesc') },
            other: []
        },
        // --- PERÍCIAS ---
        skills: currentSkills.map(s => ({ n: s.n, a: s.a, trained: s.trained, other: s.other, isCustom: s.isCustom })),
        // --- ATAQUES ---
        attacks: [],
        // --- INVENTÁRIO ---
        inventory: [],
        // --- PODERES ---
        abilities: [],
        // --- NOTAS ---
        notes: document.getElementById('charNotes').value,
        // --- MAGIAS ---
        spells: {
            config: { attr: getVal('spellCDAttrSelect'), powers: getVal('spellCDPowers'), items: getVal('spellCDItems'), other: getVal('spellCDOther') },
            list: []
        },
        // --- CARGA ---
        loadConfig: { attr: getVal('loadAttrSelect') || 'FOR' }
    };

    attrs.forEach(a => { data.attrs[a] = getVal(`attr-${a}`); });

    document.querySelectorAll('#defenseList .def-row').forEach(row => {
        data.defense.other.push({
            name: row.querySelector('.inp-name').value,
            bonus: row.querySelector('.inp-bonus').value
        });
    });

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

    document.querySelectorAll('#inventoryList .inv-row').forEach(row => {
        data.inventory.push({
            name: row.querySelector('.inp-name').value,
            qtd: row.querySelector('.inp-qtd').value,
            slots: row.querySelector('.inp-slots').value
        });
    });

    document.querySelectorAll('#abilitiesList .ability-row').forEach(row => {
        data.abilities.push({
            name: row.querySelector('.inp-name').value,
            desc: row.querySelector('.inp-desc').value
        });
    });

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

    localStorage.setItem('t20SheetData', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('t20SheetData');
    if (savedData) {
        const data = JSON.parse(savedData);

        // Carregar bônus de carga manual
        currentLoadBonus = data.loadBonus || 0;
        const loadBonusDisplay = document.getElementById('loadBonusDisplay');
        if (loadBonusDisplay) loadBonusDisplay.innerText = currentLoadBonus > 0 ? `+${currentLoadBonus}` : currentLoadBonus;

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
            if (data.extras.xp) document.getElementById('charXP').value = data.extras.xp;
            if (data.extras.cash) document.getElementById('charCash').value = data.extras.cash;
        }

        // --- ATRIBUTOS ---
        if (data.attrs) {
            attrs.forEach(a => {
                if (data.attrs[a]) document.getElementById(`attr-${a}`).value = data.attrs[a];
            });
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
        if (data.notes !== undefined) {
            document.getElementById('charNotes').value = data.notes;
        }

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

    } else {
        // Se não houver dados salvos, renderiza as perícias padrão
        renderSkills();
    }
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
function enableDragAndDrop() {
    // Ataques
    const attacksList = document.getElementById('attacksList');
    if (attacksList) new Sortable(attacksList, { animation: 150, handle: '.drag-handle', onEnd: saveData });

    // Defesa
    const defenseList = document.getElementById('defenseList');
    if (defenseList) new Sortable(defenseList, { animation: 150, handle: '.drag-handle', onEnd: saveData });

    // Inventário
    const inventoryList = document.getElementById('inventoryList');
    if (inventoryList) new Sortable(inventoryList, { animation: 150, handle: '.drag-handle', onEnd: saveData });

    // Poderes
    const abilitiesList = document.getElementById('abilitiesList');
    if (abilitiesList) new Sortable(abilitiesList, { animation: 150, handle: '.drag-handle', onEnd: saveData });

    // Magias
    [1, 2, 3, 4, 5].forEach(circle => {
        const spellsList = document.getElementById(`spellsList${circle}`);
        if (spellsList) new Sortable(spellsList, { animation: 150, handle: '.drag-handle', onEnd: saveData });
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


