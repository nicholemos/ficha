// --- DADOS E CONFIGURAÇÕES ---
const attrs = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
const skillsList = [
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

// --- INICIALIZAÇÃO ---
window.onload = () => {
    renderStructure();
    loadData();
    attachGlobalListeners();
    updateCalculations(); // Garante cálculo inicial visual
};

function renderStructure() {
    // Renderizar Atributos
    const attrContainer = document.getElementById('attributesArea');
    attrContainer.innerHTML = attrs.map(a => `
        <div class="col-2">
            <div class="attr-box">
                <div class="attr-label">${a}</div>
                <input type="number" class="attr-val form-control" id="attr-${a}" value="0" min="-5">
            </div>
        </div>
    `).join('');

    // Renderizar Perícias
    const skillsContainer = document.getElementById('skillsList');
    skillsContainer.innerHTML = skillsList.map((s, i) => `
        <div class="row g-0 align-items-center skill-row py-1">
            <div class="col-1 text-center">
                <input class="form-check-input border-dark" type="checkbox" id="skTrain${i}">
            </div>
            <div class="col-4 text-start text-nowrap overflow-hidden fw-bold ps-1" title="${s.n}">
                ${s.n} <small class="text-muted" style="font-size:0.65em">(${s.a})</small>
            </div>
            <div class="col-2 text-center fw-bold text-danger fs-6" id="skTotal${i}">0</div>
            <div class="col-1 text-center text-muted small">=</div>
            <div class="col-1 text-center text-muted small" id="skHalfLevel${i}">0</div>
            <div class="col-1 text-center text-muted small" id="skAttrVal${i}">0</div>
            <div class="col-1 text-center text-muted small" id="skTrainVal${i}">0</div>
            <div class="col-1 px-1">
                <input type="number" class="form-control form-control-sm p-0 text-center" id="skOther${i}" placeholder="0">
            </div>
        </div>
    `).join('');
}

// Adiciona listeners globais para recalcular sempre que algo mudar
function attachGlobalListeners() {
    document.body.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            updateCalculations();
            saveData();
        }
    });
    document.body.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') {
            updateCalculations();
            saveData();
        }
    });
}

// --- INTERFACE / ACORDEÃO ---
function toggleDetail(btn) {
    const row = btn.closest('.atk-row') || btn.closest('.def-row');
    if (!row) return;
    const details = row.querySelector('.atk-details') || row.querySelector('.def-details');
    const icon = btn.querySelector('i');

    if (details.classList.contains('d-none')) {
        details.classList.remove('d-none');
        icon.classList.replace('bi-chevron-down', 'bi-chevron-up');
    } else {
        details.classList.add('d-none');
        icon.classList.replace('bi-chevron-up', 'bi-chevron-down');
    }
}

function toggleFixedDetail(id) {
    const el = document.getElementById(id);
    if(el) el.classList.toggle('d-none');
}

// --- SISTEMA DE ATAQUES ---
function addAttack(data = null) {
    const container = document.getElementById('attacksList');
    const div = document.createElement('div');
    div.className = 'border-bottom pb-2 mb-2 atk-row';

    div.innerHTML = `
        <div class="row g-1 align-items-center text-center atk-summary mb-2">
            <div class="col-1"><i class="bi bi-dice-20-fill fs-4"></i></div>
            <div class="col-5"><input type="text" class="form-control form-control-sm inp-name text-start" placeholder="Novo Ataque" value="${data ? data.name : ''}"></div>
            <div class="col-2"><input type="text" class="form-control form-control-sm inp-bonus" placeholder="+0" value="${data ? data.bonus : ''}"></div>
            <div class="col-2"><input type="text" class="form-control form-control-sm inp-dmg" placeholder="1d6" value="${data ? data.dmg : ''}"></div>
            <div class="col-2 d-flex gap-1">
                <input type="text" class="form-control form-control-sm inp-crit" placeholder="x2" value="${data ? data.crit : ''}">
                <button class="btn btn-sm btn-outline-dark border-0" onclick="toggleDetail(this)"><i class="bi bi-chevron-down"></i></button>
            </div>
        </div>
        <div class="atk-details p-2 rounded d-none">
            <div class="row g-2">
                <div class="col-12">
                    <input type="text" class="form-control form-control-sm text-center border-0 border-bottom inp-desc" placeholder="Descrição / Macros" value="${data ? data.desc : ''}">
                    <label class="form-label-sm">DESCRIÇÃO</label>
                </div>
                <div class="col-5">
                    <input type="text" class="form-control form-control-sm text-center border-0 border-bottom inp-type" placeholder="Corte/Perf" value="${data ? data.type : ''}">
                    <label class="form-label-sm">TIPO</label>
                </div>
                <div class="col-5">
                    <input type="text" class="form-control form-control-sm text-center border-0 border-bottom inp-range" placeholder="Curto" value="${data ? data.range : ''}">
                    <label class="form-label-sm">ALCANCE</label>
                </div>
                <div class="col-2">
                     <button class="btn btn-sm btn-danger w-100 py-0" onclick="removeAttack(this)" title="Remover"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>
    `;
    container.appendChild(div);
    if (!data) saveData();
}

