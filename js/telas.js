/* telas.js — jardim, trilha de fases, coleção, recompensa, escolha de semente e descanso. */

const nomeCrianca = () => (Jogo.estado().nome || '').trim().split(/\s+/)[0] || '';
/* frase com o nome da criança, se ela foi gravada; senão a frase genérica */
const comNome = (fn, generica) => { const n = nomeCrianca(), t = n && fn(n); return t && Voz.tem(t) ? t : generica; };

function inventario(alvo) {
  const e = Jogo.estado();
  $(alvo).innerHTML = `<span class="item item-agua">${Icone.agua}<b>${e.agua}</b></span><span class="item item-adubo">${Icone.adubo}<b>${e.adubo}</b></span>`;
}
function pularNumero(sel) { const b = $(sel); if (!b) return; b.classList.remove('pula'); void b.offsetWidth; b.classList.add('pula'); }

/* ================= JARDIM ================= */
const Jardim = (() => {
  let ocupado = false, aberto = null;

  function render() {
    const e = Jogo.estado();
    const box = $('#canteiros');
    box.innerHTML = '';
    e.plantas.forEach(p => box.appendChild(canteiro(p)));
    const vazios = Math.max(2, 4 - e.plantas.length);
    for (let i = 0; i < vazios; i++) box.appendChild(el('div', { class: 'canteiro vazio' }, `<svg class="planta-svg" viewBox="0 0 200 300" aria-hidden="true">${Plantas.solo()}</svg>`));
    atualizarTopo();
    borboletas();
    aberto = null;
    // jardim grande: já abre mostrando a planta que precisa de atenção (semente pronta ou ainda crescendo)
    const foco = e.plantas.find(p => p.semente === 'pronta') || e.plantas.find(p => !p.madura);
    const alvo = foco && box.querySelector(`.canteiro[data-id="${foco.id}"]`);
    if (alvo) { box.style.scrollBehavior = 'auto'; box.scrollLeft = Math.max(0, alvo.offsetLeft - (box.clientWidth - alvo.offsetWidth) / 2); box.style.scrollBehavior = ''; }
  }

  function atualizarTopo() {
    inventario('#inv-jardim');
    const e = Jogo.estado(), bt = $('#bt-semente-extra');
    bt.hidden = e.sementesExtra <= 0;
    bt.innerHTML = `${Icone.semente}<b>${e.sementesExtra}</b>`;
  }

  function canteiro(p) {
    const d = el('div', { class: 'canteiro', 'data-id': p.id });
    d.innerHTML = Plantas.svg(p.especie, p.variante, Jogo.fracao(p)) + barra(p);
    d.querySelector('.corpo').style.animationDelay = `-${(p.id * 1.7) % 5}s`;
    if (p.semente === 'pronta') d.appendChild(bolhaSemente(p));
    d.addEventListener('click', ev => { if (!ev.target.closest('.acoes, .bolha-semente')) tocarPlanta(p.id, d); });
    return d;
  }
  function barra(p) {
    if (p.madura) return `<div class="crescimento pronta">${Icone.estrela(true)}</div>`;
    return `<div class="crescimento"><div class="trilho"><i style="width:${Math.round(Jogo.fracao(p) * 100)}%"></i></div>${Icone.semente}</div>`;
  }
  function bolhaSemente(p) {
    const b = el('button', { class: 'bolha-semente', 'aria-label': 'Pegar a semente' }, Icone.semente);
    b.addEventListener('click', ev => { ev.stopPropagation(); pegarSemente(p.id); });
    return b;
  }

  function tocarPlanta(id, d) {
    const p = Jogo.planta(id);
    Som.pop();
    if (p.semente === 'pronta') { Voz.falar(Falas.toqueSemente); return; }
    if (p.madura) {
      Voz.falar(Falas.plantas.grandona(p.especie));
      d.classList.remove('feliz'); void d.offsetWidth; d.classList.add('feliz');
      return;
    }
    if (aberto === d) { fecharAcoes(); return; }
    fecharAcoes();
    aberto = d;
    const e = Jogo.estado();
    const a = el('div', { class: 'acoes' });
    a.innerHTML = `<button class="bt-acao agua ${e.agua ? '' : 'sem'}" data-t="agua" aria-label="Regar">${Icone.agua}<b>${e.agua}</b></button><button class="bt-acao adubo ${e.adubo ? '' : 'sem'}" data-t="adubo" aria-label="Adubar">${Icone.adubo}<b>${e.adubo}</b></button>`;
    a.addEventListener('click', ev => { const b = ev.target.closest('.bt-acao'); if (b) { ev.stopPropagation(); usar(id, b.dataset.t, d); } });
    d.appendChild(a);
    posicionarAcoes(d);
    d.querySelector('.dedo')?.remove();
    if (!e.tutorial.regou && e.agua > 0) Voz.falar(Falas.regarDica);
  }
  function fecharAcoes() { $$('#canteiros .acoes').forEach(a => a.remove()); aberto = null; }

  // o balão fica logo acima do topo da planta (planta pequena = balão baixo, perto da semente)
  function alturaPlanta(d) {
    const svg = d.querySelector('.planta-svg'), barra = d.querySelector('.crescimento');
    let topo = 270;
    try { topo = Math.min(270, d.querySelector('.corpo').getBBox().y); } catch {}
    return (barra ? barra.offsetHeight : 0) - 6 + (300 - topo) * (svg.clientHeight / 300);
  }
  function posicionarAcoes(d) {
    const a = d.querySelector('.acoes');
    if (a) a.style.bottom = Math.min(alturaPlanta(d) + 18, d.clientHeight + 10) + 'px';
  }

  async function usar(id, tipo, d) {
    if (ocupado) return;
    const e = Jogo.estado();
    if (e[tipo] <= 0) {
      Som.nao();
      Voz.falar(tipo === 'agua' ? Falas.semAgua : Falas.semAdubo);
      chamarBrincar();
      return;
    }
    ocupado = true;
    const ferramenta = el('div', { class: `ferramenta ${tipo}` }, tipo === 'agua' ? Icone.regador : Icone.saco);
    for (let i = 0; i < 9; i++) ferramenta.appendChild(el('i', { class: 'pingo', style: `--x:${(Math.random() * 60 - 30).toFixed(0)}px;--d:${(i * .07).toFixed(2)}s` }));
    ferramenta.style.bottom = Math.min(alturaPlanta(d) + 30, d.clientHeight) + 'px';
    const balao = d.querySelector('.acoes');
    if (balao) balao.style.visibility = 'hidden';
    d.appendChild(ferramenta);
    tipo === 'agua' ? Som.agua() : Som.adubo();
    await esperar(850);
    const r = Jogo.usar(id, tipo);
    ferramenta.remove();
    atualizarTopo();
    pularNumero(`#inv-jardim .item-${tipo}`);
    const acoes = d.querySelector('.acoes');
    if (acoes) acoes.style.visibility = '';
    if (acoes) { acoes.querySelector('.agua b').textContent = e.agua; acoes.querySelector('.adubo b').textContent = e.adubo; acoes.querySelector('.agua').classList.toggle('sem', !e.agua); acoes.querySelector('.adubo').classList.toggle('sem', !e.adubo); }
    if (r.erro) { ocupado = false; return; }
    Som.crescer();
    await animarCrescimento(d, Jogo.planta(id), r.antes, r.depois);
    d.querySelector('.crescimento').outerHTML = barra(Jogo.planta(id));
    posicionarAcoes(d);
    if (r.madurou) {
      fecharAcoes();
      const p = Jogo.planta(id);
      Som.magia();
      const rc = d.getBoundingClientRect();
      Festa.confete(90, rc.left + rc.width / 2, rc.top + rc.height * .3);
      Voz.falar(Falas.plantas.cresceu(p.especie));
      d.appendChild(bolhaSemente(p));
      borboletas();
    } else if (e.agua === 0 && e.adubo === 0) {
      setTimeout(() => { Voz.falar(Falas.semNada); chamarBrincar(); }, 900);
    }
    ocupado = false;
  }

  function animarCrescimento(d, p, de, ate) {
    return new Promise(ok => {
      const g = d.querySelector('.corpo'), t0 = performance.now(), dur = 750;
      const passo = agora => {
        const k = Math.min(1, (agora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        g.innerHTML = Plantas.corpo(p.especie, p.variante, de + (ate - de) * e);
        k < 1 ? requestAnimationFrame(passo) : ok();
      };
      requestAnimationFrame(passo);
    });
  }

  function chamarBrincar() { const b = $('#bt-brincar'); b.classList.remove('chama'); void b.offsetWidth; b.classList.add('chama'); }

  function pegarSemente(id) {
    Som.magia();
    Escolha.abrir({ origem: id });
  }

  function mostrarDedo(id) {
    const d = $(`#canteiros .canteiro[data-id="${id}"]`);
    if (d && !d.querySelector('.dedo')) d.appendChild(el('div', { class: 'dedo' }, '👆'));
  }

  function rolarPara(id) {
    const d = $(`#canteiros .canteiro[data-id="${id}"]`);
    d?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    return d;
  }

  function borboletas() {
    const box = $('#borboletas');
    const n = Math.min(3, Jogo.estado().plantas.filter(p => p.madura).length);
    if (box.childElementCount === n) return;
    box.innerHTML = '';
    for (let i = 0; i < n; i++) box.appendChild(el('div', { class: `borboleta b${i}` }, i === 1 ? '🐝' : '🦋'));
  }

  return { render, atualizarTopo, fecharAcoes, mostrarDedo, rolarPara, chamarBrincar, ocupado: () => ocupado };
})();

/* ================= ESCOLHA DE SEMENTE ================= */
const Escolha = (() => {
  const RAR = { 1: ['Comum', '#5cc46a'], 2: ['Especial', '#3fa9f5'], 3: ['Rara', '#a77bf3'], 4: ['Mágica', '#ffb400'] };

  function abrir({ origem = null, primeira = false, extra = false } = {}) {
    const ofertas = Jogo.oferta(primeira);
    const html = `<h2 class="modal-titulo">${Icone.semente} Escolha uma semente!</h2>
      <div class="pacotes">${ofertas.map((o, i) => {
        const [rotulo, cor] = RAR[o.rar];
        return `<button class="pacote" data-i="${i}" style="--cor:${cor}"><span class="pacote-topo"></span>
          <span class="pacote-janela">${Plantas.svg(o.especie, o.variante, 1)}</span>
          <span class="pacote-nome">${Plantas.nomeCompleto(o.especie, o.variante)}</span>
          <span class="pacote-rar">${'★'.repeat(o.rar)} ${rotulo}</span></button>`;
      }).join('')}</div>`;
    Modal.abrir(html, { fixo: true, classe: 'modal-sementes' });
    Voz.falar(primeira ? Falas.primeiraSemente : Falas.escolhaSemente);
    $$('#modal .pacote').forEach(b => b.addEventListener('click', () => escolher(ofertas[+b.dataset.i], b, { origem, primeira, extra }), { once: true }));
  }

  async function escolher(o, botao, { origem, primeira, extra }) {
    if (escolher.ocupado) return;
    escolher.ocupado = true;
    $$('#modal .pacote').forEach(b => b.classList.add(b === botao ? 'escolhido' : 'apagado'));
    Som.magia();
    Voz.falar(Falas.plantas.escolheu(o.especie, o.variante));
    if (origem) Jogo.colher(origem);
    if (extra) Jogo.usarSementeExtra();
    const p = Jogo.plantar(o.especie, o.variante);
    await esperar(1300);
    Modal.fechar();
    escolher.ocupado = false;
    Jardim.render();
    const d = Jardim.rolarPara(p.id);
    d?.classList.add('nasceu');
    if (primeira) {
      Jogo.presente(3, 1);
      Jardim.atualizarTopo();
      await esperar(1600);
      Voz.falar(Falas.ganhouInicio);
      Jardim.mostrarDedo(p.id);
    }
  }

  return { abrir };
})();

/* ================= MODAL ================= */
const Modal = (() => {
  let aoFechar = null;
  function abrir(html, { fixo = false, classe = '', fechar = null } = {}) {
    const m = $('#modal'), c = $('#modal-caixa');
    c.className = 'modal-caixa ' + classe;
    c.innerHTML = html;
    m.hidden = false;
    m.dataset.fixo = fixo ? '1' : '';
    aoFechar = fechar;
    requestAnimationFrame(() => m.classList.add('aberto'));
  }
  function fechar() {
    const m = $('#modal');
    m.classList.remove('aberto');
    m.hidden = true;
    $('#modal-caixa').innerHTML = '';
    const f = aoFechar; aoFechar = null; f?.();
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('#modal').addEventListener('click', ev => { if (ev.target.id === 'modal' && !$('#modal').dataset.fixo) fechar(); });
  });
  return { abrir, fechar, aberto: () => !$('#modal').hidden };
})();

/* ================= TRILHA ================= */
const Trilha = (() => {
  let mundoId = null;

  function render(id) {
    const ms = Jogo.mundos();
    const m = ms.find(x => x.id === id) || Jogo.mundoSugerido();
    mundoId = m.id;
    const tela = $('#tela-trilha');
    tela.style.setProperty('--cor', m.cor);
    tela.style.setProperty('--fundo', m.fundo);
    $('#trilha-titulo').innerHTML = `<span class="mascote">${m.mascote}</span> ${m.nome}`;
    inventario('#inv-trilha');
    nav(ms, m);
    mapa(m);
  }

  function nav(ms, atual) {
    $('#mundos').innerHTML = ms.map(m => {
      const lib = Jogo.mundoLiberado(m), feitas = m.fases.filter(f => Jogo.feita(f.id)).length;
      return `<button class="chip-mundo ${m.id === atual.id ? 'ativo' : ''} ${lib ? '' : 'trancado'}" data-id="${m.id}" style="--cor:${m.cor}">
        <span class="chip-mascote">${m.mascote}</span><span class="chip-conta">${lib ? `${feitas}/${m.fases.length}` : Icone.cadeado}</span></button>`;
    }).join('');
    $$('#mundos .chip-mundo').forEach(b => b.addEventListener('click', () => {
      const m = ms.find(x => x.id === b.dataset.id);
      Som.pop();
      render(m.id);
      if (Jogo.mundoLiberado(m)) Voz.falar(Falas.mundos.nome(m));
      else { const r = ms.find(x => x.id === m.requer); Voz.falar(r ? Falas.mundos.trancado(r) : Falas.mundoTrancado); }
    }));
  }

  function mapa(m) {
    const box = $('#mapa');
    const W = box.clientWidth || innerWidth, H = box.clientHeight || innerHeight * .6;
    const n = m.fases.length;
    const linhas = n <= 6 ? 1 : n <= 12 ? 2 : n <= 21 ? 3 : 4;
    const cols = Math.ceil(n / linhas);
    const cw = W / cols, ch = H / linhas;
    const tam = Math.max(64, Math.min(124, Math.min(cw, ch) * .66));
    const pos = m.fases.map((f, i) => {
      const r = Math.floor(i / cols), c0 = i % cols, c = r % 2 ? cols - 1 - c0 : c0;
      return [cw * (c + .5), ch * (r + .5) + Math.sin(c * 1.4 + r) * ch * .1 - tam * .08];
    });
    const lib = Jogo.mundoLiberado(m);
    const prox = lib ? Jogo.proxima(null) : null;
    const sugerida = prox && m.fases.some(f => f.id === prox.id) ? prox.id : null;
    let d = '';
    pos.forEach(([x, y], i) => {
      if (!i) { d = `M${x} ${y}`; return; }
      const [px, py] = pos[i - 1];
      d += Math.abs(py - y) > ch * .5 ? `C${px + (x > W / 2 ? 1 : -1) * cw * .6} ${py} ${x + (x > W / 2 ? 1 : -1) * cw * .6} ${y} ${x} ${y}` : `Q${(px + x) / 2} ${(py + y) / 2 - ch * .12} ${x} ${y}`;
    });
    let html = `<svg class="mapa-caminho" width="${W}" height="${H}"><path d="${d}" stroke="rgba(255,255,255,.85)" stroke-width="${tam * .28}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="var(--cor)" stroke-opacity=".35" stroke-width="5" stroke-dasharray="2 14" fill="none" stroke-linecap="round"/></svg>`;
    m.fases.forEach((f, i) => {
      const [x, y] = pos[i];
      const reg = Jogo.estado().fases[f.id], liberada = Jogo.faseLiberada(m, i);
      const est = reg ? reg.estrelas : 0;
      html += `<button class="no ${liberada ? '' : 'trancado'} ${reg ? 'feito' : ''} ${f.id === sugerida ? 'atual' : ''}" data-i="${i}" style="left:${x}px;top:${y}px;--tam:${tam}px">
        <span class="no-bola">${liberada ? Atividades.miniatura(f, m.cor) : Icone.cadeado}</span>
        ${f.id === sugerida ? `<span class="no-mascote">${f.ator}</span>` : ''}
        <span class="no-estrelas">${liberada || reg ? [1, 2, 3].map(k => Icone.estrela(k <= est)).join('') : ''}</span></button>`;
    });
    box.innerHTML = html;
    $$('#mapa .no').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (!Jogo.faseLiberada(m, i)) { Som.nao(); Voz.falar(lib ? Falas.faseTrancada : Falas.mundoTrancado); b.classList.remove('nega'); void b.offsetWidth; b.classList.add('nega'); return; }
      Som.pop();
      App.jogar(m.fases[i]);
    }));
  }

  return { render, atual: () => mundoId };
})();

