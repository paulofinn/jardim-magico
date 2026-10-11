/* traco.js — o coração do jogo: mostra o caminho, lê a caneta e avalia o traçado.

   Como funciona:
   - cada traço vira uma sequência de pontos a cada 3px (amostras);
   - o personagem fica no ponto já alcançado; a criança "pega" o personagem e o leva pelo caminho;
   - só avança quem está dentro da faixa (raio R) e perto do ponto atual (não dá pra pular pedaços);
   - tinta fora da faixa aparece vermelha e some sozinha; as estrelas saem de quanto ficou dentro e centralizado;
   - com caneta detectada, toques de dedo/palma são ignorados (a mão pode apoiar na tela). */

const Traco = (() => {
  const PASSO = 3;
  const CORES = ['#ff6b8b', '#ffb020', '#3fa9f5', '#5cc46a', '#a77bf3', '#ff8a3d'];
  const EMOJI = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';

  let cv, ctx, fundo, fctx, tinta, tctx, medidor;
  let W = 0, H = 0, dpr = 1;
  let ex = null, op = {};
  let tracos = [], atual = 0, idx = 0;
  let R = 40, pegaR = 60, adiante = 90, larguraTinta = 6;
  let ativo = null, ultimo = null, fora = false;
  let foraTinta = [], particulas = [];
  let stats = null, estado = 'parado';
  let demo = null, pulo = null, tremer = 0, pairar = null, fimPos = null;
  let ultimaAcao = 0, ultimaDemo = 0, ultimoOps = 0, ultimaDica = 0, marco = 1;
  let raf = 0, montado = false, canetaVista = false;

  /* ---------- preparação ---------- */
  function montar(canvas) {
    if (montado) return;
    montado = true;
    cv = canvas; ctx = cv.getContext('2d');
    fundo = document.createElement('canvas'); fctx = fundo.getContext('2d');
    tinta = document.createElement('canvas'); tctx = tinta.getContext('2d');
    medidor = document.getElementById('medidor');
    cv.addEventListener('pointerdown', aoDescer);
    cv.addEventListener('pointermove', aoMover);
    cv.addEventListener('pointerup', aoSubir);
    cv.addEventListener('pointercancel', aoSubir);
    cv.addEventListener('pointerleave', e => { if (e.pointerType === 'pen' || e.pointerType === 'mouse') pairar = null; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    new ResizeObserver(() => { if (estado !== 'parado') redimensionar(true); }).observe(cv);
  }

  function iniciar(fase, opcoes = {}) {
    ex = fase; op = opcoes;
    canetaVista = !!op.canetaVista;
    atual = 0; idx = 0; ativo = null; ultimo = null; fora = false; marco = 1;
    foraTinta = []; particulas = []; demo = null; pulo = null; pairar = null; fimPos = null;
    stats = { dentro: 0, fora: 0, somaDist: 0, inicio: performance.now(), levantadas: 0 };
    estado = 'jogando';
    redimensionar(false);
    tctx.clearRect(0, 0, W, H);
    ultimaAcao = performance.now();
    agendarDemo(700);
    if (!raf) raf = requestAnimationFrame(quadro);
  }
  function parar() { estado = 'parado'; cancelAnimationFrame(raf); raf = 0; ativo = null; }
  function reiniciar() { if (ex) iniciar(ex, op); }

  function redimensionar(manter) {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const tr0 = tracos[atual];
    const frac = manter && tr0 ? tr0.cum[idx] / tr0.total : 0;
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    for (const c of [cv, fundo, tinta]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    for (const c of [ctx, fctx, tctx]) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
    if (manter && tracos[atual]) idx = indice(tracos[atual], frac * tracos[atual].total);
    desenharFundo();
  }

  function layout() {
    const base = Math.min(W, H);
    R = base * (op.raio || .078);
    const [vw, vh] = ex.vb;
    const topo = 70, m = Math.max(R * 1.25, 36);
    const aw = W - 2 * m, ah = H - topo - 2 * m;
    const s = Math.min(aw / vw, ah / vh);
    R = Math.min(R, s * 18); // desenho muito pequeno (nome comprido): a faixa acompanha o tamanho das letras
    pegaR = Math.max(R * 1.9, 58);
    adiante = Math.max(R * 2, 56);
    larguraTinta = Math.max(5, R * .15);
    const ox = (W - vw * s) / 2, oy = topo + m + (ah - vh * s) / 2;
    tracos = ex.tracos.map((t, i) => amostrar(t, s, ox, oy, (ex.cores && ex.cores[i]) || CORES[i % CORES.length]));
  }

  function amostrar(t, s, ox, oy, cor) {
    const dx = t.dx || 0, dy = t.dy || 0;
    let raw;
    if (t.pts) raw = t.pts.map(([x, y]) => [x + dx, y + dy]);
    else {
      medidor.setAttribute('d', t.d);
      const L = medidor.getTotalLength(), n = Math.max(8, Math.ceil(L * s / 2));
      raw = [];
      for (let i = 0; i <= n; i++) { const p = medidor.getPointAtLength(L * i / n); raw.push([p.x + dx, p.y + dy]); }
    }
    return reamostrar(raw.map(([x, y]) => [ox + x * s, oy + y * s]), cor);
  }

  function reamostrar(pts, cor) {
    const c = [0];
    for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = c[c.length - 1];
    const xs = [], ys = [], cum = [];
    let j = 1;
    for (let d = 0; d < total; d += PASSO) {
      while (j < c.length - 1 && c[j] < d) j++;
      const a = c[j - 1], b = c[j], t = b > a ? (d - a) / (b - a) : 0;
      xs.push(pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t);
      ys.push(pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t);
      cum.push(d);
    }
    const ul = pts[pts.length - 1];
    xs.push(ul[0]); ys.push(ul[1]); cum.push(total);
    return { xs, ys, cum, total, n: xs.length, cor, fechado: Math.hypot(xs[0] - ul[0], ys[0] - ul[1]) < R * 1.5 };
  }

  function indice(tr, d) {
    let a = 0, b = tr.n - 1;
    while (a < b) { const m = (a + b) >> 1; if (tr.cum[m] < d) a = m + 1; else b = m; }
    return a;
  }

  /* ---------- desenho ---------- */
  function linha(c, tr, a, b, cor, w, alfa = 1) {
    if (b <= a) return;
    c.save(); c.globalAlpha = alfa; c.strokeStyle = cor; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(tr.xs[a], tr.ys[a]);
    for (let i = a + 1; i <= b; i++) c.lineTo(tr.xs[i], tr.ys[i]);
    c.stroke(); c.restore();
  }
  function pontilhado(c, tr, cor, w, gap, alfa) {
    c.save(); c.globalAlpha = alfa; c.fillStyle = cor;
    for (let d = 0; d <= tr.total; d += gap) { const i = indice(tr, d); c.beginPath(); c.arc(tr.xs[i], tr.ys[i], w / 2, 0, 7); c.fill(); }
    c.restore();
  }
  function setas(c, tr) {
    const passo = Math.max(120, R * 3.2), s = R * .3;
    c.save(); c.strokeStyle = '#7f90a8'; c.lineWidth = Math.max(3, R * .09); c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = .6;
    for (let d = passo * .75; d < tr.total - passo * .45; d += passo) {
      const i = indice(tr, d), a = Math.max(0, i - 4), b = Math.min(tr.n - 1, i + 4);
      c.save(); c.translate(tr.xs[i], tr.ys[i]); c.rotate(Math.atan2(tr.ys[b] - tr.ys[a], tr.xs[b] - tr.xs[a]));
      c.beginPath(); c.moveTo(-s * .45, -s); c.lineTo(s * .55, 0); c.lineTo(-s * .45, s); c.stroke(); c.restore();
    }
    c.restore();
  }
  function numero(c, tr, n, destaque) {
    const a = 0, b = Math.min(tr.n - 1, 6);
    const ang = Math.atan2(tr.ys[b] - tr.ys[a], tr.xs[b] - tr.xs[a]);
    // fica de lado em relação ao começo do traço, para não ficar embaixo do personagem
    const x = tr.xs[0] + Math.cos(ang - Math.PI * .75) * R * 1.35, y = tr.ys[0] + Math.sin(ang - Math.PI * .75) * R * 1.35;
    const r = Math.max(13, R * .36);
    c.save();
    c.globalAlpha = destaque ? 1 : .55;
    c.fillStyle = destaque ? tr.cor : '#b5c0cf';
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = `700 ${Math.round(r * 1.25)}px Fredoka, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(n), x, y + 1);
    c.restore();
  }

  function desenharFundo() {
    fctx.clearRect(0, 0, W, H);
    const lb = R * 1.6;
    tracos.forEach((tr, i) => {
      if (i < atual) linha(fctx, tr, 0, tr.n - 1, tr.cor, lb * .9, .92);
      else if (i === atual) {
        linha(fctx, tr, 0, tr.n - 1, 'rgba(90,110,150,.16)', lb + 8);
        linha(fctx, tr, 0, tr.n - 1, '#ffffff', lb, .96);
        pontilhado(fctx, tr, '#93a3ba', Math.max(6, R * .15), Math.max(15, R * .42), 1);
        setas(fctx, tr);
      } else {
        linha(fctx, tr, 0, tr.n - 1, '#ffffff', lb * .7, .45);
        pontilhado(fctx, tr, '#b5c0cf', Math.max(4, R * .1), Math.max(12, R * .36), .7);
      }
    });
    if (tracos.length > 1) tracos.forEach((tr, i) => { if (i >= atual) numero(fctx, tr, i + 1, i === atual); });
  }

  function emoji(txt, x, y, tam, alfa = 1) {
    ctx.save(); ctx.globalAlpha = alfa;
    ctx.font = `${Math.round(tam)}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y + tam * .05);
    ctx.restore();
  }

  function desenharAlvo(agora) {
    const tr = tracos[atual]; if (!tr) return;
    if (tr.fechado && tr.cum[idx] < tr.total * .55) return; // em formas fechadas o alvo só aparece no fim
    const tam = Math.max(40, R * 1.25) * (1 + .07 * Math.sin(agora / 280));
    emoji(ex.alvo, tr.xs[tr.n - 1], tr.ys[tr.n - 1], tam, .95);
  }

  function desenharDemo(agora) {
    if (!demo) return;
    const tr = tracos[atual]; if (!tr) { demo = null; return; }
    const k = (agora - demo.t0) / demo.dur;
    if (k < 0) return;
    if (k > 1.2) { demo = null; ultimaDemo = agora; return; }
    const kk = Math.min(1, k), e = kk < .5 ? 2 * kk * kk : 1 - Math.pow(-2 * kk + 2, 2) / 2;
    const d = demo.de + e * (tr.total - demo.de);
    const i = indice(tr, d), i0 = indice(tr, Math.max(demo.de, d - R * 3.5));
    const alfa = k > 1 ? 1 - (k - 1) / .2 : 1;
    linha(ctx, tr, i0, i, '#ffe066', R * .5, .55 * alfa);
    ctx.save(); ctx.globalAlpha = alfa;
    ctx.shadowColor = '#ffc21f'; ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff8cf'; ctx.beginPath(); ctx.arc(tr.xs[i], tr.ys[i], R * .34, 0, 7); ctx.fill();
    ctx.restore();
    emoji('✨', tr.xs[i] + R * .3, tr.ys[i] - R * .35, R * .6, alfa);
  }

  function desenharAtor(agora) {
    const tr = tracos[atual];
    let x, y;
    if (pulo) {
      const k = Math.min(1, (agora - pulo.t0) / pulo.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      x = pulo.de.x + (pulo.para.x - pulo.de.x) * e;
      y = pulo.de.y + (pulo.para.y - pulo.de.y) * e - Math.sin(k * Math.PI) * R * 2.4;
      if (k >= 1) { pulo = null; agendarDemo(200); }
    } else { x = tr.xs[idx]; y = tr.ys[idx]; }
    const esperando = ativo === null && !pulo;
    const bob = esperando ? Math.sin(agora / 240) * R * .1 : 0;
    const sx = tremer > agora ? Math.sin(agora / 22) * 6 : 0;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, R * .84 * (esperando ? 1 + .08 * Math.sin(agora / 190) : 1.06), 0, 7);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
    ctx.lineWidth = Math.max(3.5, R * .11); ctx.strokeStyle = fora ? '#ff9f43' : (tr ? tr.cor : '#5cc46a'); ctx.stroke();
    ctx.restore();
    emoji(ex.ator, x + sx, y + bob, Math.max(44, R * 1.42));
  }

  function desenharFim(agora) {
    if (!fimPos) return;
    const k = (agora - fimPos.t0) / 1000;
    const pulinho = Math.abs(Math.sin(k * 7)) * R * .5 * Math.max(0, 1 - k / 2.5);
    emoji(ex.alvo, fimPos.x + R * .7, fimPos.y + R * .25, Math.max(40, R * 1.25));
    emoji(ex.ator, fimPos.x, fimPos.y - pulinho, Math.max(44, R * 1.42) * (1 + .1 * Math.max(0, 1 - k)));
  }

  function estrela4(c, x, y, r) {
    c.beginPath(); c.moveTo(x, y - r);
    c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  }
  function faiscas(x, y, n, cor, forca = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = (1.5 + Math.random() * 3.5) * forca;
      particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, vida: 0, max: 38 + Math.random() * 26, cor: cor || sortear(CORES), r: 3 + Math.random() * 4, estrela: Math.random() < .55 });
    }
  }
  function desenharParticulas() {
    if (!particulas.length) return;
    particulas = particulas.filter(p => p.vida < p.max);
    ctx.save();
    for (const p of particulas) {
      p.vida++; p.x += p.vx; p.y += p.vy; p.vy += .12; p.vx *= .98;
      ctx.globalAlpha = 1 - p.vida / p.max; ctx.fillStyle = p.cor;
      if (p.estrela) estrela4(ctx, p.x, p.y, p.r * 1.7);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  }

  function quadro() {
    raf = requestAnimationFrame(quadro);
    if (estado === 'parado' || !W) return;
    const agora = performance.now();
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(fundo, 0, 0, W, H);
    const tr = tracos[atual];
    if (estado === 'jogando' && tr) linha(ctx, tr, 0, idx, tr.cor, R * 1.6 * .9, .9);
    ctx.drawImage(tinta, 0, 0, W, H);
    if (foraTinta.length) {
      foraTinta = foraTinta.filter(s => agora - s.t < 1400);
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = larguraTinta; ctx.strokeStyle = '#ff6b6b';
      for (const s of foraTinta) { ctx.globalAlpha = .85 * (1 - (agora - s.t) / 1400); ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke(); }
      ctx.restore();
    }
    if (estado === 'jogando' && tr) {
      desenharAlvo(agora);
      desenharDemo(agora);
      desenharAtor(agora);
      if (ativo === null && !pulo && !demo && agora - ultimaAcao > 5500 && agora - ultimaDemo > 6000) agendarDemo(0);
    } else if (estado === 'fim') desenharFim(agora);
    desenharParticulas();
    if (pairar && ativo === null && estado === 'jogando') {
      ctx.save(); ctx.strokeStyle = 'rgba(47,62,92,.45)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(pairar.x, pairar.y, 9, 0, 7); ctx.stroke(); ctx.restore();
    }
  }

  function agendarDemo(atraso) {
    const tr = tracos[atual]; if (!tr) return;
    const de = tr.cum[idx];
    demo = { t0: performance.now() + atraso, de, dur: Math.min(3200, Math.max(1000, (tr.total - de) * 2.3)) };
    ultimaDemo = performance.now() + atraso;
  }

  /* ---------- caneta ---------- */
  function local(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  function ignorar(e) {
    if (e.pointerType === 'pen') {
      if (!canetaVista) { canetaVista = true; op.aoVerCaneta?.(); }
      return false;
    }
    if (e.pointerType !== 'touch') return false;
    const modo = op.dedo || 'auto';
    if (modo === 'sim') return false;
    if (modo === 'nao') return true;
    if (canetaVista) return true;                          // caneta já usada: dedo e palma não desenham
    return (e.width || 0) > 50 || (e.height || 0) > 50;     // toque muito largo = palma da mão
  }

  function aoDescer(e) {
    if (ignorar(e)) return;
    e.preventDefault();
    if (estado !== 'jogando' || pulo || ativo !== null) return;
    const tr = tracos[atual], p = local(e);
    ultimaAcao = performance.now();
    if (Math.hypot(p.x - tr.xs[idx], p.y - tr.ys[idx]) <= pegaR) {
      ativo = e.pointerId;
      try { cv.setPointerCapture(e.pointerId); } catch {}
      demo = null; ultimo = p; fora = false; pairar = null;
      op.aoEvento?.('pegou');
      processar(p.x, p.y);
    } else dica();
  }

  function aoMover(e) {
    if (e.pointerId !== ativo) {
      if (ativo === null && (e.pointerType === 'pen' || e.pointerType === 'mouse') && e.buttons === 0) pairar = local(e);
      return;
    }
    ultimaAcao = performance.now();
    const lista = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    for (const ce of (lista && lista.length ? lista : [e])) { mover(local(ce)); if (ativo === null) break; }
  }

  function aoSubir(e) {
    if (e.pointerId !== ativo) return;
    ativo = null; ultimo = null; fora = false;
    if (stats) stats.levantadas++;
    ultimaAcao = performance.now();
  }

  function mover(p) {
    if (!ultimo) { ultimo = p; processar(p.x, p.y); return; }
    const d = Math.hypot(p.x - ultimo.x, p.y - ultimo.y);
    const n = Math.max(1, Math.ceil(d / Math.min(10, R * .3)));
    const ox = ultimo.x, oy = ultimo.y;
    for (let k = 1; k <= n && ativo !== null; k++) processar(ox + (p.x - ox) * k / n, oy + (p.y - oy) * k / n);
  }

  function processar(x, y) {
    const tr = tracos[atual];
    const s0 = tr.cum[idx];
    let j0 = idx, j1 = idx;
    while (j0 > 0 && s0 - tr.cum[j0 - 1] <= R) j0--;
    while (j1 < tr.n - 1 && tr.cum[j1 + 1] - s0 <= adiante) j1++;
    let melhor = Infinity, bj = idx;
    for (let j = j0; j <= j1; j++) {
      const dx = tr.xs[j] - x, dy = tr.ys[j] - y, dd = dx * dx + dy * dy;
      if (dd < melhor) { melhor = dd; bj = j; }
    }
    const dist = Math.sqrt(melhor);
    const a = ultimo || { x, y }, b = { x, y };
    const comp = Math.hypot(b.x - a.x, b.y - a.y);
    if (dist <= R) {
      stats.dentro += comp; stats.somaDist += dist * comp;
      tctx.strokeStyle = '#2f3e5c'; tctx.lineWidth = larguraTinta; tctx.lineCap = 'round';
      tctx.beginPath(); tctx.moveTo(a.x, a.y); tctx.lineTo(b.x + .01, b.y); tctx.stroke();
      fora = false;
      if (bj > idx) avancar(bj);
    } else {
      stats.fora += comp;
      if (comp > 0) foraTinta.push({ a, b, t: performance.now() });
      if (!fora) {
        fora = true;
        const agora = performance.now();
        tremer = agora + 350;
        if (agora - ultimoOps > 1200) { ultimoOps = agora; Som.ops(); }
      }
    }
    ultimo = b;
    if (tr.total - tr.cum[idx] <= Math.max(6, R * .3)) concluirTraco();
  }

  function avancar(j) {
    const tr = tracos[atual];
    idx = j;
    const frac = tr.cum[idx] / tr.total;
    while (marco < 10 && frac >= marco / 10) {
      Som.nota(marco - 1 + Math.min(atual, 3));
      faiscas(tr.xs[idx], tr.ys[idx], 3, tr.cor, .6);
      marco++;
    }
  }

  function concluirTraco() {
    const tr = tracos[atual];
    idx = tr.n - 1;
    ativo = null; ultimo = null; fora = false;
    faiscas(tr.xs[idx], tr.ys[idx], 18, null, 1.3);
    if (atual < tracos.length - 1) {
      Som.acorde();
      const de = { x: tr.xs[idx], y: tr.ys[idx] };
      atual++; idx = 0; marco = 1;
      pulo = { de, para: { x: tracos[atual].xs[0], y: tracos[atual].ys[0] }, t0: performance.now(), dur: 520 };
      desenharFundo();
      op.aoEvento?.('traco', atual);
    } else {
      estado = 'fim';
      fimPos = { x: tr.xs[idx], y: tr.ys[idx], t0: performance.now() };
      atual = tracos.length;
      desenharFundo();
      Som.fanfarra();
      for (let i = 0; i < 5; i++) setTimeout(() => faiscas(W * (.2 + Math.random() * .6), H * (.25 + Math.random() * .5), 16, null, 1.4), i * 140);
      const res = resultado();
      op.aoEvento?.('fim', res);
      setTimeout(() => { if (estado === 'fim') op.aoFim?.(res); }, 1000);
    }
  }

  function resultado() {
    const tot = stats.dentro + stats.fora || 1;
    const foraFrac = stats.fora / tot;
    const prec = stats.dentro ? stats.somaDist / stats.dentro / R : 1; // 0 = no centro, 1 = na borda
    const nota = 1 - foraFrac * 2 - Math.max(0, prec - .4) * 1.1;
    const estrelas = nota >= .78 ? 3 : nota >= .5 ? 2 : 1;
    return { estrelas, nota: +nota.toFixed(3), foraFrac: +foraFrac.toFixed(3), prec: +prec.toFixed(3), tempo: Math.round((performance.now() - stats.inicio) / 100) / 10 };
  }

  function dica() {
    const agora = performance.now();
    tremer = agora + 400;
    if (!demo) agendarDemo(0);
    if (agora - ultimaDica > 4000) { ultimaDica = agora; op.aoEvento?.('dica'); }
  }

  /* para testes no computador: simula a criança traçando com um pouco de tremido */
  async function simular(tremido = 0) {
    while (estado === 'jogando') {
      if (pulo) { await esperar(60); continue; }
      const tr = tracos[atual];
      const id = 9999, desce = (x, y, tipo) => cv.dispatchEvent(new PointerEvent(tipo, { pointerId: id, pointerType: 'pen', clientX: x + cv.getBoundingClientRect().left, clientY: y + cv.getBoundingClientRect().top, buttons: tipo === 'pointerup' ? 0 : 1, bubbles: true }));
      desce(tr.xs[idx], tr.ys[idx], 'pointerdown');
      const at = atual;
      for (let i = idx; i < tr.n && estado === 'jogando' && atual === at; i += 4) {
        const ang = Math.random() * 6.28, r = Math.random() * tremido * R;
        desce(tr.xs[i] + Math.cos(ang) * r, tr.ys[i] + Math.sin(ang) * r, 'pointermove');
        if (i % 24 === 0) await esperar(16);
      }
      const u = tracos[Math.min(at, tracos.length - 1)];
      desce(u.xs[u.n - 1], u.ys[u.n - 1], 'pointermove');
      desce(u.xs[u.n - 1], u.ys[u.n - 1], 'pointerup');
      await esperar(80);
    }
  }

  return { montar, iniciar, parar, reiniciar, simular, info: () => {
    const tr = tracos[atual];
    return { estado, atual, total: tracos.length, R, progresso: tr ? +(tr.cum[idx] / tr.total).toFixed(3) : 1, ator: tr ? { x: tr.xs[idx], y: tr.ys[idx] } : null };
  } };
})();
