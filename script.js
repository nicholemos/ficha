// --- DADOS E CONFIGURAÇÕES ---
const attrs = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];

// Lista padrão de perícias
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

// --- INICIALIZAÇÃO ---
window.onload = () => {
    try {
        currentSkills = JSON.parse(JSON.stringify(defaultSkills));
        renderStructure();
        loadData();
        attachGlobalListeners();
    } catch(e) { console.error(e); }
    setTimeout(updateCalculations, 100);
};

function renderStructure() {
    const attrContainer = document.getElementById('attributesArea');
    // Certifique-se de ter as imagens na pasta
    const attrImages = { 'FOR': 'imagens/forca.png', 'DES': 'imagens/destreza.png', 'CON': 'imagens/constituicao.png', 'INT': 'imagens/inteligencia.png', 'SAB': 'imagens/sabedoria.png', 'CAR': 'imagens/carisma.png' };

    if(attrContainer) {
        attrContainer.innerHTML = attrs.map(a => {
            const bgImage = attrImages[a] ? `url('${attrImages[a]}')` : 'none';
            return `
            <div class="col-2">
                <div class="d-flex flex-column align-items-center">
                    <div class="attr-token" style="background-image: ${bgImage};">
                        <input type="number" class="attr-val attr-input-overlay form-control" id="attr-${a}" value="0" min="-5">
                    </div>
                    <div class="attr-footer-label">${a}</div>
                </div>
            </div>
            `;
        }).join('');
    }
    renderSkills();
}

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
            <div class="col-1 text-center"><i class="bi bi-dice-20-fill dice-roller text-secondary" onclick="rollSkill(${i})" title="Rolar Teste"></i></div>
            <div class="col-4 ps-1 d-flex align-items-center">
                <div style="flex: 1; overflow: hidden;">${nameDisplay}</div>
                <select class="border-0 bg-transparent text-muted fw-bold ms-1 p-0" style="font-size: 0.65em; width: 35px; cursor:pointer;" onchange="updateSkillAttr(${i}, this.value)">${attrOptions}</select>
                ${deleteBtn}
            </div>
            <div class="col-2 text-center fw-bold text-danger fs-6" id="skTotal${i}">0</div>
            <div class="col-1 text-center text-muted small" id="skHalfLevel${i}">0</div>
            <div class="col-1 text-center text-muted small" id="skAttrVal${i}">0</div>
            <div class="col-1 text-center text-muted small" id="skTrainVal${i}">0</div>
            <div class="col-1 px-1"><input type="number" class="form-control form-control-sm p-0 text-center" id="skOther${i}" placeholder="0" value="${s.other || ''}"></div>
        </div>`;
    }).join('');
    
    attachGlobalListeners();
}

// --- ROLAGEM DE DADOS ---
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
    toastBody.innerHTML = `
        <div class="display-4 fw-bold">${total}</div>
        <div class="small opacity-75">Dado: <strong>${result}</strong> ${result === 20 ? '★' : ''}</div>
        ${isCrit ? '<div class="fw-bold text-warning mt-1">CRÍTICO!</div>' : ''}
    `;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
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

// --- UI / HELPERS ---
function attachGlobalListeners() {
    document.body.oninput = (e) => { if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) { updateCalculations(); if(e.target.id !== 'charImgInput') saveData(); } };
    document.body.onchange = (e) => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') { updateCalculations(); saveData(); } };
}
function toggleDetail(btn) {
    const row = btn.closest('.atk-row') || btn.closest('.def-row') || btn.closest('.ability-row') || btn.closest('.spell-row');
    if (!row) return;
    const details = row.querySelector('.atk-details') || row.querySelector('.def-details') || row.querySelector('.ability-details') || row.querySelector('.spell-details');
    const icon = btn.querySelector('i');
    if (details.classList.contains('d-none')) { details.classList.remove('d-none'); icon.classList.replace('bi-chevron-down', 'bi-chevron-up'); } 
    else { details.classList.add('d-none'); icon.classList.replace('bi-chevron-up', 'bi-chevron-down'); }
}
function toggleFixedDetail(id) { const el = document.getElementById(id); if(el) el.classList.toggle('d-none'); }
function uploadImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 300; const MAX_HEIGHT = 400;
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                const el = document.getElementById('charImgPreview');
                if(el) el.src = canvas.toDataURL('image/jpeg', 0.7);
                saveData();
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}
function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function getInt(id) { const v = parseInt(getVal(id)); return isNaN(v) ? 0 : v; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.innerText = val; }

// --- FUNÇÕES DE ADIÇÃO ---

// Gerenciamento de Perícias
function addSkill() { currentSkills.push({ n: 'Nova Perícia', a: 'INT', trained: false, other: 0, isCustom: true }); renderSkills(); saveData(); }
function deleteSkill(index) { if(confirm("Remover perícia?")) { currentSkills.splice(index, 1); renderSkills(); saveData(); } }
function updateSkillAttr(index, newAttr) { currentSkills[index].a = newAttr; updateCalculations(); saveData(); }
function updateSkillName(index, newName) { currentSkills[index].n = newName; saveData(); updateCalculations(); }

// Ataques
function addAttack(data = null) {
    const container = document.getElementById('attacksList'); if(!container) return;
    const div = document.createElement('div'); div.className = 'border-bottom pb-2 mb-2 atk-row';
    const mainSkills = ['Luta', 'Pontaria', 'Atuação', 'Misticismo'];
    let skillOptions = `<option value="">(Manual)</option>`;
    mainSkills.forEach(sn => skillOptions += `<option value="${sn}" ${data && data.skill === sn ? 'selected' : ''}>${sn}</option>`);
    div.innerHTML = `
        <div class="row g-1 align-items-center text-center atk-summary mb-2">
            <div class="col-1"><i class="bi bi-sword fs-4 dice-roller text-danger" onclick="rollAttack(this)" title="Rolar Ataque" style="cursor: pointer;"></i></div>
            <div class="col-4"><input type="text" class="form-control form-control-sm inp-name text-start" placeholder="Ataque" value="${data ? data.name : ''}"></div>
            <div class="col-2"><input type="text" class="form-control form-control-sm inp-bonus fw-bold" placeholder="+0" value="${data ? data.bonus : ''}"></div>
            <div class="col-2"><input type="text" class="form-control form-control-sm inp-dmg" placeholder="1d6" value="${data ? data.dmg : ''}"></div>
            <div class="col-1"><input type="text" class="form-control form-control-sm text-center inp-crit-range p-0" placeholder="20" value="${data ? (data.critRange || '20') : '20'}" title="Margem"></div>
            <div class="col-1"><input type="text" class="form-control form-control-sm text-center inp-crit p-0" placeholder="x2" value="${data ? data.crit : 'x2'}" title="Multi"></div>
            <div class="col-1"><button class="btn btn-sm btn-outline-dark border-0 w-100 p-0" onclick="toggleDetail(this)"><i class="bi bi-chevron-down"></i></button></div>
        </div>
        <div class="atk-details p-2 rounded d-none">
            <div class="row g-2 mb-2">
                <div class="col-4"><label class="form-label-sm">PERÍCIA</label><select class="form-select form-select-sm border-0 border-bottom p-0 inp-atk-skill" onchange="updateCalculations()">${skillOptions}</select></div>
                <div class="col-3"><label class="form-label-sm">BÔNUS ITEM</label><input type="number" class="form-control form-control-sm border-0 border-bottom p-0 text-center inp-atk-mod" placeholder="+0" value="${data ? data.mod : ''}" oninput="updateCalculations()"></div>
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
function removeAttack(btn) { if(confirm('Remover ataque?')) { btn.closest('.atk-row').remove(); saveData(); } }