/* ================= RECOMPENSA ================= */
const Recompensa = (() => {
  /* traço feito de qualquer jeito: não vale, não ganha nada, tenta de novo */
  function naoValeu(fase) {
    Modal.abrir(`<div class="nao-valeu"><div class="nao-valeu-ator">${fase.ator}</div><h2>Quase!</h2>
      <p>Tente de novo, bem em cima da linha pontilhada.</p>
      <div class="botoes-fim">
        <button class="bt-fim voltar" data-a="trilha" aria-label="Voltar para a trilha">⬅️</button>
        <button class="bt-fim repetir" data-a="repetir" aria-label="Tentar de novo">🔄</button>
      </div></div>`, { fixo: true, classe: 'modal-recompensa' });
    Som.nao();
    setTimeout(() => Voz.falar(Falas.tenteDeNovo), 300);
    $$('#modal .bt-fim').forEach(b => b.addEventListener('click', () => {
      Som.pop();
      Modal.fechar();
      if (b.dataset.a === 'repetir') App.jogar(fase);
      else App.ir('trilha', { mundo: Jogo.localizar(fase.id)?.mundo.id });
    }));
  }

  async function mostrar(fase, res) {
    if (!res.estrelas) return naoValeu(fase);
    const rec = Jogo.concluir(fase, res);
    const fim = fase.final;
    const html = `<div class="estrelas-grandes">${[1, 2, 3].map(k => `<span class="estrela-slot ${k <= res.estrelas ? 'ganha' : ''}" style="--d:${k * .35}s">${Icone.estrela(k <= res.estrelas)}</span>`).join('')}</div>
      ${fim ? `<div class="final"><span class="final-grande">${fim.grande}</span><span class="final-emoji">${fim.emoji}</span>${fim.legenda ? `<span class="final-legenda">${fim.legenda}</span>` : ''}</div>` : ''}
      <div class="ganhos">
        <div class="ganho">${Icone.agua}<b>+${rec.agua}</b></div>
        ${rec.adubo ? `<div class="ganho">${Icone.adubo}<b>+${rec.adubo}</b></div>` : ''}
      </div>
      ${rec.presente ? '<div class="selo">🎁 Presente do dia: +1 de água!</div>' : ''}
      ${rec.mundoNovo ? `<div class="selo selo-mundo">${rec.mundoNovo.mascote} Mundo completo! Ganhou uma semente!</div>` : ''}
      <div class="botoes-fim">
        <button class="bt-fim jardim" data-a="jardim" aria-label="Ir para o jardim">🌻</button>
        <button class="bt-fim repetir" data-a="repetir" aria-label="De novo">🔄</button>
        <button class="bt-fim proximo" data-a="proximo" aria-label="Próxima">▶</button>
      </div>`;
    Modal.abrir(html, { fixo: true, classe: 'modal-recompensa' });
    [1, 2, 3].forEach(k => { if (k <= res.estrelas) setTimeout(() => Som.estrela(k - 1), k * 350 + 150); });
    setTimeout(() => {
      Festa.confete(res.estrelas * 45);
      const elogio = res.estrelas >= 2 && Math.random() < .5 ? comNome(Falas.comNome.elogio, null) : null;
      const falas = [elogio || sortear(Falas.ELOGIOS[res.estrelas])];
      if (fim) falas.push(fim.nomeInteiro ? comNome(Falas.comNome.lindo, fim.fala) : fim.fala);
      falas.push(rec.mundoNovo ? Falas.mundos.completo(rec.mundoNovo) : Falas.ganhou(rec.adubo));
      Voz.falar(falas);
    }, res.estrelas * 350 + 400);
    $$('#modal .bt-fim').forEach(b => b.addEventListener('click', () => {
      Som.pop();
      Modal.fechar();
      const a = b.dataset.a;
      if (a === 'jardim') App.ir('jardim');
      else if (a === 'repetir') App.jogar(fase);
      else App.jogar(Jogo.proxima(fase.id));
    }));
  }
  return { mostrar };
})();

