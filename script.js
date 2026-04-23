// ============================================================
//  script.js — Lógica da Calculadora de Atributos
//  Os dados das raças estão em racas.js. Carregue racas.js ANTES.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const ATTRIBUTES = ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'carisma'];
    const racaSelect = document.getElementById('raca');
    const attributeTableBody = document.querySelector('#attribute-table tbody');

    makeDraggable(document.getElementById('opcoes'));

    const togglePontos = document.getElementById('togglePontos');
    const pontosInput = document.getElementById('pontosInput');
    const salvarPontosBtn = document.getElementById('salvarPontos');
    const pontosDisponiveisSpan = document.getElementById('pontos_disponiveis');
    let basePoints = 10;

    // Poderes atualmente visíveis (base + dinâmicos) — usado pelo export
    let _currentRacialPowers = [];

    // ── CONFIG: pontos editáveis ──────────────────────────────
    togglePontos.addEventListener('change', () => {
        const on = togglePontos.checked;
        pontosInput.classList.toggle('hidden', !on);
        salvarPontosBtn.classList.toggle('hidden', !on);
        if (on) pontosInput.value = basePoints;
    });

    salvarPontosBtn.addEventListener('click', () => {
        const v = parseInt(pontosInput.value, 10);
        if (!isNaN(v) && v >= 0) {
            basePoints = v; updateAll();
            togglePontos.checked = false;
            pontosInput.classList.add('hidden');
            salvarPontosBtn.classList.add('hidden');
        } else {
            alert('Por favor, insira um valor numérico válido e não negativo.');
            pontosInput.value = pontosDisponiveisSpan.textContent;
        }
    });

    // ── CONFIG: coluna "Outros" ───────────────────────────────
    document.getElementById('toggleOutrosInput').addEventListener('change', (e) => {
        document.querySelectorAll('.outros-col').forEach(col => col.classList.toggle('show', e.target.checked));
        if (!e.target.checked) { document.querySelectorAll('.attr-outros').forEach(i => i.value = 0); updateAll(); }
    });

    // ── CONFIG: modal ─────────────────────────────────────────
    document.getElementById('config-button').addEventListener('click', () => {
        document.getElementById('configOverlay').classList.add('active');
        document.getElementById('configModal').classList.add('active');
        document.getElementById('configModal').setAttribute('aria-hidden', 'false');
    });
    document.getElementById('close-config-button').addEventListener('click', closeConfigModal);
    document.getElementById('configOverlay').addEventListener('click', closeConfigModal);

    function closeConfigModal() {
        document.getElementById('configOverlay').classList.remove('active');
        document.getElementById('configModal').classList.remove('active');
        document.getElementById('configModal').setAttribute('aria-hidden', 'true');
    }

    // ── POPULAR SELETOR ───────────────────────────────────────
    function populateRaceSelect() {
        while (racaSelect.options.length > 1) racaSelect.remove(1);
        for (const raceId in RACE_DATA) {
            const race = RACE_DATA[raceId];
            const opt = document.createElement('option');
            opt.value = raceId;
            opt.textContent = race.name;
            opt.dataset.raceType = race.type;
            racaSelect.appendChild(opt);
        }
    }

    // ── TABELA ───────────────────────────────────────────────
    const ICONS = { forca: 'imagens/forca.png', destreza: 'imagens/destreza.png', constituicao: 'imagens/constituicao.png', inteligencia: 'imagens/inteligencia.png', sabedoria: 'imagens/sabedoria.png', carisma: 'imagens/carisma.png' };

    function populateAttributeTable() {
        attributeTableBody.innerHTML = '';
        ATTRIBUTES.forEach(attr => {
            const row = document.createElement('tr');
            row.innerHTML = `
        <td><img src="${ICONS[attr]}" alt="${attr}" height="40px" width="auto"></td>
        <td style="font-weight:bold;font-size:30px;">${attr.substring(0, 3).toUpperCase()}</td>
        <td>
          <div class="attr-stepper" data-attr="${attr}">
            <button type="button" class="step-btn step-minus">-</button>
            <input type="tel" id="${attr}" class="attr-base" value="0" inputmode="numeric">
            <button type="button" class="step-btn step-plus">+</button>
          </div>
        </td>
        <td><input type="number" id="${attr}_racial" class="attr-racial" value="0" style="width:75px;" readonly></td>
        <td class="outros-col"><input type="number" id="${attr}_outros" class="attr-outros" value="0" style="width:75px;"></td>
        <td id="total_${attr}" class="total-col">0</td>`;
            attributeTableBody.appendChild(row);

            const base = row.querySelector(`#${attr}`);
            const outros = row.querySelector(`#${attr}_outros`);
            const nudge = (d) => { base.dataset.previousValue = base.value; base.value = String((parseInt(base.value || '0', 10) || 0) + d); validatePoints({ target: base }); };
            row.querySelector('.step-minus').addEventListener('click', () => nudge(-1));
            row.querySelector('.step-plus').addEventListener('click', () => nudge(+1));
            base.addEventListener('focusin', (e) => { e.target.dataset.previousValue = e.target.value; });
            base.addEventListener('input', (e) => validateMinMax(e.target));
            base.addEventListener('change', validatePoints);
            outros.addEventListener('change', updateAll);
        });
    }

    // ── VALIDAÇÃO ─────────────────────────────────────────────
    function validateMinMax(input) {
        if (input.value === '' || input.value === '-') return;
        const v = parseInt(input.value, 10);
        if (isNaN(v)) input.value = input.dataset.previousValue;
        else if (v < -1) input.value = -1;
        else if (v > 4) input.value = 4;
    }

    function validatePoints(event) {
        const input = event.target;
        let v = parseInt(input.value, 10);
        if (isNaN(v) || input.value.trim() === '') { input.value = input.dataset.previousValue; flashInvalid(input); }
        else { v = Math.max(-1, Math.min(4, v)); input.value = v; }
        if (calculateAvailablePoints() < 0) { input.value = input.dataset.previousValue; flashInvalid(input); }
        updateAll();
    }

    function flashInvalid(el) {
        if (!el) return;
        el.classList.remove('flash-invalid'); void el.offsetWidth; el.classList.add('flash-invalid');
        setTimeout(() => el.classList.remove('flash-invalid'), 700);
    }

    // ── PONTOS ────────────────────────────────────────────────
    const costTable = { '-1': -1, '0': 0, '1': 1, '2': 2, '3': 4, '4': 7 };

    function calculateAvailablePoints() {
        let cost = 0;
        ATTRIBUTES.forEach(attr => { const v = parseInt(document.getElementById(attr).value); if (!isNaN(v)) cost += costTable[v] || 0; });
        return (togglePontos.checked ? (parseInt(pontosInput.value, 10) || basePoints) : basePoints) - cost;
    }

    function getPointUsage() {
        let spent = 0;
        ATTRIBUTES.forEach(attr => { const v = parseInt(document.getElementById(attr).value, 10); if (!isNaN(v)) spent += costTable[v] ?? 0; });
        const base = togglePontos.checked ? (parseInt(pontosInput.value, 10) || basePoints) : basePoints;
        return { base, spent, available: base - spent };
    }

    function updateAll() { updateTotals(); updateAvailablePoints(); }

    function updateTotals() {
        ATTRIBUTES.forEach(attr => {
            const b = parseInt(document.getElementById(attr).value) || 0;
            const r = parseInt(document.getElementById(`${attr}_racial`).value) || 0;
            const o = parseInt(document.getElementById(`${attr}_outros`).value) || 0;
            document.getElementById(`total_${attr}`).textContent = b + r + o;
        });
    }

    function updateAvailablePoints() {
        const { base, spent, available } = getPointUsage();
        pontosDisponiveisSpan.textContent = available;
        pontosDisponiveisSpan.style.color = available < 0 ? 'red' : 'black';
        const te = document.getElementById('pontos_total');
        const ge = document.getElementById('pontos_gastos');
        if (te) te.textContent = base;
        if (ge) ge.textContent = spent;
        if (available < 0) { pontosDisponiveisSpan.classList.remove('points-pulse'); void pontosDisponiveisSpan.offsetWidth; pontosDisponiveisSpan.classList.add('points-pulse'); }
    }

    // ── APLICAR ATRIBUTOS RACIAIS ─────────────────────────────
    function applyRaceAttributes(attrs, isChoice, choiceCount, lockedAttrs = [], maxPerAttr = 1) {
        // 1. Reseta e limpa todos os inputs raciais antes de aplicar a nova raça
        document.querySelectorAll('input.attr-racial').forEach(input => {
            const newEl = input.cloneNode(true);
            input.parentNode.replaceChild(newEl, input);
            const attrName = newEl.id.replace('_racial', '');

            newEl.value = attrs[attrName] || 0;
            newEl.readOnly = true;
            newEl.disabled = true;
            newEl.classList.remove('disabled'); // Limpa classe de bloqueio
            newEl.min = '';
            newEl.max = '';
        });

        if (!isChoice) return;

        const editables = document.querySelectorAll('input.attr-racial');

        editables.forEach(input => {
            const attrName = input.id.replace('_racial', '');

            // Se o atributo for travado (como o Carisma do Yidishan/Meio-Elfo), ignora
            if (lockedAttrs.includes(attrName)) return;

            const baseValRaca = attrs[attrName] || 0;
            input.disabled = false;
            input.readOnly = false;
            input.min = String(baseValRaca);
            input.max = String(baseValRaca + maxPerAttr);

            // Armazena valor para validação de estouro de pontos
            input.addEventListener('focusin', e => {
                e.target.dataset.previousValue = e.target.value;
            });

            input.addEventListener('change', e => {
                const inp = e.target;
                const min = parseInt(inp.min, 10), max = parseInt(inp.max, 10);
                let v = parseInt(inp.value, 10);

                // Validação de limites individuais do input
                if (isNaN(v) || v < min) v = min;
                else if (v > max) v = max;
                inp.value = v;

                // Cálculo de quantos pontos foram distribuídos no total
                let totalSpent = 0;
                editables.forEach(i => {
                    const attrKey = i.id.replace('_racial', '');
                    const valorBaseOriginal = attrs[attrKey] || 0;
                    let valorAtual = parseInt(i.value, 10);
                    if (isNaN(valorAtual)) valorAtual = valorBaseOriginal;
                    totalSpent += (valorAtual - valorBaseOriginal);
                });

                // Se estourar o limite de pontos da raça
                if (totalSpent > choiceCount) {
                    alert(`Você só pode distribuir ${choiceCount} pontos!`);
                    inp.value = inp.dataset.previousValue || min;

                    // Recalcula o total gasto após o "rollback"
                    totalSpent = 0;
                    editables.forEach(i => {
                        const attrKey = i.id.replace('_racial', '');
                        const vBase = attrs[attrKey] || 0;
                        totalSpent += (parseInt(i.value, 10) - vBase);
                    });
                } else {
                    inp.dataset.previousValue = inp.value;
                }

                // --- LÓGICA DE FEEDBACK VISUAL (CAIXAS CINZAS) ---
                editables.forEach(i => {
                    const currentAttr = i.id.replace('_racial', '');
                    if (lockedAttrs.includes(currentAttr)) return;

                    const vBaseOriginal = attrs[currentAttr] || 0;
                    const vAtual = parseInt(i.value, 10) || 0;

                    if (totalSpent >= choiceCount) {
                        // Se pontos acabaram e este campo está zerado/base, desabilita e fica cinza
                        if (vAtual === vBaseOriginal) {
                            i.classList.add('disabled');
                            i.disabled = true;
                        } else {
                            // Se tem ponto aqui, mantém habilitado para permitir reduzir
                            i.classList.remove('disabled');
                            i.disabled = false;
                        }
                    } else {
                        // Se ainda tem pontos, libera todos os campos editáveis
                        i.classList.remove('disabled');
                        i.disabled = false;
                    }
                });

                updateAll(); // Atualiza os totais da tabela e pontos de compra
            });
        });
    }

    // ── RENDERIZAR PODERES RACIAIS (sanfona) ──────────────────
    // race.racialPowers = poderes base (fixos)
    // dynamicPowers = poderes das seleções do usuário (Golem, Aberrante, etc.)
    function renderRacialPowers(race, dynamicPowers = []) {
        const list = document.getElementById('racial-powers-list');
        if (!list) return;
        list.innerHTML = '';
        const all = [...(race?.racialPowers || []), ...dynamicPowers];
        _currentRacialPowers = all; // guarda para export

        all.forEach(power => {
            if (power.desc && power.desc.trim() !== '') {
                const d = document.createElement('details');
                d.className = 'fold';
                d.innerHTML = `<summary class="fold-summary">${power.name}<span class="fold-hint">ver descrição</span></summary><div class="fold-body">${power.desc}</div>`;
                list.appendChild(d);
            } else {
                const p = document.createElement('p');
                p.className = 'racial-power-name';
                p.textContent = power.name;
                list.appendChild(p);
            }
        });
    }

    // ── TROCA DE RAÇA ─────────────────────────────────────────
    function handleRaceChange() {
        const raceId = racaSelect.value;
        const race = RACE_DATA[raceId];
        const customUI = document.getElementById('race-specific-options');
        customUI.innerHTML = '';
        document.getElementById('bonusMessage').innerHTML = '';
        document.getElementById('attribute-table').style.background = '';
        document.getElementById('racial-powers-list').innerHTML = '';
        _currentRacialPowers = [];

        if (!race || raceId === 'outros') { applyRaceAttributes({}, false, 0); updateAll(); return; }

        // bonusMessage mostra APENAS bônus de atributos
        document.getElementById('bonusMessage').innerHTML = race.bonusMessage || '';
        if (race.imageUrl) {
            document.getElementById('attribute-table').style.background = `url('${race.imageUrl}') no-repeat center center`;
            document.getElementById('attribute-table').style.backgroundSize = '75% auto';
        }

        if (race.createCustomUi) race.createCustomUi(customUI);

        const updateFn = window[`update${raceId.charAt(0).toUpperCase() + raceId.slice(1)}Attributes`];
        if (typeof updateFn === 'function') {
            updateFn();
        } else {
            applyRaceAttributes(race.attributes, race.isChoice, race.choiceCount, race.lockedChoiceAttributes, race.maxChoicePerAttribute);
            renderRacialPowers(race);
        }
        updateAll();
    }

    // ── SURAGEL ───────────────────────────────────────────────
    function createSuragelUi(container) {
        const herancaOptions = Object.keys(SURAGEL_HERANCAS).map(k => `<option value="${k}">${k}</option>`).join('');
        container.innerHTML = `
        <div class="checklist" style="margin-top:10px">
            <label class="check"><input type="checkbox" id="suragel-variante"><span>Suragel Variante (Deuses de Arton)</span></label>
        </div>
        <div id="suragel-heranca-container" class="hidden mt-2">
            <label class="field-label" for="suragel-heranca" style="display:block;margin:8px 0 6px">
                <span class="section-title" style="font-size:18px">Herança</span>
            </label>
            <select id="suragel-heranca">${herancaOptions}</select>
        </div><br>`;
        container.querySelector('#suragel-variante').addEventListener('change', updateSuragelAttributes);
        container.querySelector('#suragel-heranca').addEventListener('change', updateSuragelAttributes);
    }

    function updateAggelusAttributes() { updateSuragelAttributes(); }
    function updateSulfureAttributes() { updateSuragelAttributes(); }

    function updateSuragelAttributes() {
        const raceId = racaSelect.value;
        const race = RACE_DATA[raceId];
        if (raceId !== 'aggelus' && raceId !== 'sulfure') return;

        const isVariante = document.getElementById('suragel-variante')?.checked;
        document.getElementById('suragel-heranca-container').classList.toggle('hidden', !isVariante);

        let currentAttrs = { ...race.attributes };
        document.getElementById('bonusMessage').innerHTML = race.bonusMessage || '';

        // Filtragem de Poderes
        let basePowers = [...race.racialPowers];
        const dynamicPowers = [];

        if (isVariante) {
            // Se for variante, removemos Luz Sagrada ou Sombras Profanas da lista base
            basePowers = basePowers.filter(p =>
                p.name !== 'Luz Sagrada' && p.name !== 'Sombras Profanas'
            );

            const herancaKey = document.getElementById('suragel-heranca')?.value;
            const herancaData = SURAGEL_HERANCAS[herancaKey];
            if (herancaData) {
                dynamicPowers.push({
                    name: `Herança de ${herancaKey}`,
                    desc: herancaData.description
                });
                if (herancaData.action) currentAttrs = herancaData.action(currentAttrs);
            }
        }

        applyRaceAttributes(currentAttrs, race.isChoice, race.choiceCount, race.lockedChoiceAttributes, race.maxChoicePerAttribute);

        // Criamos um objeto temporário para o renderizador com os poderes filtrados + a herança
        const temporaryRaceData = {
            ...race,
            racialPowers: basePowers
        };

        renderRacialPowers(temporaryRaceData, dynamicPowers);
        updateAll();
    }

    // ── UPDATE FUNÇÕES ─────────────────────────────────────────
    function updateGolemAttributes() {
        const raceId = racaSelect.value;
        const race = RACE_DATA[raceId];
        if (raceId !== 'golem') return;

        // Capturamos todos os dados processados pelo calculateAttributes do Golem
        const { baseAttributes, isChoice, choiceCount, maxChoicePerAttribute, selectedPowers } = race.calculateAttributes();

        // 1. Aplicamos os atributos (isso cuida da tabela e dos inputs de escolha)
        applyRaceAttributes(baseAttributes, isChoice, choiceCount, race.lockedChoiceAttributes, maxChoicePerAttribute);

        // 2. Renderizamos os poderes (passamos o objeto da raça e a lista de poderes dinâmicos)
        // O renderizador vai juntar os poderes fixos com os que o Golem "montou" agora
        renderRacialPowers(race, selectedPowers);

        // 3. Atualizamos o restante da UI
        updateAll();
    }

    function updateAberrantAttributes() {
        const race = RACE_DATA.aberrant;
        if (!race?.calculateAttributes) return;
        const r = race.calculateAttributes();
        applyRaceAttributes(r.baseAttributes, r.isChoice, r.choiceCount);
        renderRacialPowers(race, r.selectedPowers || []);
        updateAll();
    }

    function updateKallyanachAttributes() {
        const race = RACE_DATA.kallyanach;
        // aplica atributos de escolha normalmente
        applyRaceAttributes(race.attributes, race.isChoice, race.choiceCount, race.lockedChoiceAttributes, race.maxChoicePerAttribute);
        // renderiza poderes dinâmicos pelo getter
        renderRacialPowers(race, race.getSelectedPowers());
        updateAll();
    }

    function updateKoboldAttributes() {
        const race = RACE_DATA.kobold;
        if (!race?.calculateAttributes) return;
        const r = race.calculateAttributes();
        // kobold não muda atributos raciais, só poderes
        renderRacialPowers(race, r.selectedPowers || []);
        updateAll();
    }

    function updateMoreauAttributes() {
        const race = RACE_DATA.moreau;
        if (!race?.calculateAttributes) return;
        const r = race.calculateAttributes();
        applyRaceAttributes(r.baseAttributes, r.isChoice, r.choiceCount, [], r.maxChoicePerAttribute);
        renderRacialPowers(race, r.selectedPowers || []);
        updateAll();
    }

    function updateDuendeAttributes() {
        const race = RACE_DATA.duende;
        if (!race?.calculateAttributes) return;
        const r = race.calculateAttributes();
        applyRaceAttributes(r.baseAttributes, r.isChoice, r.choiceCount, [], r.maxChoicePerAttribute);
        renderRacialPowers(race, r.selectedPowers || []);
        updateAll();
    }

    // ── FILTRO ────────────────────────────────────────────────
    function handleFilterChange() {
        const sel = new Set();
        document.querySelectorAll('.race-filter:checked').forEach(cb => sel.add(cb.dataset.raceType));
        Array.from(racaSelect.options).forEach(opt => {
            if (opt.value === 'outros') { opt.style.display = 'block'; return; }
            const rd = RACE_DATA[opt.value];
            if (rd) opt.style.display = (rd.type === 'base' || sel.has(rd.type)) ? 'block' : 'none';
        });
        if (racaSelect.options[racaSelect.selectedIndex]?.style.display === 'none') {
            racaSelect.value = 'outros'; handleRaceChange();
        }
    }

    // ── RESET ─────────────────────────────────────────────────
    function smartReset() {
        try { closeConfigModal(); } catch (e) { }
        racaSelect.value = 'outros';
        document.getElementById('race-specific-options').innerHTML = '';
        document.getElementById('bonusMessage').innerHTML = '';
        document.getElementById('racial-powers-list').innerHTML = '';
        _currentRacialPowers = [];
        document.querySelectorAll('.attr-base').forEach(i => { i.dataset.previousValue = i.value; i.value = 0; });
        pontosInput.value = basePoints;
        togglePontos.checked = false;
        pontosInput.classList.add('hidden');
        salvarPontosBtn.classList.add('hidden');
        const pg = document.getElementById('promptGerado');
        if (pg) pg.textContent = '';
        handleRaceChange(); updateAll();
    }

    // ── PROMPT ────────────────────────────────────────────────
    const PROMPT_ELEMENTS = {
        poses: ['in a heroic pose', 'crouching and ready for battle', 'meditating in silence', 'staring at the horizon', 'running at full speed', 'delivering a powerful blow', 'casting a spell', 'hiding in the shadows', 'with arms crossed, imposing'],
        attire: ['full plate armor', "adventurer's leather clothes", 'an ornate mage robe', 'ceremonial cleric vestments', 'extravagant noble attire', 'wild animal pelts', 'light and stealthy armor', 'blacksmith clothes with soot'],
        heldItems: ['holding a shining sword', 'with an ancient staff in hand', 'wielding a battle axe', 'with a longbow drawn', 'holding twin daggers', 'with a shield and mace', 'holding an orb of energy', 'with an open tome of spells'],
        locations: ['in an ancient forest', 'on top of a rocky mountain', 'in a bustling tavern', 'in the ruins of a castle', 'inside a damp dungeon', 'in an underground city', 'in a dark swamp', 'in a clearing under the moonlight']
    };
    const fixedChar = '4k, ultra detailed, intricate details, photorealistic, cinematic lighting, volumetric lighting, photographic, Unreal Engine, anime style';

    function generateRandomPrompt() {
        const rId = racaSelect.value, rd = RACE_DATA[rId], pg = document.getElementById('promptGerado');
        if (!rd || rId === 'outros') { pg.textContent = 'Selecione uma raça primeiro.'; return; }
        const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
        let t;
        if (rId === 'golem') {
            const c = document.getElementById('golem-chassi')?.value || 'stone';
            t = `A golem made of ${c}, ${rnd(['guarding an ancient site', 'in a battle-ready pose', 'standing still like a statue', 'in the middle of a construction'])}, ${fixedChar}`;
        } else {
            const n = rd.name.split(' ')[0].replace('(', '');
            t = `A ${n}, ${rnd(PROMPT_ELEMENTS.poses)}, wearing ${rnd(PROMPT_ELEMENTS.attire)}, ${rnd(PROMPT_ELEMENTS.heldItems)}, in ${rnd(PROMPT_ELEMENTS.locations)}, ${fixedChar}`;
        }
        pg.textContent = t;
    }

    document.getElementById('gerarPrompt').addEventListener('click', generateRandomPrompt);
    document.getElementById('copiarPrompt').addEventListener('click', () => {
        const t = document.getElementById('promptGerado').textContent;
        if (t && !t.startsWith('Selecione'))
            navigator.clipboard.writeText(t).then(() => alert('Prompt copiado!')).catch(console.error);
    });

    // ── DRAG ──────────────────────────────────────────────────
    function makeDraggable(el) {
        let dragging = false, ox, oy;
        el.addEventListener('mousedown', e => {
            if (['INPUT', 'SELECT', 'BUTTON', 'LABEL', 'SPAN'].includes(e.target.tagName)) return;
            dragging = true; ox = e.clientX - el.offsetLeft; oy = e.clientY - el.offsetTop; el.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', e => { if (dragging) { el.style.left = `${e.clientX - ox}px`; el.style.top = `${e.clientY - oy}px`; } });
        document.addEventListener('mouseup', () => { dragging = false; el.style.cursor = 'move'; });
    }

    // ── EXPORT PARA FICHA ────────────────────────────────────
    function enviarAtributosParaFicha() {
        const attrMap = { forca: 'FOR', destreza: 'DES', constituicao: 'CON', inteligencia: 'INT', sabedoria: 'SAB', carisma: 'CAR' };
        const atributos = {};
        ATTRIBUTES.forEach(a => { const el = document.getElementById(`total_${a}`); atributos[attrMap[a]] = el ? el.textContent : '0'; });

        const raceId = racaSelect.value;
        const race = RACE_DATA[raceId];
        const racaNome = race?.name?.split('/')[0] || '';

        let tamanho = race?.tamanho || 'Médio';
        const gt = document.getElementById('golem-tamanho'); if (gt?.value) tamanho = gt.value;
        const dt = document.getElementById('duende-tamanho'); if (dt?.value) tamanho = dt.value;

        const poderesRaciais = _currentRacialPowers.map(p => ({ name: p.name, desc: p.desc || '' }));

        let fichaData = JSON.parse(localStorage.getItem('t20SheetData') || '{}');
        if (!fichaData.attrs) fichaData.attrs = {};
        fichaData.attrs = { ...fichaData.attrs, ...atributos };
        if (racaNome) fichaData.charRace = racaNome;
        if (tamanho) fichaData.charSize = tamanho;
        if (poderesRaciais.length > 0) fichaData.racialPowers = poderesRaciais;

        localStorage.setItem('t20SheetData', JSON.stringify(fichaData));
        alert(`Atributos${racaNome ? ` e raça "${racaNome}"` : ''}${tamanho ? ` (${tamanho})` : ''} enviados!\n\nA ficha será aberta em uma nova aba.`);
        window.open('https://nicholemos.github.io/ficha/', '_blank');
    }

    // ── EVENT LISTENERS ───────────────────────────────────────
    document.getElementById('reset-button').addEventListener('click', smartReset);
    document.getElementById('enviar-ficha-button').addEventListener('click', enviarAtributosParaFicha);
    document.querySelectorAll('.race-filter').forEach(cb => cb.addEventListener('change', handleFilterChange));
    racaSelect.addEventListener('change', handleRaceChange);

    // ── INICIALIZAÇÃO ─────────────────────────────────────────
    populateAttributeTable();
    populateRaceSelect();
    handleRaceChange();
    handleFilterChange();

    // ── EXPOR AO GLOBAL (necessário para racas.js chamar via event listeners) ──
    window.updateAll = updateAll;
    window.applyRaceAttributes = applyRaceAttributes;
    window.renderRacialPowers = renderRacialPowers;
    window.createSuragelUi = createSuragelUi;
    window.updateGolemAttributes = updateGolemAttributes;
    window.updateAberrantAttributes = updateAberrantAttributes;
    window.updateKoboldAttributes = updateKoboldAttributes;
    window.updateMoreauAttributes = updateMoreauAttributes;
    window.updateDuendeAttributes = updateDuendeAttributes;
    window.updateAggelusAttributes = updateAggelusAttributes;
    window.updateSulfureAttributes = updateSulfureAttributes;
    window.updateKallyanachAttributes = updateKallyanachAttributes;

});