// Outros Itens
function addDefenseItem(data = null) {
    const container = document.getElementById('defenseList'); if(!container) return;
    const div = document.createElement('div'); div.className = 'border-bottom pb-2 mb-2 def-row';
    div.innerHTML = `
        <div class="row g-1 align-items-center text-center def-summary mb-2">
            <div class="col-1 fs-5"><i class="bi bi-magic"></i></div>
            <div class="col-5"><input type="text" class="form-control form-control-sm inp-name text-start" placeholder="Item Extra" value="${data ? data.name : ''}"></div>
            <div class="col-2"><input type="number" class="form-control form-control-sm inp-bonus fw-bold text-success" placeholder="+0" value="${data ? data.bonus : ''}" oninput="updateCalculations()"></div>
            <div class="col-2"></div>
            <div class="col-2"><button class="btn btn-sm btn-outline-danger border-0" onclick="removeDefenseItem(this)"><i class="bi bi-trash"></i></button></div>
        </div>`;
    container.appendChild(div); if (!data) saveData();
}
function removeDefenseItem(btn) { if(confirm('Remover item?')) { btn.closest('.def-row').remove(); updateCalculations(); saveData(); } }
function checkHeavyArmor() { if (getVal('armorType') === 'heavy') { const chk = document.getElementById('applyDefAttr'); if(chk) chk.checked = false; } updateCalculations(); }