/* ================= COLEÇÃO ================= */
const Album = (() => {
  function render() {
    const e = Jogo.estado();
    const tem = Object.keys(e.colecao).length;
    $('#album-conta').textContent = `${tem} de ${Plantas.total}`;
    $('#album-grade').innerHTML = Plantas.ESPECIES.map(s => {
      const pegas = s.var.filter(v => e.colecao[`${s.id}:${v.id}`]);
      const mostrar = pegas[0] || s.var[0];
      return `<button class="carta ${pegas.length ? '' : 'sombra'}" data-id="${s.id}" data-v="${mostrar.id}">
        <span class="carta-planta">${Plantas.svg(s.id, mostrar.id, 1)}</span>
        <span class="carta-nome">${pegas.length ? s.nome : '?'}</span>
        <span class="carta-cores">${s.var.map(v => `<i class="${e.colecao[`${s.id}:${v.id}`] ? 'tem' : ''}" style="--c:${v.cor === 'arco' ? 'conic-gradient(#ff5a5a,#ffd23f,#5cc46a,#3fa9f5,#b388ff,#ff5a5a)' : v.cor}"></i>`).join('')}</span>
        <span class="carta-rar">${'★'.repeat(s.rar)}</span></button>`;
    }).join('');
    $$('#album-grade .carta').forEach(b => b.addEventListener('click', () => {
      const s = Plantas.especie(b.dataset.id);
      Som.pop();
      Voz.falar(b.classList.contains('sombra') ? Falas.naoTem : Falas.plantas.nome(s.id));
    }));
  }
  return { render };
})();