function removeAttack(btn) {
    if (confirm('Remover este ataque?')) {
        btn.closest('.atk-row').remove();
        saveData();
    }
}

// --- SISTEMA DE DEFESA (ITENS EXTRAS) ---
function addDefenseItem(data = null) {
    const container = document.getElementById('defenseList');
    const div = document.createElement('div');
    div.className = 'border-bottom pb-2 mb-2 def-row';

    div.innerHTML = `
        <div class="row g-1 align-items-center text-center def-summary mb-2">
            <div class="col-1 fs-5"><i class="bi bi-magic"></i></div>
            <div class="col-5">
                <input type="text" class="form-control form-control-sm inp-name text-start" placeholder="Nome (Ex: Anel)" value="${data ? data.name : ''}" oninput="saveData()">
            </div>
            <div class="col-2">
                <input type="number" class="form-control form-control-sm inp-bonus fw-bold text-success" placeholder="+0" value="${data ? data.bonus : ''}" oninput="updateCalculations(); saveData()">
            </div>
            <div class="col-2"></div>
            <div class="col-2">
                <button class="btn btn-sm btn-outline-danger border-0" onclick="removeDefenseItem(this)"><i class="bi bi-trash"></i></button>
            </div>
        </div>
    `;
    container.appendChild(div);
    if (!data) { saveData(); }
}

function removeDefenseItem(btn) {
    if (confirm('Apagar item?')) {
        btn.closest('.def-row').remove();
        updateCalculations();
        saveData();
    }
}

// Lógica de Armadura Pesada
function checkHeavyArmor() {
    const type = document.getElementById('armorType').value;
    const attrCheckbox = document.getElementById('applyDefAttr');
    if (type === 'heavy') {
        attrCheckbox.checked = false;
        // setTimeout(() => alert('Armadura Pesada: Bônus de atributo removido da Defesa.'), 10); // Opcional
    }
    updateCalculations();
}