// Inventário
function addInventoryItem(data = null) {
    const container = document.getElementById('inventoryList'); if(!container) return;
    const div = document.createElement('div'); div.className = 'row g-1 align-items-center mb-2 inv-row border-bottom pb-1';
    div.innerHTML = `
        <div class="col-6"><input type="text" class="form-control form-control-sm fw-bold inp-name" placeholder="Item" value="${data ? data.name : ''}"></div>
        <div class="col-2"><input type="number" class="form-control form-control-sm text-center inp-qtd" placeholder="1" value="${data ? data.qtd : '1'}" oninput="updateCalculations()"></div>
        <div class="col-2"><input type="number" class="form-control form-control-sm text-center inp-slots" placeholder="0" value="${data ? data.slots : '0'}" step="0.5" oninput="updateCalculations()"></div>
        <div class="col-2 text-center"><button class="btn btn-sm btn-outline-danger border-0" onclick="removeInventoryItem(this)"><i class="bi bi-trash"></i></button></div>`;
    container.appendChild(div); if (!data) saveData();
}
function removeInventoryItem(btn) { if(confirm('Remover item?')) { btn.closest('.inv-row').remove(); updateCalculations(); saveData(); } }

// Poderes
function addAbility(data = null) {
    const container = document.getElementById('abilitiesList'); if(!container) return;
    const div = document.createElement('div'); div.className = 'col-md-6 ability-row';
    div.innerHTML = `
        <div class="border rounded p-2 h-100 position-relative" style="background-color: #fdfdfd;">
            <div class="d-flex align-items-center gap-2 mb-1">
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
function removeAbility(btn) { if(confirm('Excluir poder?')) { btn.closest('.ability-row').remove(); saveData(); } }

// Magias
function addSpell(circle, data = null) {
    const container = document.getElementById(`spellsList${circle}`); if(!container) return;
    const div = document.createElement('div'); div.className = 'border-bottom pb-2 mb-2 spell-row';
    const defaultCost = spellCosts[circle]; const costValue = data ? data.pm : defaultCost;
    div.innerHTML = `
        <div class="row g-1 align-items-center text-center mb-2">
            <div class="col-9"><input type="text" class="form-control form-control-sm fw-bold inp-name text-start" placeholder="Nome da Magia" value="${data ? data.name : ''}"></div>
            <div class="col-2 position-relative"><input type="number" class="form-control form-control-sm text-center inp-pm" placeholder="${defaultCost}" value="${costValue}"><span style="position: absolute; right: 5px; top: 20%; font-size: 0.6em; color: #6f42c1; font-weight:bold;">PM</span></div>
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
function removeSpell(btn) { if(confirm('Remover magia?')) { btn.closest('.spell-row').remove(); saveData(); } }

// --- CÁLCULOS ---
function updateCalculations() {
    try {
        // 1. Nível
        let level = getInt('charLevel');
        if (level < 1) level = 1; if (level > 20) level = 20;
        const halfLevel = Math.floor(level / 2);

        // 2. Penalidades
        const armorPen = getInt('armorPenalty'); const shieldPen = getInt('shieldPenalty');
        const totalPenalty = Math.abs(armorPen) + Math.abs(shieldPen);
        const penaltySkills = ['Acrobacia', 'Furtividade', 'Ladinagem'];
        const sizeVal = getInt('charSize');
        let trainBonus = 2; if (level >= 15) trainBonus = 6; else if (level >= 7) trainBonus = 4;
        const skillValues = {};

        currentSkills.forEach((s, i) => {
            const attrVal = getInt(`attr-${s.a}`);
            const check = document.getElementById(`skTrain${i}`); if (check) s.trained = check.checked;
            const otherInp = document.getElementById(`skOther${i}`); if (otherInp) s.other = parseInt(otherInp.value) || 0;

            const finalTrainBonus = s.trained ? trainBonus : 0;
            let appliedPenalty = (penaltySkills.includes(s.n) && totalPenalty > 0) ? totalPenalty : 0;
            let appliedSizeMod = (s.n === 'Furtividade') ? sizeVal : 0;

            const elHalf = document.getElementById(`skHalfLevel${i}`); if(elHalf) elHalf.innerText = halfLevel;
            const elAttr = document.getElementById(`skAttrVal${i}`); if(elAttr) elAttr.innerText = attrVal;
            const elTrain = document.getElementById(`skTrainVal${i}`); if(elTrain) elTrain.innerText = finalTrainBonus;

            const total = halfLevel + attrVal + finalTrainBonus + s.other - appliedPenalty + appliedSizeMod;
            skillValues[s.n] = total;
            const totalEl = document.getElementById(`skTotal${i}`);
            if(totalEl) {
                totalEl.innerText = total;
                if (appliedPenalty > 0 || appliedSizeMod !== 0) {
                    totalEl.style.color = (total < 0 || appliedPenalty > 0) ? '#d35400' : 'var(--t20-red)';
                } else {
                    totalEl.style.color = 'var(--t20-red)';
                }
            }
        });

        document.querySelectorAll('.atk-row').forEach(row => {
            const skillSelect = row.querySelector('.inp-atk-skill'); const modInput = row.querySelector('.inp-atk-mod'); const mainInput = row.querySelector('.inp-bonus');
            if (skillSelect && skillSelect.value && skillValues[skillSelect.value] !== undefined) {
                const base = skillValues[skillSelect.value]; const mod = parseInt(modInput.value) || 0;
                const totalAtk = base + mod; mainInput.value = (totalAtk >= 0 ? '+' : '') + totalAtk;
                mainInput.classList.add('text-primary', 'bg-light'); mainInput.readOnly = true;
            } else { mainInput.classList.remove('text-primary', 'bg-light'); mainInput.readOnly = false; }
        });

        // Defesa
        const select = document.getElementById('defAttrSelect'); const selectedAttr = select ? select.value : 'DES';
        const attrValDef = getInt(`attr-${selectedAttr}`); const checkDef = document.getElementById('applyDefAttr'); const applyAttr = checkDef ? checkDef.checked : false;
        const elDefAttrVal = document.getElementById('defAttrVal'); if(elDefAttrVal) elDefAttrVal.innerText = attrValDef;
        const armorBonus = getInt('armorBonus'); const elArmorB = document.getElementById('dispArmorBonus'); if(elArmorB) elArmorB.innerText = armorBonus;
        const shieldBonus = getInt('shieldBonus'); const elShieldB = document.getElementById('dispShieldBonus'); if(elShieldB) elShieldB.innerText = shieldBonus;
        let othersBonus = 0; document.querySelectorAll('.def-row').forEach(row => { othersBonus += parseInt(row.querySelector('.inp-bonus').value) || 0; });
        const elOtherB = document.getElementById('dispOtherBonus'); if(elOtherB) elOtherB.innerText = othersBonus;
        const elDefTotal = document.getElementById('defenseTotal'); if(elDefTotal) elDefTotal.innerText = 10 + (applyAttr ? attrValDef : 0) + armorBonus + shieldBonus + othersBonus;

        // Carga
        let currentLoad = 0; document.querySelectorAll('.inv-row').forEach(row => { const qtd = parseFloat(row.querySelector('.inp-qtd').value) || 0; const slots = parseFloat(row.querySelector('.inp-slots').value) || 0; currentLoad += (qtd * slots); });
        const elLoadCurr = document.getElementById('loadCurrent'); if(elLoadCurr) elLoadCurr.innerText = currentLoad;
        const str = getInt('attr-FOR'); let baseLimit = 10; if (str > 0) baseLimit += (str * 2); else baseLimit += str;
        const elLoadLim = document.getElementById('loadLimit'); if(elLoadLim) elLoadLim.innerText = baseLimit;
        if(elLoadCurr) { if(currentLoad > baseLimit) { elLoadCurr.classList.add('bg-danger', 'text-white'); elLoadCurr.classList.remove('bg-white'); } else { elLoadCurr.classList.add('bg-white'); elLoadCurr.classList.remove('bg-danger', 'text-white'); } }

        // CD Magias
        const spellAttr = document.getElementById('spellCDAttrSelect').value;
        const spellAttrVal = getInt(`attr-${spellAttr}`);
        setText('spellCDHalfLevel', halfLevel);
        setText('spellCDAttrVal', spellAttrVal);
        const cdPowers = getInt('spellCDPowers'); const cdItems = getInt('spellCDItems'); const cdOther = getInt('spellCDOther');
        const totalCD = 10 + halfLevel + spellAttrVal + cdPowers + cdItems + cdOther;
        setText('spellCDTotal', totalCD);

        updateBars();
    } catch(e) { console.log("Calc pendente...", e); }
}

function updateBars() {
    const pvMax = parseFloat(document.getElementById('pvMax').value) || 0; const pvCur = parseFloat(document.getElementById('pvCurrent').value) || 0;
    let pvPct = 0; if (pvMax > 0) pvPct = (pvCur / pvMax) * 100; if (pvPct > 100) pvPct = 100; if (pvPct < 0) pvPct = 0;
    const barPV = document.getElementById('barPV'); if(barPV) barPV.style.width = `${pvPct}%`;

    const pmMax = parseFloat(document.getElementById('pmMax').value) || 0; const pmCur = parseFloat(document.getElementById('pmCurrent').value) || 0;
    let pmPct = 0; if (pmMax > 0) pmPct = (pmCur / pmMax) * 100; if (pmPct > 100) pmPct = 100; if (pmPct < 0) pmPct = 0;
    const barPM = document.getElementById('barPM'); if(barPM) barPM.style.width = `${pmPct}%`;
}

// --- PERSISTÊNCIA ---
function saveData() {
    const data = {
        version: 15,
        header: {
            name: getVal('charName'), player: getVal('playerName'), race: getVal('charRace'),
            origin: getVal('charOrigin'), class: getVal('charClass'), level: getVal('charLevel'),
            deity: getVal('charDeity'), image: document.getElementById('charImgPreview') ? document.getElementById('charImgPreview').src : ''
        },
        extras: { profs: getVal('charProfs'), size: getVal('charSize'), speed: getVal('charSpeed'), xp: getVal('charXP'), cash: getVal('charCash') },
        attrs: {},
        status: { pvM: getVal('pvMax'), pvC: getVal('pvCurrent'), pmM: getVal('pmMax'), pmC: getVal('pmCurrent') },
        defense: {
            config: { attr: getVal('defAttrSelect'), apply: document.getElementById('applyDefAttr') ? document.getElementById('applyDefAttr').checked : true },
            armor: { name: getVal('armorName'), bonus: getVal('armorBonus'), penalty: getVal('armorPenalty'), type: getVal('armorType'), desc: getVal('armorDesc') },
            shield: { name: getVal('shieldName'), bonus: getVal('shieldBonus'), penalty: getVal('shieldPenalty'), type: getVal('shieldType'), desc: getVal('shieldDesc') },
            others: []
        },
        spellCD: {
            attr: getVal('spellCDAttrSelect'),
            powers: getVal('spellCDPowers'),
            items: getVal('spellCDItems'),
            other: getVal('spellCDOther')
        },
        skills: currentSkills,
        attacks: [], inventory: [], abilities: [], spells: []
    };

    attrs.forEach(a => data.attrs[a] = getVal(`attr-${a}`));
    
    document.querySelectorAll('.atk-row').forEach(row => {
        data.attacks.push({
            name: row.querySelector('.inp-name').value, bonus: row.querySelector('.inp-bonus').value, dmg: row.querySelector('.inp-dmg').value, crit: row.querySelector('.inp-crit').value, critRange: row.querySelector('.inp-crit-range').value, desc: row.querySelector('.inp-desc').value, type: row.querySelector('.inp-type').value, range: row.querySelector('.inp-range').value, skill: row.querySelector('.inp-atk-skill') ? row.querySelector('.inp-atk-skill').value : '', mod: row.querySelector('.inp-atk-mod') ? row.querySelector('.inp-atk-mod').value : ''
        });
    });
    document.querySelectorAll('.def-row').forEach(row => { data.defense.others.push({ name: row.querySelector('.inp-name').value, bonus: row.querySelector('.inp-bonus').value }); });
    document.querySelectorAll('.inv-row').forEach(row => { data.inventory.push({ name: row.querySelector('.inp-name').value, qtd: row.querySelector('.inp-qtd').value, slots: row.querySelector('.inp-slots').value }); });
    document.querySelectorAll('.ability-row').forEach(row => { data.abilities.push({ name: row.querySelector('.inp-name').value, desc: row.querySelector('.inp-desc').value }); });
    document.querySelectorAll('.spell-row').forEach(row => {
        data.spells.push({ circle: row.querySelector('.inp-circle').value, name: row.querySelector('.inp-name').value, pm: row.querySelector('.inp-pm').value, school: row.querySelector('.inp-school').value, exec: row.querySelector('.inp-exec').value, range: row.querySelector('.inp-range').value, target: row.querySelector('.inp-target').value, dur: row.querySelector('.inp-dur').value, res: row.querySelector('.inp-res').value, desc: row.querySelector('.inp-desc').value });
    });

    localStorage.setItem('t20_sheet_v15', JSON.stringify(data));
}

function loadData() {
    let json = localStorage.getItem('t20_sheet_v15');
    if (!json) json = localStorage.getItem('t20_sheet_v14');
    if (!json) json = localStorage.getItem('t20_sheet_v13');
    if (!json) json = localStorage.getItem('t20_sheet_v12');
    if (!json) json = localStorage.getItem('t20_sheet_v11');
    if (!json) json = localStorage.getItem('t20_sheet_v10');
    
    // Se não tiver save, inicializa com itens básicos
    if (!json) { 
        addAttack(); 
        renderSkills(); 
        // ITENS INICIAIS AUTOMÁTICOS
        addInventoryItem({ name: 'Mochila', qtd: 1, slots: 0 });
        addInventoryItem({ name: 'Saco de Dormir', qtd: 1, slots: 1 });
        addInventoryItem({ name: 'Traje de Viajante', qtd: 1, slots: 0 });
        return; 
    }

    try {
        const data = JSON.parse(json);
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };

        setVal('charName', data.header.name); setVal('playerName', data.header.player); setVal('charRace', data.header.race); setVal('charOrigin', data.header.origin); setVal('charClass', data.header.class); setVal('charLevel', data.header.level || '1'); setVal('charDeity', data.header.deity);
        const imgEl = document.getElementById('charImgPreview'); if (data.header.image && imgEl) imgEl.src = data.header.image;

        if(data.extras) { setVal('charProfs', data.extras.profs); setVal('charSize', data.extras.size || '0'); setVal('charSpeed', data.extras.speed); setVal('charXP', data.extras.xp); setVal('charCash', data.extras.cash); }
        if(data.attrs) attrs.forEach(a => setVal(`attr-${a}`, data.attrs[a]));
        if(data.status) { setVal('pvMax', data.status.pvM); setVal('pvCurrent', data.status.pvC); setVal('pmMax', data.status.pmM); setVal('pmCurrent', data.status.pmC); }

        if(data.defense) {
            if(data.defense.config) { setVal('defAttrSelect', data.defense.config.attr || 'DES'); const chk = document.getElementById('applyDefAttr'); if(chk) chk.checked = data.defense.config.apply; }
            if(data.defense.armor) { setVal('armorName', data.defense.armor.name); setVal('armorBonus', data.defense.armor.bonus); setVal('armorPenalty', data.defense.armor.penalty); setVal('armorType', data.defense.armor.type || 'light'); setVal('armorDesc', data.defense.armor.desc); }
            if(data.defense.shield) { setVal('shieldName', data.defense.shield.name); setVal('shieldBonus', data.defense.shield.bonus); setVal('shieldPenalty', data.defense.shield.penalty); setVal('shieldType', data.defense.shield.type || 'light'); setVal('shieldDesc', data.defense.shield.desc); }
            const defList = document.getElementById('defenseList'); if(defList) defList.innerHTML = '';
            if(data.defense.others) data.defense.others.forEach(item => addDefenseItem(item));
        }

        if(data.spellCD) {
            setVal('spellCDAttrSelect', data.spellCD.attr || 'INT');
            setVal('spellCDPowers', data.spellCD.powers);
            setVal('spellCDItems', data.spellCD.items);
            setVal('spellCDOther', data.spellCD.other);
        }

        if (data.skills && Array.isArray(data.skills)) { currentSkills = data.skills; }
        renderSkills();

        const atkList = document.getElementById('attacksList'); if(atkList) atkList.innerHTML = '';
        if(data.attacks) data.attacks.forEach(atk => addAttack(atk)); else addAttack();

        const invList = document.getElementById('inventoryList'); if(invList) invList.innerHTML = '';
        if(data.inventory) data.inventory.forEach(item => addInventoryItem(item));

        const abList = document.getElementById('abilitiesList'); if(abList) abList.innerHTML = '';
        if(data.abilities) data.abilities.forEach(ab => addAbility(ab));

        for(let i=1; i<=5; i++) { const el = document.getElementById(`spellsList${i}`); if(el) el.innerHTML = ''; }
        if(data.spells) data.spells.forEach(spell => addSpell(spell.circle, spell));

    } catch(e) { console.error(e); }
    
    updateCalculations();
}

function clearSheet() { if (confirm("ATENÇÃO: Apagar TODA a ficha?")) { localStorage.removeItem('t20_sheet_v15'); location.reload(); } }
function exportSheet() { saveData(); const rawData = localStorage.getItem('t20_sheet_v15'); if (!rawData) return alert("Nenhum dado!"); const data = JSON.parse(rawData); const fileName = `Ficha_T20_${data.header.name || "Personagem"}.json`; const blob = new Blob([rawData], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
function importSheet(input) { const file = input.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function (e) { try { localStorage.setItem('t20_sheet_v15', e.target.result); loadData(); alert("Ficha carregada!"); } catch (err) { alert("Erro ao carregar."); } }; reader.readAsText(file); input.value = ''; }