/* ================= DESCANSO (limite diário) ================= */
const Descanso = (() => {
  function mostrar() {
    Modal.abrir(`<div class="descanso"><div class="lua">🌙</div><h2>Hora de descansar!</h2><p>As plantinhas foram dormir. Amanhã tem mais!</p>
      <button class="bt-segurar" id="bt-mais-tempo"><span>Adulto: segure para dar +10 minutos</span></button></div>`, { fixo: true, classe: 'modal-descanso' });
    Voz.falar(Falas.descanso);
    Segurar.ligar($('#bt-mais-tempo'), () => { Jogo.maisTempo(10); Modal.fechar(); avisar('+10 minutos liberados'); });
    App.ir('jardim', { semChecar: true });
  }
  return { mostrar };
})();

/* Botão que só funciona segurando (para adultos) */
const Segurar = {
  ligar(botao, acao, ms = 2200) {
    let t = 0;
    const soltar = () => { clearTimeout(t); botao.classList.remove('segurando'); };
    botao.style.setProperty('--ms', ms + 'ms');
    botao.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      botao.classList.add('segurando');
      t = setTimeout(() => { botao.classList.remove('segurando'); acao(); }, ms);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => botao.addEventListener(n, soltar));
    botao.addEventListener('click', ev => ev.preventDefault());
    botao.addEventListener('contextmenu', ev => ev.preventDefault());
  }
};
