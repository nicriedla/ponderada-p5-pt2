// Microinterface p5.js: componente para escolher colunas de um CSV ja importado.

const sketch = (p) => {
  const BLUE = '#12aee8';
  const BLUE_DARK = '#078bc0';
  const BG = '#f4f4f5';
  const CARD = '#ffffff';
  const LINE = '#dfe3e8';
  const TEXT = '#26272b';
  const MUTED = '#8b8f98';
  const FIELD = '#fbfcfd';

  const TYPE_COLOR = {
    num: '#128fed',
    cat: '#12aee8',
    data: '#b45309',
    bool: '#15803d',
  };

  const TYPE_LABEL = {
    num: 'Num',
    cat: 'Cat',
    data: 'Data',
    bool: 'Bool',
  };

  const headers = [
    'safra_ref_uso',
    'score_interno',
    'pd_produto',
    'score_generico_1',
    'score_generico_2',
    'capacidade_pagamento',
    'delta_capacidade_pagamento',
    'flag_filtros',
    'score_propensao_contrato',
    'score_credito_cross',
    'renda_estimada',
    'fx_idade',
    'limite_ofertado',
    'flag_contrato',
    'flag_ativacao',
    'over30mob3',
    'token',
  ];
  const rows = [
    ['M2', '657', '0.343', '798', '743', '4600.0', '3325.0', '0', '30.0', '916', '5450.0', '21-30', 'null', '0', '0', 'null', '0'],
    ['M2', '645', '0.355', '715', '753', '775.0', '775.0', '0', '114.0', '897', '1600.0', '18-20', 'null', '0', '0', 'null', '1'],
    ['M2', '457', '0.543', '639', '747', '1100.0', '975.0', '1', '515.0', '887', '2025.0', '21-30', 'null', '0', '0', 'null', '2'],
    ['M2', '747', '0.253', '558', '808', '3175.0', '500.0', '0', '110.0', '881', '2125.0', '31-40', 'null', '0', '0', 'null', '3'],
    ['M2', '409', '0.591', '599', '747', '725.0', '-125.0', '1', '360.0', '876', '1625.0', '31-40', 'null', '0', '0', 'null', '4'],
    ['M2', '647', '0.353', '849', '692', '2175.0', '1250.0', '0', '107.0', '943', '3825.0', '31-40', 'null', '0', '0', 'null', '5'],
  ];

  const colTypes = {
    safra_ref_uso: 'cat',
    score_interno: 'num',
    pd_produto: 'num',
    score_generico_1: 'num',
    score_generico_2: 'num',
    capacidade_pagamento: 'num',
    delta_capacidade_pagamento: 'num',
    flag_filtros: 'bool',
    score_propensao_contrato: 'num',
    score_credito_cross: 'num',
    renda_estimada: 'num',
    fx_idade: 'cat',
    limite_ofertado: 'cat',
    flag_contrato: 'bool',
    flag_ativacao: 'bool',
    over30mob3: 'cat',
    token: 'num',
  };

  let checks = headers.map((name, index) => ({ name, index, checked: true, type: colTypes[name] }));
  let selectedCols = headers.slice();
  let hoverId = null;
  let activeTab = 'preview';
  let exported = false;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.textFont('Arial');
    p.pixelDensity(1);
  };

  p.draw = () => {
    p.background(BG);
    hoverId = null;
    drawColumnModule();
  };

  function drawColumnModule() {
    const moduleW = Math.min(980, p.width - 48);
    const moduleH = Math.min(620, p.height - 48);
    const x = (p.width - moduleW) / 2;
    const y = (p.height - moduleH) / 2;
    const leftW = 430;
    const rightW = moduleW - leftW - 28;

    card(x, y, moduleW, moduleH);

    p.noStroke();
    p.fill(TEXT);
    p.textStyle(p.BOLD);
    p.textSize(24);
    p.textAlign(p.LEFT);
    p.text('Selecionar colunas do CSV', x + 28, y + 42);

    p.textStyle(p.NORMAL);
    p.fill(MUTED);
    p.textSize(13);
    p.text('Arquivo importado: base_credito_m2.csv', x + 28, y + 66);

    statusPill(x + moduleW - 220, y + 24, `${selectedCols.length}/${headers.length} colunas selecionadas`);

    drawColumnList(x + 28, y + 104, leftW, moduleH - 132);
    drawPreview(x + 28 + leftW + 28, y + 104, rightW - 28, moduleH - 132);
  }

  function drawColumnList(x, y, w, h) {
    sectionTitle('Colunas disponiveis', x, y);

    const allBtn = { x, y: y + 28, w: 82, h: 32, id: 'all' };
    const clearBtn = { x: x + 90, y: y + 28, w: 82, h: 32, id: 'clear' };
    button(allBtn, 'Todas', BLUE, false, true);
    button(clearBtn, 'Limpar', '#6b7280', false, true);

    const listY = y + 78;
    const rowH = 48;
    const colW = (w - 12) / 2;
    checks.forEach((check, index) => {
      const cx = x + (index % 2) * (colW + 12);
      const cy = listY + Math.floor(index / 2) * rowH;
      checkbox(check, cx, cy, colW, rowH - 8);
    });

    const exportBtn = { x, y: y + h - 48, w, h: 44, id: 'export' };
    button(exportBtn, exported ? 'CSV pronto para download' : 'Exportar CSV filtrado', selectedCols.length ? BLUE : '#9ca3af', selectedCols.length === 0);
  }

  function drawPreview(x, y, w, h) {
    sectionTitle('Previa do arquivo final', x, y);
    tabButton(x, y + 42, 'preview', 'Tabela');
    tabButton(x + 82, y + 42, 'summary', 'Resumo');

    if (activeTab === 'preview') drawTable(x, y + 76, w, h - 76);
    if (activeTab === 'summary') drawSummary(x, y + 82, w, h - 82);
  }

  function drawTable(x, y, w, h) {
    if (!selectedCols.length) {
      emptyState(x, y, w, h, 'Selecione pelo menos uma coluna.');
      return;
    }

    const colW = w / selectedCols.length;
    const rowH = 32;
    const indexes = selectedCols.map((col) => headers.indexOf(col));

    p.noStroke();
    p.fill('#eef2f7');
    p.rect(x, y, w, rowH, 6, 6, 0, 0);

    selectedCols.forEach((col, index) => {
      p.fill(TEXT);
      p.textStyle(p.BOLD);
      p.textSize(12);
      p.textAlign(p.LEFT);
      p.text(shortText(col, Math.floor(colW / 7)), x + index * colW + 8, y + 21);
      p.textStyle(p.NORMAL);
    });

    rows.forEach((row, rowIndex) => {
      const rowY = y + rowH + rowIndex * rowH;
      if (rowY + rowH > y + h) return;
      p.fill(rowIndex % 2 === 0 ? '#ffffff' : FIELD);
      p.rect(x, rowY, w, rowH);

      selectedCols.forEach((col, colIndex) => {
        const value = row[indexes[colIndex]] || '';
        p.fill('#374151');
        p.textSize(12);
        p.textAlign(p.LEFT);
        p.text(shortText(value, Math.floor(colW / 7)), x + colIndex * colW + 8, rowY + 21);
      });

      p.stroke(LINE);
      p.line(x, rowY + rowH, x + w, rowY + rowH);
    });
  }

  function drawSummary(x, y, w, h) {
    const counts = { num: 0, cat: 0, data: 0, bool: 0 };
    selectedCols.forEach((col) => counts[colTypes[col]] += 1);
    const items = Object.entries(counts).filter(([, value]) => value > 0);

    if (!items.length) {
      emptyState(x, y, w, h, 'Nenhuma coluna selecionada.');
      return;
    }

    const max = Math.max(...items.map(([, value]) => value));
    items.forEach(([type, value], index) => {
      const rowY = y + index * 62;
      p.noStroke();
      p.fill(TEXT);
      p.textSize(13);
      p.textAlign(p.LEFT);
      p.text(TYPE_LABEL[type], x, rowY + 18);
      p.fill('#eef2f7');
      p.rect(x + 84, rowY + 2, w - 130, 20, 4);
      p.fill(TYPE_COLOR[type]);
      p.rect(x + 84, rowY + 2, ((w - 130) * value) / max, 20, 4);
      p.fill('#374151');
      p.textAlign(p.RIGHT);
      p.text(value, x + w - 8, rowY + 18);
    });
  }

  function checkbox(check, x, y, w, h) {
    const color = TYPE_COLOR[check.type] || BLUE;
    if (mouseIn(x, y, w, h)) hoverId = `check:${check.index}`;

    p.fill(hoverId === `check:${check.index}` ? FIELD : '#ffffff');
    p.stroke(check.checked ? color : LINE);
    p.strokeWeight(1);
    p.rect(x, y, w, h, 6);

    p.fill(check.checked ? color : '#ffffff');
    p.stroke(check.checked ? color : '#b9c3d0');
    p.rect(x + 12, y + 9, 18, 18, 4);

    if (check.checked) {
      p.stroke('#ffffff');
      p.strokeWeight(2);
      p.line(x + 16, y + 18, x + 20, y + 22);
      p.line(x + 20, y + 22, x + 27, y + 13);
    }

    p.noStroke();
    p.fill(TEXT);
    p.textSize(13);
    p.textAlign(p.LEFT);
    p.text(shortText(check.name, 18), x + 42, y + 17);
    p.fill(color);
    p.textSize(10);
    p.text(TYPE_LABEL[check.type], x + 42, y + 31);
  }

  function statusPill(x, y, label) {
    p.noStroke();
    p.fill(BLUE);
    p.rect(x, y, 192, 30, 15);
    p.fill('#ffffff');
    p.textStyle(p.BOLD);
    p.textSize(12);
    p.textAlign(p.CENTER);
    p.text(label, x + 96, y + 20);
    p.textStyle(p.NORMAL);
  }

  function sectionTitle(label, x, y) {
    p.noStroke();
    p.fill(TEXT);
    p.textStyle(p.BOLD);
    p.textSize(17);
    p.textAlign(p.LEFT);
    p.text(label, x, y + 2);
    p.textStyle(p.NORMAL);
    p.stroke(LINE);
    p.line(x, y + 16, x + 330, y + 16);
  }

  function tabButton(x, y, id, label) {
    if (mouseIn(x, y - 18, 74, 30)) hoverId = `tab:${id}`;
    p.noStroke();
    p.fill(activeTab === id ? BLUE : MUTED);
    p.textSize(13);
    p.textAlign(p.LEFT);
    p.text(label, x, y);
    if (activeTab === id) p.rect(x, y + 8, p.textWidth(label), 2, 1);
  }

  function button(btn, label, color, disabled = false, small = false) {
    if (!disabled && mouseIn(btn.x, btn.y, btn.w, btn.h)) hoverId = btn.id;
    p.noStroke();
    p.fill(disabled ? '#cbd5e1' : hoverId === btn.id ? BLUE_DARK : color);
    p.rect(btn.x, btn.y, btn.w, btn.h, small ? 4 : 5);
    p.fill('#ffffff');
    p.textStyle(p.BOLD);
    p.textSize(small ? 12 : 14);
    p.textAlign(p.CENTER);
    p.text(label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
    p.textStyle(p.NORMAL);
  }

  function card(x, y, w, h) {
    p.noStroke();
    p.fill('rgba(0,0,0,0.05)');
    p.rect(x + 10, y + 12, w, h, 10);
    p.fill(CARD);
    p.rect(x, y, w, h, 10);
  }

  function emptyState(x, y, w, h, message) {
    p.noStroke();
    p.fill(MUTED);
    p.textSize(14);
    p.textAlign(p.CENTER);
    p.text(message, x + w / 2, y + h / 2);
  }

  function exportSelectedCSV() {
    if (!selectedCols.length) return;
    const indexes = selectedCols.map((col) => headers.indexOf(col));
    const output = [
      selectedCols.join(','),
      ...rows.map((row) => indexes.map((index) => csvCell(row[index] || '')).join(',')),
    ].join('\n');

    const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'base_credito_m2_colunas.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    exported = true;
  }

  function csvCell(value) {
    const text = String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function updateSelectedCols() {
    selectedCols = checks.filter((check) => check.checked).map((check) => check.name);
    exported = false;
  }

  function mouseIn(x, y, w, h) {
    return p.mouseX >= x && p.mouseX <= x + w && p.mouseY >= y && p.mouseY <= y + h;
  }

  function shortText(value, limit) {
    const text = String(value);
    if (text.length <= limit) return text;
    return `${text.slice(0, Math.max(0, limit - 3))}...`;
  }

  p.mousePressed = () => {
    if (hoverId === 'all') {
      checks.forEach((check) => check.checked = true);
      updateSelectedCols();
    }
    if (hoverId === 'clear') {
      checks.forEach((check) => check.checked = false);
      updateSelectedCols();
    }
    if (hoverId === 'export') exportSelectedCSV();
    if (hoverId === 'tab:preview') activeTab = 'preview';
    if (hoverId === 'tab:summary') activeTab = 'summary';
    if (hoverId && hoverId.startsWith('check:')) {
      const index = Number(hoverId.split(':')[1]);
      const check = checks.find((item) => item.index === index);
      if (check) check.checked = !check.checked;
      updateSelectedCols();
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

new p5(sketch);
