/* util.js — atalhos de DOM, som sintetizado, voz, confete, ícones e datas. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sortear = arr => arr[Math.floor(Math.random() * arr.length)];
const esperar = ms => new Promise(r => setTimeout(r, ms));

function hoje(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  if (html) e.innerHTML = html;
  return e;
}

/* Ícones desenhados (não dependem de emoji) */
const Icone = {
  agua: '<svg viewBox="0 0 24 32" class="ic"><path d="M12 1C12 1 2 13 2 20.5a10 10 0 0 0 20 0C22 13 12 1 12 1Z" fill="#3fa9f5"/><path d="M12 1C12 1 2 13 2 20.5a10 10 0 0 0 20 0C22 13 12 1 12 1Z" fill="none" stroke="#1f86d6" stroke-width="1.5"/><ellipse cx="7.5" cy="20" rx="2.4" ry="4" fill="#fff" opacity=".65"/></svg>',
  adubo: '<svg viewBox="0 0 32 34" class="ic"><path d="M9 8h14l-2.5 4.5C26 15.5 29 20 29 25c0 5-4 7-8 7H11c-4 0-8-2-8-7 0-5 3-9.5 8.5-12.5Z" fill="#c08a52" stroke="#875b2f" stroke-width="1.5"/><path d="M8.5 8.5c3-4 12-4 15 0" stroke="#875b2f" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M11.5 12.5h9" stroke="#875b2f" stroke-width="2" stroke-linecap="round"/><path d="M16 29c-5-2.5-5-8.5 0-11 5 2.5 5 8.5 0 11Z" fill="#6cc04a"/><path d="M16 28.5v-10" stroke="#4e9a33" stroke-width="1.2"/></svg>',
  semente: '<svg viewBox="0 0 32 32" class="ic"><ellipse cx="16" cy="18" rx="9" ry="12" transform="rotate(25 16 18)" fill="#d5a25c" stroke="#8a5d24" stroke-width="1.6"/><path d="M12 12c2 4 3 9 2 14" stroke="#8a5d24" stroke-width="1.4" fill="none" opacity=".6"/><ellipse cx="12.5" cy="13" rx="2" ry="3.5" transform="rotate(25 12.5 13)" fill="#fff" opacity=".55"/></svg>',
  estrela: (cheia = true) => `<svg viewBox="0 0 48 48" class="ic"><path d="M24 3.5l6.2 12.6 13.9 2-10 9.8 2.4 13.8L24 35.2l-12.5 6.5 2.4-13.8-10-9.8 13.9-2Z" fill="${cheia ? '#ffc934' : '#e3e8ef'}" stroke="${cheia ? '#e09b00' : '#c9d1dc'}" stroke-width="2.5" stroke-linejoin="round"/>${cheia ? '<path d="M17 17.5l4-1" stroke="#fff6c9" stroke-width="3" stroke-linecap="round"/>' : ''}</svg>`,
  regador: '<svg viewBox="0 0 120 90"><path d="M78 40 L112 18 L116 24 L84 50 Z" fill="#5aa9e6"/><ellipse cx="114" cy="20" rx="6" ry="9" transform="rotate(-35 114 20)" fill="#3a8fd0"/><rect x="18" y="30" width="64" height="48" rx="12" fill="#6dbaf0"/><rect x="18" y="30" width="64" height="12" rx="6" fill="#8fcdf7"/><path d="M30 30 C30 4 70 4 70 30" stroke="#3a8fd0" stroke-width="7" fill="none"/><ellipse cx="34" cy="54" rx="6" ry="12" fill="#fff" opacity=".35"/></svg>',
  saco: '<svg viewBox="0 0 90 100"><path d="M24 22h40l-6 12c14 8 22 21 22 35 0 15-11 21-24 21H32c-13 0-24-6-24-21 0-14 8-27 22-35Z" fill="#c08a52" stroke="#875b2f" stroke-width="3"/><path d="M22 23c8-11 36-11 44 0" stroke="#875b2f" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M45 88c-13-7-13-23 0-30 13 7 13 23 0 30Z" fill="#6cc04a"/></svg>',
  cadeado: '<svg viewBox="0 0 32 32" class="ic"><rect x="6" y="14" width="20" height="15" rx="4" fill="#9aa6b8"/><path d="M10 14v-4a6 6 0 0 1 12 0v4" stroke="#9aa6b8" stroke-width="3.5" fill="none"/><circle cx="16" cy="21" r="2.5" fill="#fff"/></svg>'
};

