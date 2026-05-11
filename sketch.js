// CSV Column Selector & Data Visualization
// Microinterface interativa para exploração de dados em CSV
// Permite seleção de colunas, identificação de tipos de dados e visualizações

const sketch = (p) => {

  // PALETTE
  const BG      = '#0e0f13';
  const PANEL   = '#14161d';
  const BORDER  = '#2a2d3a';
  const ACCENT  = '#00e5ff';
  const ACCENT2 = '#7c5cff';
  const SUCCESS = '#00ffb2';
  const MUTED   = '#4a4f6a';
  const TEXT    = '#c8cde8';
  const TEXTHI  = '#ffffff';
  const TYPE_COLOR = { num:'#00e5ff', cat:'#7c5cff', data:'#ffb300', bool:'#00ffb2' };
  const TYPE_LABEL = { num:'NUM', cat:'CAT', data:'DATE', bool:'BOOL' };

  // STATE
  let state = 'idle'; // idle | selecting | viz
  let headers = [], rows = [], colTypes = {};
  let checkboxes = [], importedCols = [];
  let importBtn = null, uploadBtn = null, demoBtn = null;
  let particles = [];
  let scanY = 0, flashAlpha = 0;
  let fileName = '';

  // VIZ STATE
  let vizCharts = [];
  let vizAnim = 0;
  let activeChart = 0;
  let vizTab = 'charts';
  let tableScroll = 0;

  const DEMO_CSV = `id,nome,idade,cidade,salario,ativo,departamento,avaliacao,faltas
1,Ana Lima,28,São Paulo,4500,true,Engenharia,4.7,2
2,Bruno Costa,35,Rio de Janeiro,7200,true,Marketing,3.9,5
3,Carla Melo,22,Belo Horizonte,3200,false,Suporte,4.1,0
4,Diego Souza,41,Curitiba,9100,true,Engenharia,4.9,1
5,Elena Rocha,30,Porto Alegre,5800,true,RH,4.3,3
6,Fábio Nunes,27,Fortaleza,3800,false,Suporte,3.5,8
7,Gabi Alves,33,Salvador,6200,true,Marketing,4.6,2
8,Hugo Pires,45,Manaus,11000,true,Gestão,4.8,0
9,Iris Teixeira,26,Recife,3500,true,Engenharia,4.2,4
10,João Vaz,38,Goiânia,7800,false,Financeiro,3.7,6`;

  // SETUP
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.textFont('monospace');
    spawnParticles();
    document.getElementById('file-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      fileName = file.name;
      const reader = new FileReader();
      reader.onload = ev => parseCSV(ev.target.result);
      reader.readAsText(file);
    });
  };

  // PARTICLES
  function spawnParticles() {
    particles = [];
    for (let i = 0; i < 55; i++) particles.push({
      x: p.random(p.width), y: p.random(p.height),
      vx: p.random(-0.25, 0.25), vy: p.random(-0.15, 0.1),
      r: p.random(1, 2.5), alpha: p.random(30, 100)
    });
  }
  function drawParticles() {
    p.noStroke();
    for (let pt of particles) {
      pt.x += pt.vx; pt.y += pt.vy;
      if (pt.x < 0) pt.x = p.width; if (pt.x > p.width) pt.x = 0;
      if (pt.y < 0) pt.y = p.height; if (pt.y > p.height) pt.y = 0;
      p.fill(0, 229, 255, pt.alpha);
      p.ellipse(pt.x, pt.y, pt.r);
    }
  }

  // CSV
  function parseCSV(text) {
    const lines = text.trim().split('\n');
    headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    colTypes = {};
    headers.forEach((h, i) => { colTypes[h] = guessType(rows.map(r => r[i] || '')); });
    buildCheckboxes();
    state = 'selecting';
    flashAlpha = 255;
  }
  function guessType(vals) {
    const s = vals.filter(v => v !== '').slice(0, 10);
    if (s.every(v => v === 'true' || v === 'false')) return 'bool';
    if (s.every(v => /^\d{4}-\d{2}-\d{2}/.test(v))) return 'data';
    if (s.every(v => !isNaN(parseFloat(v)) && v !== '')) return 'num';
    return 'cat';
  }

  // CHECKBOXES
  function buildCheckboxes() {
    const COLS = 3, cw = 190, ch = 56, gap = 12;
    const panelW = COLS * cw + (COLS - 1) * gap + 40;
    const panelH = Math.ceil(headers.length / COLS) * (ch + gap) + 130;
    const px = (p.width - panelW) / 2, py = (p.height - panelH) / 2;
    checkboxes = headers.map((h, i) => ({
      col: i, name: h, type: colTypes[h], checked: true,
      x: px + 20 + (i % COLS) * (cw + gap),
      y: py + 70 + Math.floor(i / COLS) * (ch + gap),
      w: cw, h: ch, hover: false, anim: 1
    }));
    importBtn = { x: p.width / 2 - 110, y: py + panelH - 44, w: 220, h: 38, hover: false };
  }

  // BUILD VIZ
  function buildVizCharts() {
    vizCharts = [];
    importedCols.forEach(col => {
      const idx = headers.indexOf(col);
      const vals = rows.map(r => r[idx] ?? '');
      const t = colTypes[col];
      if (t === 'num') {
        const nums = vals.map(parseFloat).filter(v => !isNaN(v));
        const mn = Math.min(...nums), mx = Math.max(...nums);
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        const BUCKETS = 6;
        const bw = (mx - mn) / BUCKETS || 1;
        const hist = Array(BUCKETS).fill(0);
        nums.forEach(v => { const bi = Math.min(Math.floor((v - mn) / bw), BUCKETS - 1); hist[bi]++; });
        vizCharts.push({ col, type: 'histogram', nums, hist, min: mn, max: mx, avg, bw, animProg: 0 });
      } else if (t === 'cat' || t === 'bool') {
        const freq = {};
        vals.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
        vizCharts.push({ col, type: 'bar', data: sorted, total: vals.length, animProg: 0 });
      } else if (t === 'data') {
        const dates = vals.filter(v => v !== '').sort();
        vizCharts.push({ col, type: 'daterange', first: dates[0], last: dates[dates.length - 1], count: dates.length, animProg: 0 });
      }
    });
    vizAnim = 0; activeChart = 0; vizTab = 'charts'; tableScroll = 0;
  }

  // MAIN DRAW
  p.draw = () => {
    p.background(BG);
    drawGrid();
    drawParticles();
    if      (state === 'idle')      drawIdle();
    else if (state === 'selecting') drawSelecting();
    else if (state === 'viz')       drawViz();
    if (flashAlpha > 0) {
      p.fill(0, 229, 255, flashAlpha * 0.25); p.noStroke(); p.rect(0, 0, p.width, p.height);
      flashAlpha -= 10;
    }
    scanY = (scanY + 1.2) % p.height;
    p.stroke(0, 229, 255, 14); p.strokeWeight(1);
    p.line(0, scanY, p.width, scanY);
  };

  // GRID
  function drawGrid() {
    p.stroke(255, 255, 255, 5); p.strokeWeight(0.5);
    for (let x = 0; x < p.width; x += 40) p.line(x, 0, x, p.height);
    for (let y = 0; y < p.height; y += 40) p.line(0, y, p.width, y);
  }

  // BTN
  function drawBtn(x, y, w, h, label, hover, color, disabled) {
    color = color || ACCENT; disabled = disabled || false;
    const c = p.color(color);
    const a = disabled ? 25 : (hover ? 255 : 170);
    p.fill(p.red(c), p.green(c), p.blue(c), hover && !disabled ? 28 : 8);
    p.stroke(p.red(c), p.green(c), p.blue(c), a);
    p.strokeWeight(1); p.rect(x, y, w, h, 4);
    p.fill(p.red(c), p.green(c), p.blue(c), a);
    p.noStroke(); p.textSize(11); p.textAlign(p.CENTER);
    p.text(label, x + w / 2, y + h / 2 + 4);
  }
  function inBox(mx, my, b) { return mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h; }
  function drawCorner(x, y, fx, fy) {
    fx = fx || false; fy = fy || false;
    p.stroke(ACCENT); p.strokeWeight(2);
    p.line(x, y, x + (fx ? -16 : 16), y); p.line(x, y, x, y + (fy ? -16 : 16));
  }

  // IDLE
  function drawIdle() {
    const cx = p.width / 2, cy = p.height / 2;
    p.noStroke(); p.fill(ACCENT); p.textSize(11); p.textAlign(p.CENTER);
    p.text('◈  MICROINTERFACE  //  CSV COLUMN SELECTOR  ◈', cx, cy - 120);
    p.fill(TEXTHI); p.textSize(30); p.text('SELECIONE COLUNAS DO CSV', cx, cy - 82);
    p.fill(MUTED); p.textSize(12);
    p.text('Carregue um arquivo .csv e escolha quais colunas importar', cx, cy - 56);
    const bw = 200, bh = 44, gap = 16;
    uploadBtn = { x: cx - bw - gap / 2, y: cy - 8, w: bw, h: bh };
    demoBtn   = { x: cx + gap / 2,      y: cy - 8, w: bw, h: bh };
    uploadBtn.hover = inBox(p.mouseX, p.mouseY, uploadBtn);
    demoBtn.hover   = inBox(p.mouseX, p.mouseY, demoBtn);
    drawBtn(uploadBtn.x, uploadBtn.y, bw, bh, '⬆  CARREGAR CSV', uploadBtn.hover, ACCENT);
    drawBtn(demoBtn.x, demoBtn.y, bw, bh, '◎  DEMO', demoBtn.hover, ACCENT2);
    p.stroke(ACCENT); p.strokeWeight(0.5); p.noFill();
    p.rect(cx - 320, cy - 148, 640, 210, 4);
    drawCorner(cx - 320, cy - 148); drawCorner(cx + 304, cy - 148, true);
    drawCorner(cx - 320, cy + 62, false, true); drawCorner(cx + 304, cy + 62, true, true);
  }

  // SELECTING
  function drawSelecting() {
    const COLS = 3, cw = 190, ch = 56, gap = 12;
    const panelW = COLS * cw + (COLS - 1) * gap + 40;
    const totalR = Math.ceil(headers.length / COLS);
    const panelH = totalR * (ch + gap) + 130;
    const px = (p.width - panelW) / 2, py = (p.height - panelH) / 2;

    p.fill(PANEL); p.stroke(BORDER); p.strokeWeight(1); p.rect(px, py, panelW, panelH, 6);
    p.fill(0, 229, 255, 20); p.noStroke(); p.rect(px, py, panelW, 48, 6, 6, 0, 0);
    p.fill(ACCENT); p.noStroke(); p.textSize(11); p.textAlign(p.LEFT);
    p.text('◈  SELEÇÃO DE COLUNAS', px + 16, py + 20);
    const selCount = checkboxes.filter(c => c.checked).length;
    p.fill(MUTED); p.textSize(10); p.textAlign(p.RIGHT);
    p.text(selCount + ' / ' + headers.length + ' selecionadas', px + panelW - 16, py + 20);
    if (fileName) { p.fill(TEXT); p.textSize(9); p.textAlign(p.LEFT); p.text('arquivo: ' + fileName, px + 16, py + 36); }

    for (let cb of checkboxes) {
      cb.hover = inBox(p.mouseX, p.mouseY, cb);
      cb.anim = p.lerp(cb.anim, cb.checked ? 1 : 0, 0.15);
      const tc = TYPE_COLOR[cb.type] || MUTED;
      const cr = p.color(tc);
      p.fill(p.red(cr), p.green(cr), p.blue(cr), cb.checked ? 28 : 8);
      p.stroke(cb.hover ? tc : (cb.checked ? tc + '66' : BORDER));
      p.strokeWeight(cb.checked ? 1 : 0.5); p.rect(cb.x, cb.y, cb.w, cb.h, 4);
      const bx = cb.x + 12, by2 = cb.y + cb.h / 2 - 8;
      p.stroke(cb.checked ? tc : MUTED); p.strokeWeight(1); p.noFill(); p.rect(bx, by2, 16, 16, 2);
      if (cb.anim > 0.05) {
        p.stroke(tc); p.strokeWeight(2);
        p.line(bx + 3, by2 + 8, bx + 6, by2 + 11 * cb.anim);
        p.line(bx + 6, by2 + 11 * cb.anim, bx + 13, by2 + 4 + (1 - cb.anim) * 7);
      }
      p.noStroke(); p.fill(cb.checked ? TEXTHI : MUTED); p.textSize(12); p.textAlign(p.LEFT);
      p.text(cb.name, cb.x + 36, cb.y + 20);
      p.fill(p.red(cr), p.green(cr), p.blue(cr), 40); p.noStroke();
      p.rect(cb.x + 36, cb.y + 28, 36, 14, 3);
      p.fill(tc); p.textSize(8); p.text(TYPE_LABEL[cb.type] || 'CAT', cb.x + 39, cb.y + 39);
    }

    if (importBtn) {
      importBtn.hover = inBox(p.mouseX, p.mouseY, importBtn);
      const active = selCount > 0;
      drawBtn(importBtn.x, importBtn.y, importBtn.w, importBtn.h,
        'IMPORTAR + VISUALIZAR', importBtn.hover && active, active ? SUCCESS : MUTED, !active);
    }
    p.noStroke(); p.fill(ACCENT); p.textSize(10); p.textAlign(p.LEFT);
    p.text('[ TODAS ]', px + 20, py + panelH - 10);
    p.fill(MUTED); p.text('[ LIMPAR ]', px + 80, py + panelH - 10);
  }

  // VIZ SCREEN
  function drawViz() {
    vizAnim = Math.min(vizAnim + 0.03, 1);
    const pw = Math.min(p.width - 40, 920);
    const ph = p.height - 60;
    const px = p.width / 2 - pw / 2, py = 30;

    p.fill(PANEL); p.stroke(SUCCESS + '55'); p.strokeWeight(1); p.rect(px, py, pw, ph, 6);

    // HEADER
    p.fill(0, 255, 178, 14); p.noStroke(); p.rect(px, py, pw, 44, 6, 6, 0, 0);
    p.fill(SUCCESS); p.textSize(11); p.textAlign(p.LEFT);
    p.text('✓  ' + importedCols.length + ' colunas importadas  ·  ' + rows.length + ' linhas', px + 16, py + 18);
    p.fill(MUTED); p.textSize(9); p.text(importedCols.join('  ·  '), px + 16, py + 35);

    // TABS
    const tabY = py + 50;
    ['VISUALIZAÇÕES', 'TABELA'].forEach((label, i) => {
      const tabId = i === 0 ? 'charts' : 'table';
      const tx = px + 16 + i * 140;
      const active = vizTab === tabId;
      p.noStroke(); p.fill(active ? ACCENT : MUTED); p.textSize(10); p.textAlign(p.LEFT);
      p.text(label, tx, tabY + 14);
      if (active) { p.fill(ACCENT); p.noStroke(); p.rect(tx, tabY + 17, p.textWidth(label), 2, 1); }
    });
    p.stroke(BORDER); p.strokeWeight(0.5); p.line(px, tabY + 22, px + pw, tabY + 22);

    const contentY = tabY + 28;
    if (vizTab === 'charts') drawChartsTab(px, contentY, pw, ph, py);
    else                     drawTableTab(px, contentY, pw, ph, py);

    // FOOTER
    const footY = py + ph - 36;
    const backBtn = { x: px + 16, y: footY, w: 170, h: 28 };
    backBtn.hover = inBox(p.mouseX, p.mouseY, backBtn);
    drawBtn(backBtn.x, backBtn.y, backBtn.w, backBtn.h, '← NOVA IMPORTAÇÃO', backBtn.hover, MUTED);

    if (vizTab === 'charts' && vizCharts.length > 1) {
      const navLx = px + pw - 80, navRx = px + pw - 44;
      drawBtn(navLx, footY, 30, 28, '‹', inBox(p.mouseX, p.mouseY, {x:navLx,y:footY,w:30,h:28}), ACCENT);
      drawBtn(navRx, footY, 30, 28, '›', inBox(p.mouseX, p.mouseY, {x:navRx,y:footY,w:30,h:28}), ACCENT);
      vizCharts.forEach((_, i) => {
        p.noStroke(); p.fill(i === activeChart ? ACCENT : MUTED);
        p.ellipse(px + pw - 100 + i * 12 - vizCharts.length * 6, footY + 14, i === activeChart ? 6 : 4);
      });
    }
  }

  // CHARTS TAB
  function drawChartsTab(px, cy, pw, ph, py) {
    if (vizCharts.length === 0) return;

    // stat cards
    const maxCards = Math.min(importedCols.length, 5);
    const cardW = (pw - 32 - (maxCards - 1) * 10) / maxCards;
    const cardH = 54;
    importedCols.slice(0, maxCards).forEach((col, i) => {
      const cx2 = px + 16 + i * (cardW + 10);
      const tc = TYPE_COLOR[colTypes[col]] || MUTED;
      const cr = p.color(tc);
      p.fill(p.red(cr), p.green(cr), p.blue(cr), 18);
      p.stroke(tc + '44'); p.strokeWeight(0.5); p.rect(cx2, cy, cardW, cardH, 4);
      p.noStroke(); p.fill(tc); p.textSize(8); p.textAlign(p.LEFT);
      p.text(TYPE_LABEL[colTypes[col]], cx2 + 8, cy + 12);
      p.fill(TEXTHI); p.textSize(11);
      p.text((col.length > 13 ? col.slice(0, 12) + '…' : col), cx2 + 8, cy + 26);
      const idx = headers.indexOf(col);
      const vals = rows.map(r => r[idx] ?? '');
      let stat = '';
      if (colTypes[col] === 'num') {
        const nums = vals.map(parseFloat).filter(v => !isNaN(v));
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        stat = 'avg ' + (avg < 100 ? avg.toFixed(1) : Math.round(avg));
      } else {
        const freq = {};
        vals.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
        stat = top ? top[0].slice(0, 12) : '';
      }
      p.fill(MUTED); p.textSize(9); p.text(stat, cx2 + 8, cy + 42);
    });

    // main chart
    const chartY = cy + cardH + 14;
    const chartH = ph - cardH - 108;
    const chart = vizCharts[activeChart];
    if (!chart) return;
    chart.animProg = Math.min(chart.animProg + 0.045, 1);
    const anim = 1 - Math.pow(1 - chart.animProg, 3);

    p.fill('#0c0e14'); p.stroke(BORDER); p.strokeWeight(1);
    p.rect(px + 16, chartY, pw - 32, chartH, 4);

    const tc = TYPE_COLOR[colTypes[chart.col]] || MUTED;
    p.noStroke(); p.fill(tc); p.textSize(10); p.textAlign(p.LEFT);
    p.text('◈  ' + chart.col.toUpperCase() + '  —  ' + TYPE_LABEL[colTypes[chart.col]], px + 28, chartY + 16);
    p.fill(MUTED); p.textSize(9); p.textAlign(p.RIGHT);
    p.text((activeChart + 1) + ' / ' + vizCharts.length, px + pw - 20, chartY + 16);

    if (chart.type === 'histogram') drawHistogram(chart, px + 16, chartY + 22, pw - 32, chartH - 28, anim, tc);
    else if (chart.type === 'bar')  drawBarChart(chart, px + 16, chartY + 22, pw - 32, chartH - 28, anim, tc);
    else if (chart.type === 'daterange') drawDateInfo(chart, px + 16, chartY + 22, pw - 32, chartH - 28, tc);
  }

  // HISTOGRAM
  function drawHistogram(chart, x, y, w, h, anim, tc) {
    const { hist, min, max, avg, bw, nums } = chart;
    const maxCount = Math.max(...hist);
    const barW = (w - 70) / hist.length;
    const barAreaH = h - 44;
    const originX = x + 54, originY = y + barAreaH;

    p.stroke(BORDER); p.strokeWeight(0.5);
    p.line(originX, y + 10, originX, originY);
    p.line(originX, originY, x + w - 10, originY);

    for (let i = 1; i <= 4; i++) {
      const gy = originY - (barAreaH - 20) * (i / 4);
      const gv = Math.round(maxCount * i / 4);
      p.stroke(BORDER); p.strokeWeight(0.3); p.line(originX, gy, x + w - 10, gy);
      p.noStroke(); p.fill(MUTED); p.textSize(8); p.textAlign(p.RIGHT); p.text(gv, originX - 4, gy + 3);
    }

    hist.forEach((count, i) => {
      const bh = (count / maxCount) * (barAreaH - 20) * anim;
      const bx = originX + i * barW + 4;
      const by2 = originY - bh;
      const cr = p.color(tc);
      p.noStroke(); p.fill(p.red(cr), p.green(cr), p.blue(cr), 18); p.rect(bx - 2, by2 - 2, barW - 5, bh + 2, 2);
      p.fill(p.red(cr), p.green(cr), p.blue(cr), 190); p.rect(bx, by2, barW - 7, bh, 2, 2, 0, 0);
      p.fill(p.red(cr), p.green(cr), p.blue(cr), 70); p.rect(bx, by2, barW - 7, 3, 2);
      p.fill(MUTED); p.textSize(7); p.textAlign(p.CENTER);
      const lv = min + i * bw;
      p.text(lv < 100 ? lv.toFixed(0) : Math.round(lv), bx + (barW - 7) / 2, originY + 12);
    });

    if (anim > 0.5) {
      const avgX = originX + ((avg - min) / ((max - min) || 1)) * (w - 72);
      const la = (anim - 0.5) * 2 * 200;
      p.drawingContext.setLineDash([4, 4]);
      p.stroke(255, 179, 0, la); p.strokeWeight(1.5);
      p.line(avgX, y + 10, avgX, originY);
      p.drawingContext.setLineDash([]);
      p.noStroke(); p.fill(255, 179, 0, la); p.textSize(8); p.textAlign(p.CENTER);
      p.text('avg ' + (avg < 100 ? avg.toFixed(1) : Math.round(avg)), avgX, y + 8);
    }

    const sx = x + w - 90;
    [['min', min < 100 ? min.toFixed(1) : Math.round(min)],
     ['max', max < 100 ? max.toFixed(1) : Math.round(max)],
     ['n',   nums.length]].forEach(([lbl, val], i) => {
      p.noStroke(); p.fill(MUTED); p.textSize(8); p.textAlign(p.LEFT);
      p.text(lbl, sx, y + 22 + i * 18);
      p.fill(TEXT); p.textSize(10); p.text(val, sx + 22, y + 22 + i * 18);
    });
  }

  // BAR CHART
  function drawBarChart(chart, x, y, w, h, anim, tc) {
    const { data, total } = chart;
    const maxCount = data[0][1];
    const barH = Math.min(30, (h - 20) / data.length - 6);
    const barAreaW = w - 170;
    const originX = x + 110, originY = y + 10;
    const cr = p.color(tc);

    data.forEach(([label, count], i) => {
      const bw2 = (count / maxCount) * barAreaW * anim;
      const by2 = originY + i * (barH + 8);
      const pct = Math.round(count / total * 100);
      p.noStroke(); p.fill(TEXT); p.textSize(10); p.textAlign(p.RIGHT);
      p.text((label.length > 13 ? label.slice(0, 12) + '…' : label), originX - 8, by2 + barH / 2 + 4);
      p.fill(BORDER); p.rect(originX, by2, barAreaW, barH, 3);
      p.fill(p.red(cr), p.green(cr), p.blue(cr), 45); p.rect(originX, by2, bw2, barH, 3);
      p.fill(p.red(cr), p.green(cr), p.blue(cr), 210); p.rect(originX, by2, bw2, barH / 3, 3, 3, 0, 0);
      if (anim > 0.3) {
        p.fill(TEXT); p.textSize(9); p.textAlign(p.LEFT);
        p.text(count + ' (' + pct + '%)', originX + bw2 + 6, by2 + barH / 2 + 3);
      }
    });
    p.noStroke(); p.fill(MUTED); p.textSize(8); p.textAlign(p.RIGHT);
    p.text('total: ' + total, x + w - 8, y + h - 4);
  }

  // DATE INFO
  function drawDateInfo(chart, x, y, w, h, tc) {
    const { first, last, count } = chart;
    const cx2 = x + w / 2, cy2 = y + h / 2;
    p.noStroke(); p.fill(tc); p.textSize(36); p.textAlign(p.CENTER); p.text(count, cx2, cy2 - 16);
    p.fill(MUTED); p.textSize(12); p.text('registros com data', cx2, cy2 + 6);
    p.fill(TEXT); p.textSize(11); p.text('de ' + first + '  →  ' + last, cx2, cy2 + 28);
  }

  // TABLE TAB
  function drawTableTab(px, cy, pw, ph, py) {
    const hIdx = importedCols.map(c => headers.indexOf(c));
    const colW = (pw - 32) / importedCols.length;
    const rowH = 26, tableX = px + 16;

    p.fill(BORDER); p.noStroke(); p.rect(tableX, cy, pw - 32, rowH, 3);
    importedCols.forEach((col, ci) => {
      const tc = TYPE_COLOR[colTypes[col]] || MUTED;
      const cx2 = tableX + ci * colW;
      p.fill(tc); p.noStroke(); p.textSize(9); p.textAlign(p.LEFT);
      p.text(col.substring(0, Math.floor(colW / 7)), cx2 + 8, cy + 11);
      p.fill(MUTED); p.textSize(7); p.text(TYPE_LABEL[colTypes[col]], cx2 + 8, cy + 22);
      if (ci > 0) { p.stroke(BORDER); p.strokeWeight(0.5); p.line(cx2, cy, cx2, cy + rowH); }
    });

    const maxVis = Math.floor((ph - 100) / rowH);
    rows.slice(tableScroll, tableScroll + maxVis).forEach((row, ri) => {
      const ry = cy + rowH + ri * rowH;
      p.fill(ri % 2 === 0 ? '#1a1d27' : PANEL); p.noStroke(); p.rect(tableX, ry, pw - 32, rowH);
      importedCols.forEach((col, ci) => {
        const cx2 = tableX + ci * colW;
        const val = row[hIdx[ci]] ?? '';
        const disp = val.length > Math.floor(colW / 7.5) ? val.slice(0, Math.floor(colW / 7.5)) + '…' : val;
        p.fill(TEXT); p.noStroke(); p.textSize(9); p.textAlign(p.LEFT); p.text(disp, cx2 + 8, ry + 16);
        if (ci > 0) { p.stroke(BORDER); p.strokeWeight(0.5); p.line(cx2, ry, cx2, ry + rowH); }
      });
      p.stroke(BORDER); p.strokeWeight(0.3); p.line(tableX, ry + rowH, tableX + pw - 32, ry + rowH);
    });

    if (rows.length > maxVis) {
      const pct2 = tableScroll / (rows.length - maxVis);
      const trackH = maxVis * rowH;
      const thumbH = Math.max(20, trackH * maxVis / rows.length);
      const thumbY = cy + rowH + pct2 * (trackH - thumbH);
      p.stroke(BORDER); p.strokeWeight(1); p.noFill(); p.line(px + pw - 6, cy + rowH, px + pw - 6, cy + rowH + trackH);
      p.stroke(ACCENT); p.line(px + pw - 6, thumbY, px + pw - 6, thumbY + thumbH);
    }
    p.noStroke(); p.fill(MUTED); p.textSize(8); p.textAlign(p.CENTER);
    p.text('scroll ↕', px + pw / 2, py + ph - 42);
  }

  // MOUSE
  p.mousePressed = () => {
    if (state === 'idle') {
      if (uploadBtn && inBox(p.mouseX, p.mouseY, uploadBtn)) document.getElementById('file-input').click();
      if (demoBtn && inBox(p.mouseX, p.mouseY, demoBtn)) { fileName = 'demo_funcionarios.csv'; parseCSV(DEMO_CSV); }

    } else if (state === 'selecting') {
      for (let cb of checkboxes) { if (inBox(p.mouseX, p.mouseY, cb)) { cb.checked = !cb.checked; return; } }
      if (importBtn && inBox(p.mouseX, p.mouseY, importBtn)) {
        const sel = checkboxes.filter(c => c.checked).map(c => c.name);
        if (sel.length > 0) { importedCols = sel; buildVizCharts(); state = 'viz'; flashAlpha = 220; }
      }
      const COLS = 3, panelW = COLS * 190 + (COLS - 1) * 12 + 40;
      const panelH = Math.ceil(headers.length / COLS) * (56 + 12) + 130;
      const px2 = (p.width - panelW) / 2, py2 = (p.height - panelH) / 2;
      if (p.mouseX > px2 + 16 && p.mouseX < px2 + 65 && p.mouseY > py2 + panelH - 20 && p.mouseY < py2 + panelH)
        checkboxes.forEach(c => c.checked = true);
      if (p.mouseX > px2 + 76 && p.mouseX < px2 + 130 && p.mouseY > py2 + panelH - 20 && p.mouseY < py2 + panelH)
        checkboxes.forEach(c => c.checked = false);

    } else if (state === 'viz') {
      const pw = Math.min(p.width - 40, 920);
      const ph = p.height - 60;
      const px = p.width / 2 - pw / 2, py = 30;
      const footY = py + ph - 36;

      // back
      if (p.mouseX > px + 16 && p.mouseX < px + 186 && p.mouseY > footY && p.mouseY < footY + 28) {
        state = 'idle'; headers = []; rows = []; checkboxes = []; vizCharts = []; fileName = '';
      }
      // tabs
      const tabY = py + 50;
      if (p.mouseY > tabY && p.mouseY < tabY + 22) {
        if (p.mouseX > px + 16 && p.mouseX < px + 156) { vizTab = 'charts'; }
        if (p.mouseX > px + 156 && p.mouseX < px + 290) { vizTab = 'table'; }
      }
      // nav arrows
      if (vizTab === 'charts' && vizCharts.length > 1) {
        const navLx = px + pw - 80, navRx = px + pw - 44;
        if (p.mouseX > navLx && p.mouseX < navLx + 30 && p.mouseY > footY && p.mouseY < footY + 28) {
          activeChart = (activeChart - 1 + vizCharts.length) % vizCharts.length;
          vizCharts[activeChart].animProg = 0;
        }
        if (p.mouseX > navRx && p.mouseX < navRx + 30 && p.mouseY > footY && p.mouseY < footY + 28) {
          activeChart = (activeChart + 1) % vizCharts.length;
          vizCharts[activeChart].animProg = 0;
        }
      }
    }
  };

  p.mouseWheel = (e) => {
    if (state === 'viz' && vizTab === 'table') {
      const ph = p.height - 60;
      const maxVis = Math.floor((ph - 100) / 26);
      tableScroll = p.constrain(tableScroll + (e.delta > 0 ? 1 : -1), 0, Math.max(0, rows.length - maxVis));
      return false;
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    spawnParticles();
    if (state === 'selecting') buildCheckboxes();
  };
};

new p5(sketch);