// --- CÁLCULOS GERAIS (O CÉREBRO DA FICHA) ---
function updateCalculations() {
    // 1. Nível
    const levelInput = document.getElementById('charLevel');
    let level = parseInt(levelInput.value) || 1;
    if (level < 1) { level = 1; levelInput.value = 1; }
    if (level > 20) { level = 20; levelInput.value = 20; }
    const halfLevel = Math.floor(level / 2);

    // 2. Preparação de Modificadores (Penalidade e Tamanho)
    const armorPen = parseInt(document.getElementById('armorPenalty').value) || 0;
    const shieldPen = parseInt(document.getElementById('shieldPenalty').value) || 0;
    const totalPenalty = Math.abs(armorPen) + Math.abs(shieldPen);
    const penaltySkills = ['Acrobacia', 'Furtividade', 'Ladinagem']; // Regra JdA

    const sizeMod = parseInt(document.getElementById('charSize').value) || 0;

    // 3. Perícias (Loop principal)
    let trainBonus = 2;
    if (level >= 15) trainBonus = 6;
    else if (level >= 7) trainBonus = 4;

    skillsList.forEach((s, i) => {
        const attrInput = document.getElementById(`attr-${s.a}`);
        let attrVal = parseInt(attrInput.value) || 0;
        if (attrVal < -5) { attrVal = -5; attrInput.value = -5; }

        const trained = document.getElementById(`skTrain${i}`).checked;
        const other = parseInt(document.getElementById(`skOther${i}`).value) || 0;
        const finalTrainBonus = trained ? trainBonus : 0;
        
        // Aplica Penalidade de Armadura?
        let appliedPenalty = 0;
        if (penaltySkills.includes(s.n) && totalPenalty > 0) {
            appliedPenalty = totalPenalty;
        }

        // Aplica Modificador de Tamanho? (Apenas Furtividade)
        let appliedSizeMod = 0;
        if (s.n === 'Furtividade') {
            appliedSizeMod = sizeMod;
        }

        // Display dos parciais
        document.getElementById(`skHalfLevel${i}`).innerText = halfLevel;
        document.getElementById(`skAttrVal${i}`).innerText = attrVal;
        document.getElementById(`skTrainVal${i}`).innerText = finalTrainBonus;
        
        // Cálculo Final
        const total = halfLevel + attrVal + finalTrainBonus + other - appliedPenalty + appliedSizeMod;
        const totalEl = document.getElementById(`skTotal${i}`);
        totalEl.innerText = total;

        // Cores e Dicas
        let tooltip = [];
        if(appliedPenalty > 0) tooltip.push(`Penalidade de Armadura: -${appliedPenalty}`);
        if(appliedSizeMod !== 0) tooltip.push(`Tamanho: ${appliedSizeMod > 0 ? '+' : ''}${appliedSizeMod}`);
        
        if(tooltip.length > 0) {
            totalEl.title = tooltip.join(' | ');
            totalEl.style.color = (total < 0 || appliedPenalty > 0) ? '#d35400' : 'var(--t20-red)';
        } else {
            totalEl.title = '';
            totalEl.style.color = 'var(--t20-red)';
        }
    });

    // 4. Defesa
    const selectedAttr = document.getElementById('defAttrSelect').value;
    const attrVal = parseInt(document.getElementById(`attr-${selectedAttr}`).value) || 0;
    const applyAttr = document.getElementById('applyDefAttr').checked;

    document.getElementById('defAttrVal').innerText = attrVal;
    const finalAttrBonus = applyAttr ? attrVal : 0;

    const armorBonus = parseInt(document.getElementById('armorBonus').value) || 0;
    document.getElementById('dispArmorBonus').innerText = armorBonus;

    const shieldBonus = parseInt(document.getElementById('shieldBonus').value) || 0;
    document.getElementById('dispShieldBonus').innerText = shieldBonus;

    let othersBonus = 0;
    document.querySelectorAll('.def-row').forEach(row => {
        othersBonus += parseInt(row.querySelector('.inp-bonus').value) || 0;
    });
    document.getElementById('dispOtherBonus').innerText = othersBonus;

    const totalDef = 10 + finalAttrBonus + armorBonus + shieldBonus + othersBonus;
    document.getElementById('defenseTotal').innerText = totalDef;
}

// --- SAVE / LOAD / IMPORT / EXPORT ---
function saveData() {
    const data = {
        header: {
            name: document.getElementById('charName').value,
            player: document.getElementById('playerName').value,
            race: document.getElementById('charRace').value,
            origin: document.getElementById('charOrigin').value,
            class: document.getElementById('charClass').value,
            level: document.getElementById('charLevel').value,
            deity: document.getElementById('charDeity').value,
        },
        extras: {
            profs: document.getElementById('charProfs').value,
            size: document.getElementById('charSize').value,
            speed: document.getElementById('charSpeed').value,
            xp: document.getElementById('charXP').value
        },
        attrs: {},
        status: {
            pvM: document.getElementById('pvMax').value, pvC: document.getElementById('pvCurrent').value,
            pmM: document.getElementById('pmMax').value, pmC: document.getElementById('pmCurrent').value
        },
        defense: {
            config: { attr: document.getElementById('defAttrSelect').value, apply: document.getElementById('applyDefAttr').checked },
            armor: {
                name: document.getElementById('armorName').value,
                bonus: document.getElementById('armorBonus').value,
                penalty: document.getElementById('armorPenalty').value,
                type: document.getElementById('armorType').value,
                desc: document.getElementById('armorDesc').value
            },
            shield: {
                name: document.getElementById('shieldName').value,
                bonus: document.getElementById('shieldBonus').value,
                penalty: document.getElementById('shieldPenalty').value,
                type: document.getElementById('shieldType').value,
                desc: document.getElementById('shieldDesc').value
            },
            others: []
        },
        skills: [],
        attacks: []
    };

    attrs.forEach(a => data.attrs[a] = document.getElementById(`attr-${a}`).value);

    skillsList.forEach((_, i) => {
        data.skills.push({
            train: document.getElementById(`skTrain${i}`).checked,
            other: document.getElementById(`skOther${i}`).value
        });
    });

    document.querySelectorAll('.atk-row').forEach(row => {
        data.attacks.push({
            name: row.querySelector('.inp-name').value,
            bonus: row.querySelector('.inp-bonus').value,
            dmg: row.querySelector('.inp-dmg').value,
            crit: row.querySelector('.inp-crit').value,
            desc: row.querySelector('.inp-desc').value,
            type: row.querySelector('.inp-type').value,
            range: row.querySelector('.inp-range').value
        });
    });

    document.querySelectorAll('.def-row').forEach(row => {
        data.defense.others.push({
            name: row.querySelector('.inp-name').value,
            bonus: row.querySelector('.inp-bonus').value
        });
    });

    localStorage.setItem('t20_sheet_v7', JSON.stringify(data));
}