/* ---------- Som: tudo sintetizado na hora, sem arquivos ---------- */
const Som = (() => {
  let ac = null, ligado = true;
  const ESCALA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.3, 2637];

  function contexto() {
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ac = new C();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function tom(freq, dur = .15, { tipo = 'sine', vol = .16, quando = 0, ate = null, ataque = .008 } = {}) {
    if (!ligado) return;
    const a = contexto(); if (!a) return;
    const t = a.currentTime + quando;
    const o = a.createOscillator(), g = a.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t);
    if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + .05);
  }

  function ruido(dur, { vol = .08, quando = 0, freq = 1500, q = 1.5 } = {}) {
    if (!ligado) return;
    const a = contexto(); if (!a) return;
    const t = a.currentTime + quando;
    const n = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = a.createGain(); g.gain.setValueAtTime(vol, t);
    src.connect(f).connect(g).connect(a.destination);
    src.start(t);
  }

  return {
    ligar(v) { ligado = v; },
    destravar() { contexto(); },
    pop() { tom(520, .09, { tipo: 'triangle', ate: 880, vol: .13 }); },
    nota(i) {
      const f = ESCALA[Math.max(0, Math.min(i, ESCALA.length - 1))];
      tom(f, .32, { vol: .12 }); tom(f * 2, .18, { vol: .025, quando: .01 });
    },
    ops() { tom(330, .2, { tipo: 'sine', ate: 210, vol: .09 }); },
    acorde() { [2, 4, 7].forEach((n, i) => tom(ESCALA[n], .45, { tipo: 'triangle', vol: .1, quando: i * .07 })); },
    fanfarra() {
      [0, 2, 4, 7].forEach((n, i) => tom(ESCALA[n], .42, { tipo: 'triangle', vol: .12, quando: i * .11 }));
      tom(ESCALA[7], 1, { vol: .1, quando: .46 }); tom(ESCALA[9], 1, { vol: .06, quando: .46 });
    },
    estrela(i) { const f = ESCALA[4 + i * 2]; tom(f, .35, { tipo: 'triangle', vol: .14 }); tom(f * 1.5, .3, { vol: .04, quando: .05 }); },
    agua() { for (let i = 0; i < 7; i++) tom(400 + Math.random() * 500, .09, { vol: .07, quando: i * .08 + Math.random() * .03, ate: 900 + Math.random() * 600 }); },
    adubo() { for (let i = 0; i < 5; i++) ruido(.07, { vol: .09, quando: i * .09, freq: 2200 + Math.random() * 1500, q: 3 }); },
    crescer() { tom(260, .7, { tipo: 'sine', ate: 820, vol: .1 }); tom(390, .7, { tipo: 'triangle', ate: 1230, vol: .04, quando: .05 }); },
    magia() { [4, 6, 7, 9, 11, 12].forEach((n, i) => tom(ESCALA[n], .5, { tipo: 'sine', vol: .08, quando: i * .06 })); },
    moeda() { tom(988, .08, { tipo: 'square', vol: .05 }); tom(1319, .28, { tipo: 'square', vol: .05, quando: .08 }); },
    nao() { tom(240, .14, { tipo: 'triangle', vol: .08 }); tom(200, .2, { tipo: 'triangle', vol: .08, quando: .12 }); }
  };
})();

/* ---------- Voz: frases gravadas (Gemini TTS), tocadas em sequência ----------
   Voz.falar('frase') ou Voz.falar(['frase 1', 'frase 2']). Cada frase precisa ter sido gravada antes
   (ferramentas/gerar-vozes.mjs); frase sem gravação é pulada em silêncio (e avisa no console). */
const Voz = (() => {
  let ligada = true, indice = null, audio = null, fila = [], vez = 0;
  const pronta = fetch('audio/indice.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : null).then(j => { indice = j; }).catch(() => {});

  const tem = t => !!(indice && t && indice.clips[Falas.hash(t)]);

  function falar(txt) {
    if (!ligada || !txt) return;
    parar();
    fila = (Array.isArray(txt) ? txt : [txt]).filter(Boolean);
    tocar(vez);
  }

  function tocar(minha) {
    if (minha !== vez || !fila.length) return;
    const t = fila.shift();
    if (!tem(t)) { if (indice) console.warn('[voz] frase sem gravação:', t); tocar(minha); return; }
    audio = audio || new Audio();
    audio.onended = () => setTimeout(() => tocar(minha), 140);
    audio.onerror = () => tocar(minha);
    audio.src = `audio/voz/${Falas.hash(t)}.${indice.formato || 'ogg'}`;
    audio.play().catch(() => {});
  }

  function parar() { vez++; fila = []; if (audio) audio.pause(); }

  return {
    falar, parar, tem, pronta,
    ligar(v) { ligada = v; if (!v) parar(); },
    total: () => indice ? Object.keys(indice.clips).length : 0
  };
})();

/* ---------- Confete por cima de tudo ---------- */
const Festa = (() => {
  let cv, ctx, ps = [], raf = 0;
  const CORES = ['#ff6b8b', '#ffd23f', '#3fa9f5', '#5cc46a', '#a77bf3', '#ff9f43'];

  function preparar() {
    cv = cv || document.getElementById('confete');
    ctx = cv.getContext('2d');
    const d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * d; cv.height = innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  function confete(n = 110, x = innerWidth / 2, y = innerHeight * .35) {
    if (!raf) preparar();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 10;
      ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 7, r: 6 + Math.random() * 7, cor: sortear(CORES), rot: Math.random() * 6, vr: (Math.random() - .5) * .4, vida: 0, max: 80 + Math.random() * 60, forma: Math.random() < .5 });
    }
    if (!raf) raf = requestAnimationFrame(passo);
  }

  function passo() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps = ps.filter(p => p.vida < p.max);
    for (const p of ps) {
      p.vida++; p.vy += .28; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (p.max - p.vida) / 25);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.cor;
      if (p.forma) ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    if (ps.length) raf = requestAnimationFrame(passo);
    else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  return { confete };
})();

/* ---------- Tela sempre acesa enquanto a criança desenha ---------- */
const TelaAcesa = (() => {
  let trava = null;
  return {
    async pedir() { try { if ('wakeLock' in navigator && !trava) { trava = await navigator.wakeLock.request('screen'); trava.addEventListener('release', () => { trava = null; }); } } catch { trava = null; } },
    soltar() { try { trava?.release(); } catch {} trava = null; }
  };
})();

function avisar(txt, ms = 2200) {
  const a = $('#aviso');
  a.textContent = txt; a.hidden = false;
  a.classList.remove('some'); void a.offsetWidth; a.classList.add('mostra');
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => { a.classList.remove('mostra'); a.hidden = true; }, ms);
}
