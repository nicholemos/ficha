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
    { n: 'Investigação', a: 'INT' }, { n: 'Jogatina', a: 'CAR' }, { n: 'Ladinagem', a: 'DES' },
    { n: 'Misticismo', a: 'INT' }, { n: 'Nobreza', a: 'INT' },
    { n: 'Ofício', a: 'INT' }, { n: 'Percepção', a: 'SAB' }, { n: 'Pilotagem', a: 'DES' },
    { n: 'Reflexos', a: 'DES' }, { n: 'Religião', a: 'SAB' },
    { n: 'Sobrevivência', a: 'SAB' }, { n: 'Vontade', a: 'SAB' }
];

const spellCosts = { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15 };
let currentSkills = [];
let currentLoadBonus = 0; // Bônus manual para a carga
let currentArmorLoadBonus = 0; // Bônus de slots da armadura
let isLoading = false;    // Flag para suprimir saveData() durante o carregamento inicial

// --- INICIALIZAÇÃO ---
window.onload = () => {
    try {
        currentSkills = JSON.parse(JSON.stringify(defaultSkills));
        renderStructure();
        loadData();
        attachGlobalListeners();
        enableDragAndDrop();
    } catch (e) { console.error(e); }

    setTimeout(updateCalculations, 100);

    // ADICIONE ESTA LINHA AQUI:
    setTimeout(checkImportedPowers, 400); // 400ms garante que a ficha já carregou tudo antes de importar
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

        const isTrainedOnly = TRAINED_ONLY_SKILLS.includes(s.n);
        const skillLabel = isDefault
            ? `${s.n}${isTrainedOnly ? '<span class="text-danger" title="Somente treinada">*</span>' : ''}`
            : s.n;
        const nameDisplay = isDefault
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
            const attrVal = getInt(`attr-${s.a}`);
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
                total = halfLevel + attrVal + trained + other;
                // Penalidade de Armadura/Escudo
                if (penaltySkills.includes(s.n)) {
                    total -= totalPenalty;
                }
                // Penalidade de Tamanho (Furtividade)
                if (s.n === 'Furtividade') {
                    total += sizeVal;
                }
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
        const armorHalfLevel = document.getElementById('armorHalfLevel') ? document.getElementById('armorHalfLevel').checked : false;
        const armorBonus = getInt('armorBonus') + (armorHalfLevel ? halfLevel : 0);
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
        const spellCDAttrVal = getInt(`attr-${spellCDAttr}`);
        const spellCDPowers = getInt('spellCDPowers');
        const spellCDItems = getInt('spellCDItems');
        const spellCDOther = getInt('spellCDOther');
        const spellCDTotal = 10 + halfLevel + spellCDAttrVal + spellCDPowers + spellCDItems + spellCDOther;

        setText('spellCDHalfLevel', halfLevel);
        setText('spellCDAttrVal', spellCDAttrVal);
        setText('spellCDTotal', spellCDTotal);

        // --- ATAQUES (Correção Final: Leitura Direta da Interface) ---
        document.querySelectorAll('.atk-row').forEach(row => {
            const skillSelect = row.querySelector('.inp-atk-skill');
            const bonusInput = row.querySelector('.inp-bonus');
            const modInput = row.querySelector('.inp-atk-mod');

            if (skillSelect && bonusInput && modInput) {
                const selectedSkill = skillSelect.value;

                // 1. Busca o índice da perícia no seu array global
                const skillIndex = currentSkills.findIndex(s => s.n === selectedSkill);
                let skillBonus = 0;
                // 2. Tenta ler o valor que já está calculado e exibido na tabela de perícias
                if (skillIndex !== -1) {
                    const skillTotalEl = document.getElementById(`skTotal${skillIndex}`);
                    if (skillTotalEl) {
                        skillBonus = parseInt(skillTotalEl.innerText) || 0;
                    }
                }
                const modBonus = parseInt(modInput.value) || 0;
                const totalBonus = skillBonus + modBonus;
                bonusInput.value = totalBonus;
            }
        });

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
            isCustom: s.isCustom
        })),

        attacks: [],
        inventory: [],
        raceAbilities: raceAbilities,
        classAbilities: classAbilities,
        notes: document.getElementById('charNotes')?.value || '',

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
            bonus: row.querySelector('.inp-bonus').value
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
            slots: row.querySelector('.inp-slots').value
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

        isLoading = false; // Carregamento concluído - salvar normalmente a partir daqui

    } else {
        // Se não houver dados salvos, renderiza as perícias padrão
        renderSkills();
    }
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
        const response = await fetch('Ficha.pdf');
        const arrayBuffer = await response.arrayBuffer();
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
            const suf = skillSuffix[s.n] || (s.n.includes('Ofício') ? 'ofi1' : null);
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
        try {
            const tamanhoSel = document.getElementById('charSize');
            const tamanhoTexto = tamanhoSel.options[tamanhoSel.selectedIndex].text;
            form.getDropdown('SeleTamanho').select(tamanhoTexto);
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
    const btnP = document.getElementById('btnViewPersonagem');
    const btnA = document.getElementById('btnViewAmeaca');
    const headerContent = document.querySelector('.header-content');
    const btnsPerson = document.getElementById('headerBtnsPersonagem');
    const btnsAmeaca = document.getElementById('headerBtnsAmeaca');
    const btnPDF = document.getElementById('btnGerarPDF');

    if (mode === 'ameaca') {
        if (personagem) personagem.style.display = 'none';
        if (ameaca) ameaca.style.display = 'block';
        if (headerContent) headerContent.style.display = 'none';

        // Esconde botões do personagem e mostra os da ameaça
        if (btnsPerson) btnsPerson.style.setProperty('display', 'none', 'important');
        if (btnsAmeaca) btnsAmeaca.style.removeProperty('display');

        if (btnPDF) {
            btnPDF.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> PDF Ameaça';
            btnPDF.onclick = exportarAmeacaPDF;
            btnPDF.title = 'Gerar PDF da Ficha de Ameaça';
        }
        if (btnP) { btnP.classList.remove('btn-danger'); btnP.classList.add('btn-outline-danger'); }
        if (btnA) { btnA.classList.remove('btn-outline-danger'); btnA.classList.add('btn-danger'); }
        syncAmeacaFromSheet();
    } else {
        if (personagem) personagem.style.display = '';
        if (ameaca) ameaca.style.display = 'none';
        if (headerContent) headerContent.style.display = '';

        // Mostra botões do personagem e força a ocultação dos de ameaça com !important
        if (btnsPerson) btnsPerson.style.removeProperty('display');
        if (btnsAmeaca) btnsAmeaca.style.setProperty('display', 'none', 'important');

        if (btnPDF) {
            btnPDF.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Gerar PDF Oficial';
            btnPDF.onclick = exportarParaPDF;
            btnPDF.title = 'Gerar PDF Oficial';
        }
        if (btnP) { btnP.classList.add('btn-danger'); btnP.classList.remove('btn-outline-danger'); }
        if (btnA) { btnA.classList.add('btn-outline-danger'); btnA.classList.remove('btn-danger'); }
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
const PERICIAS_FIXAS = ['Iniciativa', 'Percepção', 'Fortitude', 'Reflexos', 'Vontade']; // já têm campos próprios

function abrirModalImportarPericias() {
    // Monta lista de perícias (excluindo as 5 fixas)
    const pericias = currentSkills
        .map((s, i) => ({
            nome: s.n,
            total: parseInt(document.getElementById(`skTotal${i}`)?.innerText) || 0
        }))
        .filter(s => !PERICIAS_FIXAS.includes(s.nome));

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
        <button class="am-row-del" onclick="this.closest('.am-row').remove(); saveAmeaca()" title="Remover"><i class="bi bi-x-lg"></i></button>
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