function loadData() {
    const json = localStorage.getItem('t20_sheet_v7');
    if (!json) { addAttack(); return; }
    const data = JSON.parse(json);

    // Header
    document.getElementById('charName').value = data.header.name || '';
    document.getElementById('playerName').value = data.header.player || '';
    document.getElementById('charRace').value = data.header.race || '';
    document.getElementById('charOrigin').value = data.header.origin || '';
    document.getElementById('charClass').value = data.header.class || '';
    document.getElementById('charLevel').value = data.header.level || '1';
    document.getElementById('charDeity').value = data.header.deity || '';

    // Extras
    if(data.extras) {
        document.getElementById('charProfs').value = data.extras.profs || '';
        document.getElementById('charSize').value = data.extras.size || '0';
        document.getElementById('charSpeed').value = data.extras.speed || '';
        document.getElementById('charXP').value = data.extras.xp || '';
    }

    // Attrs & Status
    if(data.attrs) attrs.forEach(a => document.getElementById(`attr-${a}`).value = data.attrs[a]);
    if(data.status) {
        document.getElementById('pvMax').value = data.status.pvM; document.getElementById('pvCurrent').value = data.status.pvC;
        document.getElementById('pmMax').value = data.status.pmM; document.getElementById('pmCurrent').value = data.status.pmC;
    }

    // Defense
    if(data.defense) {
        if (data.defense.config) {
            document.getElementById('defAttrSelect').value = data.defense.config.attr || 'DES';
            document.getElementById('applyDefAttr').checked = data.defense.config.apply;
        }
        if (data.defense.armor) {
            document.getElementById('armorName').value = data.defense.armor.name || '';
            document.getElementById('armorBonus').value = data.defense.armor.bonus || '';
            document.getElementById('armorPenalty').value = data.defense.armor.penalty || '';
            document.getElementById('armorType').value = data.defense.armor.type || 'light';
            document.getElementById('armorDesc').value = data.defense.armor.desc || '';
        }
        if (data.defense.shield) {
            document.getElementById('shieldName').value = data.defense.shield.name || '';
            document.getElementById('shieldBonus').value = data.defense.shield.bonus || '';
            document.getElementById('shieldPenalty').value = data.defense.shield.penalty || '';
            document.getElementById('shieldType').value = data.defense.shield.type || 'light';
            document.getElementById('shieldDesc').value = data.defense.shield.desc || '';
        }
        const defContainer = document.getElementById('defenseList');
        defContainer.innerHTML = '';
        if (data.defense.others && data.defense.others.length > 0) {
            data.defense.others.forEach(item => addDefenseItem(item));
        }
    }

    // Skills
    if(data.skills) {
        data.skills.forEach((s, i) => {
            if(document.getElementById(`skTrain${i}`)) {
                document.getElementById(`skTrain${i}`).checked = s.train;
                document.getElementById(`skOther${i}`).value = s.other;
            }
        });
    }

    // Attacks
    const atkList = document.getElementById('attacksList');
    atkList.innerHTML = '';
    if(data.attacks && data.attacks.length > 0) {
        data.attacks.forEach(atk => addAttack(atk));
    } else {
        addAttack();
    }

    updateCalculations();
}

function exportSheet() {
    saveData();
    const rawData = localStorage.getItem('t20_sheet_v7');
    if (!rawData) return alert("Nenhum dado!");
    const data = JSON.parse(rawData);
    const fileName = `Ficha_T20_${data.header.name || "Personagem"}.json`;
    const blob = new Blob([rawData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importSheet(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            localStorage.setItem('t20_sheet_v7', e.target.result);
            loadData();
            alert("Ficha carregada com sucesso!");
        } catch (err) {
            alert("Erro ao carregar ficha.");
        }
    };
    reader.readAsText(file);
    input.value = '';
}