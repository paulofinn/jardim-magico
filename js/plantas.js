/* plantas.js — as espécies do jardim e o desenho (SVG) de cada uma conforme cresce.
   g vai de 0 (semente) a 1 (planta adulta). Tudo desenhado num viewBox 200x300, chão em y=282. */

const Plantas = (() => {
  const SY = 282;
  const f = n => Math.round(n * 10) / 10;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (g, a, b) => clamp((g - a) / (b - a), 0, 1);
  const suave = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const mola = t => { if (t <= 0) return 0; if (t >= 1) return 1; const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const rad = a => a * Math.PI / 180;

  /* ---------- cores ---------- */
  function rgb(h) { const n = parseInt(h.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function hex(c) { return '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => lerp(v, B[i], t))); }
  const escuro = (c, t = .25) => mix(c, '#000000', t);
  const claro = (c, t = .35) => mix(c, '#ffffff', t);

  /* ---------- peças básicas ---------- */
  function bez(p, t) {
    const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
    return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
  }
  function caule(h, curva = 6, x0 = 100) {
    const p = [[x0, SY + 2], [x0 + curva, SY - h * .35], [x0 - curva * .6, SY - h * .7], [x0 + curva * .25, SY - h]];
    return { p, at: t => bez(p, t), topo: p[3], d: `M${f(p[0][0])} ${f(p[0][1])}C${f(p[1][0])} ${f(p[1][1])} ${f(p[2][0])} ${f(p[2][1])} ${f(p[3][0])} ${f(p[3][1])}` };
  }
  const traco = (d, cor, w) => `<path d="${d}" stroke="${cor}" stroke-width="${f(w)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

  function folha(x, y, comp, ang, cor = '#5cb85c', larg = .42) {
    if (comp < 1.5) return '';
    const l = comp, w = comp * larg;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><path d="M0 0C${f(l * .2)} ${f(-w)} ${f(l * .7)} ${f(-w * 1.05)} ${f(l)} 0C${f(l * .7)} ${f(w * 1.05)} ${f(l * .2)} ${f(w)} 0 0Z" fill="${cor}"/><path d="M${f(l * .08)} 0L${f(l * .82)} 0" stroke="${escuro(cor, .3)}" stroke-width="1.3" stroke-linecap="round" opacity=".5"/></g>`;
  }
  function folhaLonga(x, y, comp, ang, cor) {
    if (comp < 2) return '';
    const w = comp * .15;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang + 90)})"><path d="M${f(-w)} 0C${f(-w * 1.3)} ${f(-comp * .5)} ${f(-w * .2)} ${f(-comp * .85)} ${f(w * .6)} ${f(-comp)}C${f(w * .6)} ${f(-comp * .6)} ${f(w * 1.2)} ${f(-comp * .3)} ${f(w)} 0Z" fill="${cor}"/></g>`;
  }
  function folhaDentada(x, y, comp, ang) {
    if (comp < 2) return '';
    const l = comp, w = comp * .24, n = 5;
    let d = 'M0 0';
    for (let i = 1; i <= n; i++) { const q = i / n; d += `L${f(l * (q - .12))} ${f(-w * (1 - q * .55))}L${f(l * q)} ${f(-w * .3 * (1 - q))}`; }
    for (let i = n; i >= 1; i--) { const q = i / n; d += `L${f(l * (q - .12))} ${f(w * (1 - q * .55))}L${f(l * (q - .2))} ${f(w * .3 * (1 - q))}`; }
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><path d="${d}Z" fill="#5fae45" stroke="#4a8f36" stroke-width="1" stroke-linejoin="round"/></g>`;
  }
  function cotiledones(x, y, t, cor = '#7fd36b') {
    if (t <= 0) return '';
    const r = 9 * t;
    return `<ellipse cx="${f(x - r * .85)}" cy="${f(y - r * .3)}" rx="${f(r)}" ry="${f(r * .55)}" transform="rotate(-22 ${f(x - r * .85)} ${f(y - r * .3)})" fill="${cor}"/><ellipse cx="${f(x + r * .85)}" cy="${f(y - r * .3)}" rx="${f(r)}" ry="${f(r * .55)}" transform="rotate(22 ${f(x + r * .85)} ${f(y - r * .3)})" fill="${cor}"/>`;
  }
  function semente(cor = '#c8964f') {
    return `<ellipse cx="100" cy="${SY - 3}" rx="10" ry="7" fill="${cor}" stroke="${escuro(cor, .4)}" stroke-width="1.6"/><ellipse cx="96" cy="${SY - 6}" rx="3.2" ry="1.8" fill="#fff" opacity=".55"/>`;
  }
  function solo() {
    return `<ellipse cx="100" cy="${SY + 8}" rx="72" ry="16" fill="#6b4226"/><ellipse cx="100" cy="${SY + 4}" rx="65" ry="12" fill="#8b5a3c"/><circle cx="74" cy="${SY + 4}" r="2.3" fill="#a8744f"/><circle cx="122" cy="${SY + 7}" r="1.9" fill="#a8744f"/><circle cx="108" cy="${SY + 1}" r="1.6" fill="#6b4226"/><circle cx="88" cy="${SY + 9}" r="1.6" fill="#a8744f"/>`;
  }
  function rosto(r, cor = '#4a2c17') {
    const e = r * .13;
    return `<ellipse cx="${f(-r * .32)}" cy="${f(-r * .1)}" rx="${f(e)}" ry="${f(e * 1.35)}" fill="${cor}"/><ellipse cx="${f(r * .32)}" cy="${f(-r * .1)}" rx="${f(e)}" ry="${f(e * 1.35)}" fill="${cor}"/><circle cx="${f(-r * .29)}" cy="${f(-r * .16)}" r="${f(e * .42)}" fill="#fff"/><circle cx="${f(r * .35)}" cy="${f(-r * .16)}" r="${f(e * .42)}" fill="#fff"/><path d="M${f(-r * .28)} ${f(r * .2)}Q0 ${f(r * .5)} ${f(r * .28)} ${f(r * .2)}" stroke="${cor}" stroke-width="${f(r * .09)}" fill="none" stroke-linecap="round"/><circle cx="${f(-r * .56)}" cy="${f(r * .2)}" r="${f(r * .13)}" fill="#ff7a8a" opacity=".5"/><circle cx="${f(r * .56)}" cy="${f(r * .2)}" r="${f(r * .13)}" fill="#ff7a8a" opacity=".5"/>`;
  }
  function cintilas(cx, cy, r) {
    const est = (x, y, s, d) => `<path class="cintila" style="animation-delay:${d}s" d="M${f(x)} ${f(y - s)}Q${f(x)} ${f(y)} ${f(x + s)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y + s)}Q${f(x)} ${f(y)} ${f(x - s)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y - s)}Z" fill="#fff7b0" stroke="#ffd23f" stroke-width=".8"/>`;
    return est(cx - r, cy - r * .3, 8, 0) + est(cx + r * .95, cy - r * .55, 6, .7) + est(cx + r * .7, cy + r * .55, 7, 1.3) + est(cx - r * .75, cy + r * .65, 5, 1.9);
  }

  function botao(x, y, t, corPetala, corSepala = '#5aa850') {
    const s = .3 + .7 * t;
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${corPetala ? `<ellipse cx="0" cy="-13" rx="7" ry="${f(6 + 7 * t)}" fill="${corPetala}"/>` : ''}<path d="M0 2C-11 0-11-14-3-24C-4-13 4-13 3-24C11-14 11 0 0 2Z" fill="${corSepala}"/></g>`;
  }
  function florSimples(x, y, t, cor, n = 5, r = 12, miolo = '#ffd23f') {
    let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(Math.max(.05, t))})">`;
    for (let i = 0; i < n; i++) s += `<circle cx="0" cy="${f(-r * .6)}" r="${f(r * .5)}" fill="${cor}" stroke="${escuro(cor, .15)}" stroke-width="1" transform="rotate(${f(i * 360 / n)})"/>`;
    return s + `<circle r="${f(r * .32)}" fill="${miolo}"/></g>`;
  }
  function florRadial(x, y, t, o) {
    const R = o.raio;
    let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(Math.max(.05, t))})">`;
    const camadas = o.camadas || 1;
    for (let c = 0; c < camadas; c++) {
      for (let i = 0; i < o.n; i++) {
        const a = i * 360 / o.n + c * (180 / o.n);
        const cor = o.cores ? o.cores[(i + c * 3) % o.cores.length] : (c ? (o.cor2 || o.cor) : o.cor);
        s += `<ellipse cx="0" cy="${f(-R * .58)}" rx="${f(R * (o.largura || .2))}" ry="${f(R * .46)}" fill="${cor}" stroke="${o.borda || escuro(cor, .15)}" stroke-width="1.2" transform="rotate(${f(a)})"/>`;
      }
    }
    const rm = R * (o.mioloR || .36);
    s += `<circle r="${f(rm)}" fill="${o.miolo}" stroke="${o.mioloBorda || escuro(o.miolo, .2)}" stroke-width="2"/>`;
    if (o.pontos) for (let i = 0; i < 16; i++) { const a = i * 2.4, rr = rm * .78 * Math.sqrt((i + .5) / 16); s += `<circle cx="${f(Math.cos(a) * rr)}" cy="${f(Math.sin(a) * rr)}" r="${f(rm * .07)}" fill="${o.pontos}"/>`; }
    if (o.rosto) s += rosto(rm, o.corRosto);
    return s + '</g>';
  }

  /* Planta com caule, folhas e uma flor no topo (base de várias espécies) */
  function plantaFlor(g, o) {
    if (g < .05) return semente(o.corSemente);
    const tA = suave(seg(g, .05, .8));
    const h = lerp(16, o.alt, tA);
    const c = caule(h, o.curva ?? 6);
    let s = '';
    const n = o.folhas ?? 4;
    for (let k = 0; k < n; k++) {
      const t0 = .14 + k * (.46 / n);
      const tg = suave(seg(g, t0, t0 + .2));
      if (tg <= 0) continue;
      const pos = .14 + .62 * (k / Math.max(1, n - 1));
      const [x, y] = c.at(pos);
      const lado = k % 2 ? 1 : -1;
      const ang = lado < 0 ? 205 - k * 3 : -25 + k * 3;
      s += folha(x, y, o.tamFolha * tg * (1 - pos * .35), ang, k % 2 ? (o.corFolha || '#5cb85c') : escuro(o.corFolha || '#5cb85c', .08), o.largFolha);
    }
    s += traco(c.d, o.corCaule || '#4a9e48', lerp(2.5, o.larg || 5, tA));
    if (o.espinhos && tA > .3) for (const q of [.3, .48, .66]) { const [x, y] = c.at(q); const l = q === .48 ? 1 : -1; s += `<path d="M${f(x)} ${f(y - 3)}l${l * 6} -2l${-l * 6} -3Z" fill="${o.corCaule || '#4a9e48'}"/>`; }
    s += cotiledones(c.topo[0], c.topo[1], seg(g, .05, .1) * (1 - seg(g, .28, .4)));
    const [tx, ty] = c.topo;
    const tb = seg(g, .6, .84), tf = seg(g, .84, 1);
    if (tf > 0) s += o.flor(tx, ty, mola(tf));
    else if (tb > 0) s += o.botao ? o.botao(tx, ty, tb) : botao(tx, ty, tb, o.corBotao);
    return s;
  }

  /* ---------- espécies ---------- */
  function margarida(g, v) {
    return plantaFlor(g, {
      alt: 150, larg: 5, curva: 8, folhas: 4, tamFolha: 34, corBotao: v.cor,
      flor: (x, y, t) => florRadial(x, y, t, { n: 13, raio: 32, cor: v.cor, borda: v.id === 'branca' ? '#d9d2c3' : escuro(v.cor, .15), miolo: '#ffcd38', mioloBorda: '#e9a800', rosto: true, corRosto: '#8a5a00' })
    });
  }

  function florTulipa(x, y, t, cor) {
    const e = escuro(cor, .18), cl = claro(cor, .3);
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(Math.max(.05, t))})"><path d="M0 4C-15 4-22-8-20-24C-19-34-15-42-10-46C-7-34-3-22 0 4Z" fill="${e}"/><path d="M0 4C15 4 22-8 20-24C19-34 15-42 10-46C7-34 3-22 0 4Z" fill="${e}"/><path d="M0 6C-13 6-16-10-12-28C-9-40-4-46 0-50C4-46 9-40 12-28C16-10 13 6 0 6Z" fill="${cor}"/><path d="M-6-30C-6-38-3-43 0-46" stroke="${cl}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
  }
  function tulipa(g, v) {
    if (g < .05) return semente();
    const tA = suave(seg(g, .05, .8));
    const c = caule(lerp(14, 140, tA), 4);
    const tl = suave(seg(g, .12, .55));
    let s = folhaLonga(95, SY, 78 * tl, -102, '#4fae52') + folhaLonga(105, SY, 66 * tl, -70, '#5cb85c');
    s += traco(c.d, '#4a9e48', lerp(2.5, 5, tA));
    s += cotiledones(c.topo[0], c.topo[1], seg(g, .05, .1) * (1 - seg(g, .28, .4)));
    const tb = seg(g, .6, .84), tf = seg(g, .84, 1);
    if (tf > 0) s += florTulipa(c.topo[0], c.topo[1], .5 + .5 * mola(tf), v.cor);
    else if (tb > 0) s += botao(c.topo[0], c.topo[1], tb, v.cor);
    return s;
  }

  function girassol(g, v) {
    return plantaFlor(g, {
      alt: 205, larg: 9, curva: 6, folhas: 5, tamFolha: 46, largFolha: .55, corFolha: '#57b04f', corCaule: '#5aa24a', corBotao: v.cor,
      flor: (x, y, t) => florRadial(x, y, t, { n: 16, camadas: 2, raio: 46, cor: escuro(v.cor, .06), cor2: claro(v.cor, .15), borda: escuro(v.cor, .2), miolo: '#9a6430', mioloBorda: '#6b4220', mioloR: .42, pontos: '#5b3511', rosto: true, corRosto: '#3b2010' })
    });
  }

  function trifolio(x, y, r, a) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">`;
    for (const b of [-50, 0, 50]) s += `<ellipse cx="0" cy="${f(-r * .9)}" rx="${f(r * .6)}" ry="${f(r * .95)}" fill="#4fae52" stroke="#3e8e41" stroke-width="1.2" transform="rotate(${b})"/>`;
    return s + '</g>';
  }
  function moranguinho(x, y, t, cor) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(Math.max(.05, t))})"><path d="M0 17C-13 11-16-2-12-8C-8-14 8-14 12-8C16-2 13 11 0 17Z" fill="${cor}"/>`;
    for (const [px, py] of [[-6, -4], [0, -6], [6, -4], [-4, 3], [4, 3], [0, 10], [-8, 0], [8, 0]]) s += `<ellipse cx="${px}" cy="${py}" rx="1" ry="1.5" fill="#ffe27a"/>`;
    return s + `<path d="M-10-11L-4-8L0-14L4-8L10-11L5-5L-5-5Z" fill="#3e9a4a"/><ellipse cx="-5" cy="-4" rx="2" ry="4" fill="#fff" opacity=".3"/></g>`;
  }
  function morango(g, v) {
    if (g < .05) return semente();
    let s = '';
    const hastes = [[-62, .2], [-35, .3], [-10, .1], [15, .38], [40, .25], [64, .45]];
    for (const [a, t0] of hastes) {
      const t = suave(seg(g, t0 * .6 + .05, t0 * .6 + .4));
      if (t <= 0) continue;
      const L = 72 * t, r = rad(a - 90);
      const x = 100 + Math.cos(r) * L, y = SY + Math.sin(r) * L * .9;
      s += traco(`M100 ${SY}Q${f(100 + Math.cos(r) * L * .3)} ${f(SY - L * .6)} ${f(x)} ${f(y)}`, '#5a9e3c', 3) + trifolio(x, y, 16 * t, a);
    }
    const pos = [[58, SY - 16], [142, SY - 20], [100, SY - 34]];
    const tb = seg(g, .55, .8), tf = seg(g, .82, 1);
    pos.forEach(([x, y], i) => {
      if (tf > 0) s += traco(`M100 ${SY - 30}Q${f((x + 100) / 2)} ${f(y - 34)} ${f(x)} ${f(y - 14)}`, '#5a9e3c', 2.2) + moranguinho(x, y, mola(seg(tf, i * .1, i * .1 + .7)), v.cor);
      else if (tb > 0) s += florSimples(x, y - 14, tb, '#ffffff', 5, 14);
    });
    return s;
  }

  function cenoura(g, v) {
    if (g < .05) return semente();
    let s = '';
    const tc = suave(seg(g, .4, 1));
    const hv = lerp(0, 40, tc), w = lerp(8, 40, tc);
    const topo = SY + 4 - hv;
    if (tc > 0) {
      s += `<path d="M${f(100 - w / 2)} ${SY + 6}Q${f(100 - w / 2)} ${f(topo)} 100 ${f(topo)}Q${f(100 + w / 2)} ${f(topo)} ${f(100 + w / 2)} ${SY + 6}Z" fill="${v.cor}"/>`;
      s += traco(`M${f(100 - w * .3)} ${f(SY + 2 - hv * .35)}h${f(w * .22)}`, escuro(v.cor, .2), 1.6) + traco(`M${f(100 + w * .02)} ${f(SY + 2 - hv * .7)}h${f(w * .2)}`, escuro(v.cor, .2), 1.6);
    }
    [-42, -25, -8, 8, 25, 42].forEach((a, i) => {
      const t = suave(seg(g, .06 + i * .04, .5 + i * .04));
      if (t <= 0) return;
      const L = (82 + (i % 2) * 22) * t, r = rad(a - 90);
      const x = 100 + Math.cos(r) * L, y = topo - 2 + Math.sin(r) * L;
      s += traco(`M100 ${f(topo)}Q${f(100 + Math.cos(r) * L * .4)} ${f(topo - L * .5)} ${f(x)} ${f(y)}`, '#4f9e3a', 2.5);
      for (let k = 1; k <= 4; k++) { const q = k / 4.4; const px = lerp(100, x, q), py = lerp(topo, y, q) - Math.sin(q * Math.PI) * L * .08; s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(6 * t)}" ry="${f(3.2 * t)}" fill="${k % 2 ? '#62b84a' : '#57ab40'}" transform="rotate(${f(a - 60)} ${f(px)} ${f(py)})"/>`; }
    });
    return s;
  }

  function florRosa(x, y, t, cor) {
    const e = escuro(cor, .2), e2 = escuro(cor, .38), cl = claro(cor, .15);
    let s = `<g transform="translate(${f(x)} ${f(y - 14)}) scale(${f(Math.max(.05, t))})"><path d="M-14 12L-21 21L-6 15ZM14 12L21 21L6 15Z" fill="#3e9a4a"/>`;
    for (let i = 0; i < 5; i++) s += `<ellipse cx="0" cy="-13" rx="12" ry="12.5" fill="${cor}" stroke="${e}" stroke-width="1.5" transform="rotate(${i * 72 + 18})"/>`;
    s += `<circle r="13.5" fill="${cl}" stroke="${e}" stroke-width="1.5"/>`;
    return s + `<path d="M-1 1C-5-3 0-8 4-5C8-2 5 5-1 6C-8 7-11-1-8-6C-5-11 3-13 8-9" stroke="${e2}" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
  }
  function rosa(g, v) {
    return plantaFlor(g, {
      alt: 145, larg: 5, curva: 5, corCaule: '#3f8f45', corFolha: '#3e9a4a', folhas: 4, tamFolha: 30, largFolha: .5, espinhos: true,
      botao: (x, y, t) => botao(x, y, t, v.cor, '#3e9a4a'), flor: (x, y, t) => florRosa(x, y, t, v.cor)
    });
  }

  function cacto(g, v) {
    if (g < .05) return semente('#b88a4a');
    const tA = suave(seg(g, .05, .85));
    const H = lerp(16, 150, tA), W = lerp(16, 46, Math.min(1, tA * 1.4));
    const x0 = 100 - W / 2, x1 = 100 + W / 2, yt = SY - H;
    const verde = '#4caf6a', esc = '#34874f', cl = '#74d08e';
    let s = '';
    const b1 = suave(seg(g, .4, .65)), b2 = suave(seg(g, .55, .8));
    if (b1 > 0) { const y = SY - H * .42; s += traco(`M${f(x0 + 6)} ${f(y)}H${f(x0 - 20 * b1)}V${f(y - 40 * b1)}`, verde, 17) + traco(`M${f(x0 - 20 * b1 - 3)} ${f(y - 4)}V${f(y - 40 * b1)}`, cl, 3); }
    if (b2 > 0) { const y = SY - H * .6; s += traco(`M${f(x1 - 6)} ${f(y)}H${f(x1 + 19 * b2)}V${f(y - 32 * b2)}`, verde, 15); }
    s += `<path d="M${f(x0)} ${SY + 2}V${f(yt + W / 2)}A${f(W / 2)} ${f(W / 2)} 0 0 1 ${f(x1)} ${f(yt + W / 2)}V${SY + 2}Z" fill="${verde}"/>`;
    s += traco(`M100 ${SY}V${f(yt + 7)}`, esc, 2) + traco(`M${f(100 - W * .26)} ${SY}V${f(yt + W * .32)}`, esc, 1.5) + traco(`M${f(100 + W * .26)} ${SY}V${f(yt + W * .32)}`, esc, 1.5);
    s += traco(`M${f(x0 + W * .13)} ${SY - 6}V${f(yt + W * .45)}`, cl, 3);
    for (let i = 0; i < Math.floor(H / 26); i++) {
      const y = SY - 16 - i * 26;
      s += `<path d="M${f(x0 + 1)} ${f(y)}l-6 -3M${f(x0 + 1)} ${f(y)}l-6 3M${f(x1 - 1)} ${f(y - 12)}l6 -3M${f(x1 - 1)} ${f(y - 12)}l6 3" stroke="#f5f1d6" stroke-width="1.4" stroke-linecap="round"/>`;
    }
    const tf = seg(g, .82, 1);
    if (tf > 0) s += florSimples(100, yt + 3, mola(tf) * .95, v.cor, 6, 15);
    return s;
  }

  function lavanda(g, v) {
    if (g < .05) return semente();
    let s = '';
    const tA = suave(seg(g, .05, .8)), tl = suave(seg(g, .1, .5));
    for (const [a, l] of [[-155, 30], [-125, 38], [-55, 38], [-25, 30]]) s += folha(100, SY, l * tl, a, '#8fb98a', .22);
    const tb = seg(g, .55, .82), tf = seg(g, .82, 1);
    [-17, -8, 0, 8, 17].forEach(a => {
      const L = lerp(14, 158 - Math.abs(a) * 1.8, tA), r = rad(a - 90);
      const x = 100 + Math.cos(r) * L, y = SY + Math.sin(r) * L;
      s += traco(`M100 ${SY}L${f(x)} ${f(y)}`, '#7aa874', 2.2);
      const nflor = Math.round(lerp(0, 9, tb));
      const cor = tf > 0 ? mix('#a9c49a', v.cor, tf) : '#a9c49a';
      const rr = 3 + 2.4 * tf;
      for (let k = 0; k < nflor; k++) {
        const q = 1 - k * .045, px = lerp(100, x, q), py = lerp(SY, y, q);
        s += `<ellipse cx="${f(px - 3)}" cy="${f(py)}" rx="${f(rr * .7)}" ry="${f(rr)}" fill="${cor}" transform="rotate(${f(a - 28)} ${f(px - 3)} ${f(py)})"/><ellipse cx="${f(px + 3)}" cy="${f(py - 2)}" rx="${f(rr * .7)}" ry="${f(rr)}" fill="${escuro(cor, .12)}" transform="rotate(${f(a + 28)} ${f(px + 3)} ${f(py - 2)})"/>`;
      }
    });
    return s;
  }

  function pompom(x, y, t) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(Math.max(.05, t))})"><circle r="27" fill="#ffffff" opacity=".45"/>`;
    for (let i = 0; i < 28; i++) { const a = i * Math.PI * 2 / 28, ex = Math.cos(a) * 25, ey = Math.sin(a) * 25; s += `<line x1="0" y1="0" x2="${f(ex)}" y2="${f(ey)}" stroke="#dfe7ee" stroke-width="1.2"/><circle cx="${f(ex)}" cy="${f(ey)}" r="2.8" fill="#ffffff" stroke="#c9d4de" stroke-width=".8"/>`; }
    return s + `<circle r="4.5" fill="#c9a96b"/></g>`;
  }
  function denteDeLeao(g) {
    if (g < .05) return semente();
    let s = '';
    const tR = suave(seg(g, .08, .5));
    for (const [a, l] of [[-165, 58], [-135, 50], [-45, 50], [-15, 58]]) s += folhaDentada(100, SY, l * tR, a);
    if (g > .22) {
      const c = caule(lerp(10, 140, suave(seg(g, .22, .8))), 8);
      s += traco(c.d, '#6aa84f', 3.5);
      const [x, y] = c.topo;
      const tb = seg(g, .6, .8), tf = seg(g, .8, .9), tp = seg(g, .93, 1);
      if (tp > 0) s += pompom(x, y, mola(tp));
      else if (tf > 0) s += florRadial(x, y, mola(tf), { n: 22, camadas: 2, raio: 26, cor: '#ffd21f', cor2: '#ffe14d', borda: '#e6b400', largura: .12, miolo: '#ffc400', mioloBorda: '#f0b400', mioloR: .3 });
      else if (tb > 0) s += botao(x, y, tb, '#ffd21f');
    }
    return s;
  }

  function florzinha4(x, y, r, cor, centro) {
    return `<g transform="translate(${f(x)} ${f(y)})"><circle cx="0" cy="${f(-r * .55)}" r="${f(r * .5)}" fill="${cor}"/><circle cx="${f(r * .55)}" cy="0" r="${f(r * .5)}" fill="${cor}"/><circle cx="0" cy="${f(r * .55)}" r="${f(r * .5)}" fill="${cor}"/><circle cx="${f(-r * .55)}" cy="0" r="${f(r * .5)}" fill="${cor}"/><circle r="${f(r * .2)}" fill="${centro}"/></g>`;
  }
  function bolaHortensia(x, y, t, cor) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(Math.max(.05, t))})"><circle r="28" fill="${escuro(cor, .15)}"/>`;
    [[0, 0], [-14, -10], [14, -10], [-16, 8], [16, 8], [0, -21], [0, 19], [-24, -2], [24, -2], [-9, 23], [10, 22], [-10, -23], [11, -22]]
      .forEach(([px, py], i) => s += florzinha4(px, py, 7, i % 3 === 0 ? claro(cor, .25) : cor, escuro(cor, .3)));
    return s + '</g>';
  }
  function hortensia(g, v) {
    if (g < .05) return semente();
    let s = '';
    const tA = suave(seg(g, .05, .8));
    const tops = [];
    [[-30, 92], [0, 122], [28, 100]].forEach(([a, L0], i) => {
      const L = lerp(12, L0, tA), r = rad(a - 90);
      const x = 100 + Math.cos(r) * L, y = SY + Math.sin(r) * L;
      const tf = suave(seg(g, .15 + i * .08, .5 + i * .08));
      const mx = lerp(100, x, .5), my = lerp(SY, y, .5);
      s += folha(mx, my, 36 * tf, i === 0 ? 195 : i === 2 ? -15 : 200, '#4f9e45', .55);
      if (i === 1) s += folha(mx, my + 10, 32 * tf, -20, '#5aab4f', .55);
      s += traco(`M100 ${SY}Q${f(100 + Math.cos(r) * L * .2)} ${f(SY - L * .6)} ${f(x)} ${f(y)}`, '#5a8f3c', 4);
      tops.push([x, y]);
    });
    const tb = seg(g, .58, .84), tf = seg(g, .84, 1);
    [0, 2, 1].forEach(i => {
      const [x, y] = tops[i];
      if (tf > 0) s += bolaHortensia(x, y, mola(tf) * (i === 1 ? 1 : .85), v.cor);
      else if (tb > 0) s += bolaHortensia(x, y, tb * .55, mix('#9ccc7a', v.cor, tb * .5));
    });
    return s;
  }

  function espigaMilho(x, y, t, v) {
    const cores = v.id === 'colorido' ? ['#e94f64', '#ffd23f', '#3fa9f5', '#a77bf3', '#5cc46a', '#ff9f43'] : [v.cor, escuro(v.cor, .08)];
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(22) scale(${f(Math.max(.05, t))})"><ellipse cx="0" cy="-20" rx="10.5" ry="25" fill="${cores[0]}"/>`;
    let k = 0;
    for (let r = 0; r < 7; r++) for (let c = -1; c <= 1; c++) s += `<circle cx="${c * 5}" cy="${-38 + r * 6}" r="2.4" fill="${cores[(k++ * 7 + r) % cores.length]}"/>`;
    return s + `<path d="M0 6C-17 0-17-24-6-40C-11-20-4-4 0 6Z" fill="#7cc35a"/><path d="M0 6C17 0 17-24 6-40C11-20 4-4 0 6Z" fill="#6ab44c"/><path d="M-1-45q-4-8-2-13M2-45q3-8 7-10" stroke="#b07a3a" stroke-width="1.6" fill="none"/></g>`;
  }
  function milho(g, v) {
    if (g < .05) return semente('#f2c94c');
    let s = '';
    const tA = suave(seg(g, .05, .82));
    const c = caule(lerp(16, 215, tA), 3);
    for (let k = 0; k < 5; k++) {
      const t = suave(seg(g, .12 + k * .09, .4 + k * .09));
      if (t <= 0) continue;
      const pos = .12 + k * .17, [x, y] = c.at(pos), lado = k % 2 ? 1 : -1, L = 72 * t * (1 - pos * .3);
      s += `<path d="M${f(x)} ${f(y)}Q${f(x + lado * L * .6)} ${f(y - L * .75)} ${f(x + lado * L)} ${f(y - L * .05)}" stroke="${k % 2 ? '#5cae4a' : '#4f9e3f'}" stroke-width="${f(7 * t)}" fill="none" stroke-linecap="round"/>`;
    }
    s += traco(c.d, '#6bb34f', lerp(3, 9, tA));
    for (let k = 1; k < 5; k++) { const [x, y] = c.at(k / 5); if (tA > k / 6) s += traco(`M${f(x - 4)} ${f(y)}h8`, '#4e9a3a', 2); }
    const te = mola(seg(g, .62, 1));
    if (te > 0) { const [x, y] = c.at(.55); s += espigaMilho(x + 7, y, te, v); }
    const tp = seg(g, .78, 1);
    if (tp > 0) { const [x, y] = c.topo; for (const a of [-40, -20, 0, 20, 40]) { const r = rad(a - 90); s += traco(`M${f(x)} ${f(y)}q${f(Math.cos(r) * 10)} -12 ${f(Math.cos(r) * 24 * tp)} ${f(Math.sin(r) * 22 * tp + 6)}`, '#e6c35c', 2.2); } }
    return s;
  }

  function armadilha(x, y, t, a, v, abre) {
    const ab = 10 + 14 * abre;
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(.5 + .7 * t)})">`;
    for (const l of [-1, 1]) {
      const p = [[0, 0], [-l * 20, -4], [-l * 22, -32], [0, -36]];
      s += `<g transform="rotate(${f(l * ab)})">`;
      for (const q of [.18, .32, .46, .6, .74, .88]) {
        const [px, py] = bez(p, q), nx = px + l * 11, ny = py + 18, n = Math.hypot(nx, ny) || 1;
        s += `<path d="M${f(px)} ${f(py)}l${f(nx / n * 7)} ${f(ny / n * 7)}" stroke="${claro(v.cor, .15)}" stroke-width="2" stroke-linecap="round"/>`;
      }
      s += `<path d="M0 0C${-l * 20} -4 ${-l * 22} -32 0 -36Z" fill="${v.cor}"/><path d="M0 -3C${-l * 14} -6 ${-l * 15} -29 0 -33Z" fill="${v.dentro}"/></g>`;
    }
    return s + '</g>';
  }
  function carnivora(g, v) {
    if (g < .05) return semente();
    let s = '';
    const tf = seg(g, .9, 1);
    if (tf > 0) s += traco(`M100 ${SY}L100 ${f(SY - 160 * tf)}`, '#7cb35a', 2.5) + florSimples(100, SY - 160 * tf, mola(tf) * .8, '#ffffff', 5, 14);
    [[-62, .1], [62, .2], [-28, .3], [28, .4], [0, .5]].forEach(([a, t0]) => {
      const t = suave(seg(g, t0 * .7 + .05, t0 * .7 + .45));
      if (t <= 0) return;
      const L = (a === 0 ? 88 : 74 - Math.abs(a) * .2) * t, r = rad(a - 90);
      const x = 100 + Math.cos(r) * L, y = SY + Math.sin(r) * L;
      s += traco(`M100 ${SY}Q${f(100 + Math.cos(r) * L * .5)} ${f(SY - L * .2)} ${f(x)} ${f(y)}`, v.caule, 6 * t + 1);
      s += armadilha(x, y, t, a, v, seg(g, .8, 1));
    });
    return s;
  }

  function folhaAbobora(x, y, r) {
    return `<g transform="translate(${f(x)} ${f(y)})"><path d="M0 ${f(r * .6)}C${f(-r)} ${f(r * .6)} ${f(-r * 1.1)} ${f(-r * .2)} ${f(-r * .6)} ${f(-r * .5)}C${f(-r * .5)} ${f(-r * .95)} ${f(-r * .1)} ${f(-r * .9)} 0 ${f(-r * .6)}C${f(r * .1)} ${f(-r * .9)} ${f(r * .5)} ${f(-r * .95)} ${f(r * .6)} ${f(-r * .5)}C${f(r * 1.1)} ${f(-r * .2)} ${f(r)} ${f(r * .6)} 0 ${f(r * .6)}Z" fill="#4f9e45" stroke="#3e8236" stroke-width="1.5"/><path d="M0 ${f(r * .5)}L0 ${f(-r * .45)}M0 ${f(r * .1)}L${f(-r * .5)} ${f(-r * .3)}M0 ${f(r * .1)}L${f(r * .5)} ${f(-r * .3)}" stroke="#3e8236" stroke-width="1.2"/></g>`;
  }
  function aboboraFruto(x, y, t, cor) {
    const R = 44 * t, H = 31 * t;
    return `<g transform="translate(${f(x)} ${f(y)})"><ellipse cx="${f(-R * .45)}" cy="${f(-H)}" rx="${f(R * .5)}" ry="${f(H)}" fill="${escuro(cor, .12)}"/><ellipse cx="${f(R * .45)}" cy="${f(-H)}" rx="${f(R * .5)}" ry="${f(H)}" fill="${escuro(cor, .12)}"/><ellipse cx="0" cy="${f(-H)}" rx="${f(R * .55)}" ry="${f(H * 1.02)}" fill="${cor}"/><path d="M0 ${f(-H * 2)}q-2 ${f(-10 * t)} ${f(6 * t)} ${f(-14 * t)}" stroke="#6b5a2b" stroke-width="${f(5 * t)}" fill="none" stroke-linecap="round"/><ellipse cx="${f(-R * .15)}" cy="${f(-H * 1.4)}" rx="${f(R * .12)}" ry="${f(H * .35)}" fill="#fff" opacity=".28"/></g>`;
  }
  function abobora(g, v) {
    if (g < .05) return semente('#efe0b0');
    let s = '';
    const tA = suave(seg(g, .05, .8)), L = lerp(10, 82, tA);
    s += traco(`M100 ${SY}C${f(100 - L * .4)} ${SY - 14} ${f(100 - L * .7)} ${SY + 6} ${f(100 - L)} ${SY - 6}`, '#5a9e3c', 4);
    s += traco(`M100 ${SY}C${f(100 + L * .4)} ${SY - 12} ${f(100 + L * .7)} ${SY + 6} ${f(100 + L)} ${SY - 4}`, '#5a9e3c', 4);
    if (tA > .5) s += traco(`M${f(100 - L * .85)} ${SY - 4}c-5-11 7-16 7-6c0 4-5 4-4 1`, '#6fb34f', 1.6) + traco(`M${f(100 + L * .9)} ${SY - 4}c5-11-7-16-7-6c0 4 5 4 4 1`, '#6fb34f', 1.6);
    [[-.6, 62], [-.2, 86], [.35, 70], [.75, 54]].forEach(([p, hh], i) => {
      const t = suave(seg(g, .1 + i * .1, .45 + i * .1));
      if (t <= 0) return;
      const x = 100 + p * L, top = SY - hh * t;
      s += traco(`M${f(x)} ${SY}L${f(x + p * 6)} ${f(top)}`, '#5a9e3c', 3) + folhaAbobora(x + p * 6, top, 27 * t);
    });
    const tp = suave(seg(g, .55, 1));
    if (tp > 0) s += aboboraFruto(122, SY + 3, tp, mix('#8cc152', v.cor, seg(g, .75, 1)));
    return s;
  }

  const BOLAS = [[0, .05, 1], [-.62, .25, .72], [.62, .25, .72], [-.4, -.4, .7], [.4, -.4, .7], [0, -.58, .62], [-.8, -.08, .55], [.8, -.08, .55], [0, .45, .6]];
  const FRUTOS = [[-.5, .15], [.48, .22], [.02, -.38], [-.22, .5], [.55, -.22], [-.62, -.3], [.18, .12], [.3, .5]];
  function arvore(g, o) {
    if (g < .05) return semente(o.semente || '#8b5a2b');
    if (g < .18) {
      const t = seg(g, .05, .18), c = caule(lerp(10, 42, t), 3);
      return traco(c.d, o.tronco, 3) + folha(c.topo[0], c.topo[1], 6 + 13 * t, -35, '#5cb85c') + folha(c.topo[0], c.topo[1], 5 + 11 * t, 215, '#4aa34d');
    }
    const tA = suave(seg(g, .05, .8));
    const H = lerp(40, 125, tA), wb = lerp(5, 15, tA), wt = lerp(3, 7, tA);
    let s = `<path d="M${f(100 - wb)} ${SY + 3}C${f(100 - wb * .5)} ${f(SY - H * .4)} ${f(100 - wt)} ${f(SY - H * .7)} ${f(100 - wt)} ${f(SY - H)}L${f(100 + wt)} ${f(SY - H)}C${f(100 + wt)} ${f(SY - H * .7)} ${f(100 + wb * .5)} ${f(SY - H * .4)} ${f(100 + wb)} ${SY + 3}Z" fill="${o.tronco}"/>`;
    if (o.listras) for (let k = 1; k < 6; k++) s += traco(`M${f(100 - wb)} ${f(SY - H * k / 6 + 6)}L${f(100 + wb)} ${f(SY - H * k / 6 - 2)}`, o.listras, 3);
    s += traco(`M100 ${f(SY - H * .62)}Q${f(100 - H * .2)} ${f(SY - H * .8)} ${f(100 - H * .32)} ${f(SY - H * .98)}`, o.tronco, wt * 1.2);
    s += traco(`M100 ${f(SY - H * .72)}Q${f(100 + H * .2)} ${f(SY - H * .86)} ${f(100 + H * .3)} ${f(SY - H * 1.04)}`, o.tronco, wt);
    const R = lerp(22, 66, suave(seg(g, .18, .85)));
    const cx = 100, cy = SY - H - R * .3;
    const tb = seg(g, .6, .85), tf = seg(g, .85, 1);
    const cores = o.copa(tf);
    BOLAS.forEach(([bx, by, br], i) => s += `<circle cx="${f(cx + bx * R)}" cy="${f(cy + by * R)}" r="${f(br * R * .62)}" fill="${cores[i % cores.length]}"/>`);
    s += `<ellipse cx="${f(cx - R * .35)}" cy="${f(cy - R * .45)}" rx="${f(R * .24)}" ry="${f(R * .12)}" fill="#fff" opacity=".2" transform="rotate(-25 ${f(cx - R * .35)} ${f(cy - R * .45)})"/>`;
    FRUTOS.forEach(([px, py], i) => {
      const x = cx + px * R, y = cy + py * R;
      if (tf > 0) s += o.fruto(x, y, mola(seg(tf, i * .06, i * .06 + .55)), i);
      else if (tb > 0 && o.flor) s += florSimples(x, y, tb * .5, o.flor, 5, 12, '#ffd23f');
    });
    return s;
  }
  function maca(x, y, t, cor) {
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(Math.max(.05, t))})"><path d="M0-9q1-5 4-7" stroke="#6b4a2a" stroke-width="2" fill="none"/><path d="M1-12c4-5 10-4 11-1-4 3-9 3-11 1Z" fill="#5cb85c"/><path d="M0-7C-6-11-12-7-11 1-10 9-4 12 0 10 4 12 10 9 11 1 12-7 6-11 0-7Z" fill="${cor}"/><ellipse cx="-5" cy="-2" rx="2.2" ry="3.5" fill="#fff" opacity=".45"/></g>`;
  }
  function macieira(g, v) {
    return arvore(g, { tronco: '#8b5a2b', copa: () => ['#5cb85c', '#4aa34d', '#6cc66a'], flor: '#ffe3ef', fruto: (x, y, t) => maca(x, y, t, v.cor) });
  }
  function cerejeira(g, v) {
    const rosa = [v.cor, escuro(v.cor, .1), claro(v.cor, .35)];
    return arvore(g, {
      tronco: '#6e4a3a', flor: v.cor,
      copa: tf => ['#5cb85c', '#4aa34d', '#6cc66a'].map((c, i) => mix(c, rosa[i], tf)),
      fruto: (x, y, t, i) => florSimples(x, y, t * .8, i % 2 ? claro(v.cor, .5) : escuro(v.cor, .06), 5, 14, '#ffd23f')
    });
  }
  function algodao(g, v) {
    const cores = [v.cor, escuro(v.cor, .07), claro(v.cor, .35)];
    return arvore(g, {
      tronco: '#f3e6d6', listras: claro(v.cor, .1), flor: '#ffffff',
      copa: tf => cores.map(c => mix(claro(c, .5), c, .4 + .6 * tf)),
      fruto: (x, y, t) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(Math.max(.05, t))})"><path d="M0-7Q0 0 7 0Q0 0 0 7Q0 0-7 0Q0 0 0-7Z" fill="#fff" opacity=".95"/></g>`
    });
  }

  const ARCO = ['#ff5a5a', '#ff9f43', '#ffd23f', '#5cc46a', '#3fa9f5', '#6b6bff', '#b388ff'];
  function arcoiris(g) {
    return plantaFlor(g, {
      alt: 165, larg: 5, curva: 7, folhas: 4, tamFolha: 36, corBotao: '#ff9ec7',
      flor: (x, y, t) => florRadial(x, y, t, { n: 14, camadas: 2, raio: 40, cores: ARCO, borda: 'rgba(0,0,0,.12)', largura: .19, miolo: '#fff3b0', mioloBorda: '#ffd23f', mioloR: .38, rosto: true, corRosto: '#7a4a00' })
    });
  }
  function florEstrela(x, y, t, cor) {
    const ponta = r => { const p = []; for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r, a = -Math.PI / 2 + i * Math.PI / 5; p.push(`${f(Math.cos(a) * rr)},${f(Math.sin(a) * rr)}`); } return p.join(' '); };
    return `<g transform="translate(${f(x)} ${f(y - 4)}) scale(${f(Math.max(.05, t))})"><circle r="52" fill="${cor}" opacity=".16" class="pulsa"/><circle r="38" fill="${cor}" opacity=".18"/><polygon points="${ponta(42)}" fill="${cor}" stroke="${escuro(cor, .22)}" stroke-width="2.5" stroke-linejoin="round"/><polygon points="${ponta(24)}" fill="${claro(cor, .45)}"/><g transform="translate(0 2)">${rosto(14, '#5a3a10')}</g></g>`;
  }
  function estrela(g, v) {
    return plantaFlor(g, { alt: 160, larg: 5, curva: 6, folhas: 4, tamFolha: 32, corBotao: v.cor, flor: (x, y, t) => florEstrela(x, y, t, v.cor) });
  }

  const ESPECIES = [
    { id: 'margarida', nome: 'Margarida', art: 'a', rar: 1, f: margarida, var: [{ id: 'branca', nome: 'branca', cor: '#ffffff' }, { id: 'rosa', nome: 'rosa', cor: '#ff9ec7' }, { id: 'lilas', nome: 'lilás', cor: '#c7a6ff' }] },
    { id: 'tulipa', nome: 'Tulipa', art: 'a', rar: 1, f: tulipa, var: [{ id: 'vermelha', nome: 'vermelha', cor: '#ef3e4a' }, { id: 'amarela', nome: 'amarela', cor: '#ffcc2f' }, { id: 'rosa', nome: 'rosa', cor: '#ff7eb6' }, { id: 'roxa', nome: 'roxa', cor: '#9b59d0' }] },
    { id: 'girassol', nome: 'Girassol', art: 'o', rar: 1, f: girassol, var: [{ id: 'amarelo', nome: 'amarelo', cor: '#ffc31f' }, { id: 'laranja', nome: 'laranja', cor: '#ff9a1f' }, { id: 'vermelho', nome: 'vermelho', cor: '#d9482b' }] },
    { id: 'morango', nome: 'Morango', art: 'o', rar: 1, f: morango, var: [{ id: 'vermelho', nome: '', cor: '#e8333d' }] },
    { id: 'cenoura', nome: 'Cenoura', art: 'a', rar: 1, f: cenoura, var: [{ id: 'laranja', nome: 'laranja', cor: '#ff8c1a' }, { id: 'roxa', nome: 'roxa', cor: '#8a3fb0' }] },
    { id: 'rosa', nome: 'Rosa', art: 'a', rar: 2, f: rosa, var: [{ id: 'vermelha', nome: 'vermelha', cor: '#e0283c' }, { id: 'rosa', nome: 'cor-de-rosa', cor: '#ff8fb8' }, { id: 'amarela', nome: 'amarela', cor: '#ffd23f' }, { id: 'branca', nome: 'branca', cor: '#fff5ee' }] },
    { id: 'cacto', nome: 'Cacto', art: 'o', rar: 2, f: cacto, var: [{ id: 'rosa', nome: 'de flor rosa', cor: '#ff6fae' }, { id: 'amarela', nome: 'de flor amarela', cor: '#ffd23f' }, { id: 'vermelha', nome: 'de flor vermelha', cor: '#ff4d4d' }] },
    { id: 'lavanda', nome: 'Lavanda', art: 'a', rar: 2, f: lavanda, var: [{ id: 'roxa', nome: 'roxa', cor: '#8e5bd6' }, { id: 'lilas', nome: 'lilás', cor: '#b79cf0' }, { id: 'rosa', nome: 'rosa', cor: '#e48fc4' }] },
    { id: 'dente', nome: 'Dente-de-leão', art: 'o', rar: 2, f: denteDeLeao, var: [{ id: 'amarelo', nome: '', cor: '#ffd21f' }] },
    { id: 'hortensia', nome: 'Hortênsia', art: 'a', rar: 2, f: hortensia, var: [{ id: 'azul', nome: 'azul', cor: '#6fa8ff' }, { id: 'rosa', nome: 'rosa', cor: '#ff9ccf' }, { id: 'lilas', nome: 'lilás', cor: '#b88cf0' }] },
    { id: 'milho', nome: 'Milho', art: 'o', rar: 2, f: milho, var: [{ id: 'amarelo', nome: 'amarelo', cor: '#ffd54a' }, { id: 'colorido', nome: 'colorido', cor: 'arco' }] },
    { id: 'carnivora', nome: 'Planta carnívora', art: 'a', rar: 3, f: carnivora, var: [{ id: 'verde', nome: 'verde', cor: '#7cc35a', dentro: '#e5484d', caule: '#5f9e45' }, { id: 'vermelha', nome: 'vermelha', cor: '#b8323a', dentro: '#ff6b7a', caule: '#8f3b3b' }] },
    { id: 'abobora', nome: 'Abóbora', art: 'a', rar: 3, f: abobora, var: [{ id: 'laranja', nome: 'laranja', cor: '#ff9b2f' }, { id: 'branca', nome: 'branca', cor: '#f1ebdc' }] },
    { id: 'macieira', nome: 'Macieira', art: 'a', rar: 3, f: macieira, var: [{ id: 'vermelha', nome: 'de maçã vermelha', cor: '#e8333d' }, { id: 'verde', nome: 'de maçã verde', cor: '#8fd14f' }] },
    { id: 'cerejeira', nome: 'Cerejeira', art: 'a', rar: 3, f: cerejeira, var: [{ id: 'rosa', nome: 'rosa', cor: '#ffb7d5' }, { id: 'branca', nome: 'branca', cor: '#fff0f6' }] },
    { id: 'arcoiris', nome: 'Flor arco-íris', art: 'a', rar: 4, f: arcoiris, var: [{ id: 'unica', nome: '', cor: 'arco' }] },
    { id: 'estrela', nome: 'Flor-estrela', art: 'a', rar: 4, f: estrela, var: [{ id: 'dourada', nome: 'dourada', cor: '#ffcf2e' }, { id: 'prateada', nome: 'prateada', cor: '#cfe0ff' }] },
    { id: 'algodao', nome: 'Árvore de algodão-doce', art: 'a', rar: 4, f: algodao, var: [{ id: 'rosa', nome: 'rosa', cor: '#ffb3d9' }, { id: 'azul', nome: 'azul', cor: '#a8d8ff' }] }
  ];
  const porId = Object.fromEntries(ESPECIES.map(e => [e.id, e]));

  function especie(id) { return porId[id]; }
  function variante(esp, vid) { const e = typeof esp === 'string' ? porId[esp] : esp; return e.var.find(v => v.id === vid) || e.var[0]; }

  /* conteúdo da planta (sem o <svg>), para animar o crescimento */
  function corpo(eid, vid, g) {
    const e = porId[eid]; if (!e) return '';
    let s = e.f(clamp(g, 0, 1), variante(e, vid));
    if (e.rar === 4 && g >= 1) s += cintilas(100, 120, 70);
    return s;
  }
  function svg(eid, vid, g = 1, classe = '') {
    return `<svg class="planta-svg ${classe}" viewBox="0 0 200 300" aria-hidden="true">${solo()}<g class="corpo">${corpo(eid, vid, g)}</g></svg>`;
  }
  function nomeCompleto(eid, vid) {
    const e = porId[eid], v = variante(e, vid);
    return v.nome ? `${e.nome} ${v.nome}` : e.nome;
  }

  return { ESPECIES, especie, variante, corpo, svg, solo, nomeCompleto, total: ESPECIES.reduce((n, e) => n + e.var.length, 0) };
})();
