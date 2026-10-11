/* jogo.js — estado salvo no aparelho e as regras: recompensas, crescimento, sementes, fases liberadas. */

const Jogo = (() => {
  const CHAVE = 'jardim-magico-v1';
  const PONTOS = { agua: 10, adubo: 25 };          // quanto cada item faz a planta crescer
  const PRECISA = { 1: 150, 2: 240, 3: 330, 4: 450 }; // pontos até a planta ficar adulta, por raridade
  const RITMO = { devagar: 1.5, normal: 1, rapido: .65 }; // ajuste dos pais: quanto a planta demora para crescer
  const RAIO = [.1, .078, .06, .045];               // largura do caminho por dificuldade (fração do lado menor da tela)

  const padrao = () => ({
    versao: 1, nome: '', agua: 0, adubo: 0, plantas: [], proxId: 1, colecao: {}, fases: {}, mundosOk: {},
    sementesExtra: 0, auto: 1, canetaVista: false, totalAtividades: 0, historico: {},
    dia: { data: hoje(), minutos: 0, atividades: 0, presente: false, extra: 0 },
    ajustes: { dificuldade: 1, voz: true, sons: true, dedo: 'auto', liberarTudo: false, limiteMin: 0, ritmo: 'normal' },
    tutorial: { regou: false }, criado: Date.now()
  });
  let e = padrao();

  function carregar() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CHAVE)); } catch {}
    e = Object.assign(padrao(), d || {});
    e.ajustes = Object.assign(padrao().ajustes, e.ajustes || {});
    e.tutorial = Object.assign(padrao().tutorial, e.tutorial || {});
    virarDia();
    return e;
  }
  let tSalvar = 0;
  function salvar() { clearTimeout(tSalvar); tSalvar = setTimeout(salvarJa, 120); }
  function salvarJa() { clearTimeout(tSalvar); try { localStorage.setItem(CHAVE, JSON.stringify(e)); } catch {} }
  function virarDia() { if (e.dia.data !== hoje()) e.dia = { data: hoje(), minutos: 0, atividades: 0, presente: false, extra: 0 }; }

  /* ---------- fases e mundos ---------- */
  const mundos = () => Atividades.mundos(e.nome);
  const feita = id => !!e.fases[id];
  const mundoCompleto = m => !!m && m.fases.every(f => feita(f.id));
  function mundoLiberado(m) {
    if (e.ajustes.liberarTudo || !m.requer) return true;
    return mundoCompleto(mundos().find(x => x.id === m.requer));
  }
  function faseLiberada(m, i) {
    if (!mundoLiberado(m)) return false;
    return e.ajustes.liberarTudo || i === 0 || feita(m.fases[i - 1].id);
  }
  function localizar(id) {
    for (const m of mundos()) { const i = m.fases.findIndex(f => f.id === id); if (i >= 0) return { mundo: m, indice: i, fase: m.fases[i] }; }
    return null;
  }
  function primeiraPendente(m) {
    const i = m.fases.findIndex((f, k) => !feita(f.id) && faseLiberada(m, k));
    return i >= 0 ? m.fases[i] : null;
  }
  /* próxima fase sugerida: segue no mundo atual; depois procura nos outros; se tudo feito, treino livre */
  function proxima(depoisDe) {
    const loc = depoisDe ? localizar(depoisDe) : null;
    if (loc) {
      const { mundo: m, indice } = loc;
      for (let k = indice + 1; k < m.fases.length; k++) if (!feita(m.fases[k].id) && faseLiberada(m, k)) return m.fases[k];
      const p = primeiraPendente(m); if (p) return p;
    }
    for (const m of mundos()) { if (!mundoLiberado(m)) continue; const p = primeiraPendente(m); if (p) return p; }
    const todas = mundos().flatMap(m => m.fases.filter((f, k) => faseLiberada(m, k)));
    return sortear(todas.filter(f => f.id !== depoisDe)) || todas[0];
  }
  function mundoSugerido() {
    const p = proxima(null);
    return (p && localizar(p.id)?.mundo) || mundos()[0];
  }

  function concluir(fase, res) {
    const reg = e.fases[fase.id] || { estrelas: 0, vezes: 0 };
    const nova = reg.vezes === 0;
    reg.vezes++; reg.estrelas = Math.max(reg.estrelas, res.estrelas); reg.ultima = Date.now();
    e.fases[fase.id] = reg;

    // pouco por atividade, para ela treinar bastante: 1★ = 1 água · 2★ = 2 águas · 3★ = 2 águas + 1 adubo
    let agua = res.estrelas >= 2 ? 2 : 1, adubo = res.estrelas === 3 ? 1 : 0;
    let presente = false;
    virarDia();
    if (!e.dia.presente) { e.dia.presente = true; presente = true; agua += 1; }
    e.agua += agua; e.adubo += adubo;
    e.dia.atividades++; e.totalAtividades++;
    const h = e.historico[e.dia.data] || (e.historico[e.dia.data] = { atividades: 0, estrelas: 0, minutos: 0 });
    h.atividades++; h.estrelas += res.estrelas;

    // o jogo se ajusta sozinho: caminho afina quando vai muito bem, alarga quando está difícil
    if (res.estrelas === 3) e.auto = Math.max(.82, e.auto * .97);
    else if (res.estrelas === 1) e.auto = Math.min(1.3, e.auto * 1.07);

    let mundoNovo = null;
    const loc = localizar(fase.id);
    if (loc && !e.mundosOk[loc.mundo.id] && mundoCompleto(loc.mundo)) { e.mundosOk[loc.mundo.id] = true; e.sementesExtra++; mundoNovo = loc.mundo; }
    salvar();
    return { agua, adubo, nova, presente, mundoNovo };
  }

  /* ---------- plantas ---------- */
  const precisa = p => Math.round(PRECISA[Plantas.especie(p.especie).rar] * (RITMO[e.ajustes.ritmo] || 1));
  const fracao = p => p.madura ? 1 : Math.min(1, p.pts / precisa(p));
  const planta = id => e.plantas.find(p => p.id === id);

  function usar(id, tipo) {
    const p = planta(id);
    if (!p) return { erro: 'sumiu' };
    if (p.madura) return { erro: 'madura' };
    if (e[tipo] <= 0) return { erro: 'falta' };
    e[tipo]--;
    const antes = fracao(p);
    p.pts = Math.min(precisa(p), p.pts + PONTOS[tipo]);
    const depois = fracao(p);
    let madurou = false;
    if (depois >= 1) { p.madura = true; p.semente = 'pronta'; madurou = true; e.colecao[`${p.especie}:${p.variante}`] = true; }
    if (tipo === 'agua') e.tutorial.regou = true;
    salvar();
    return { antes, depois, madurou };
  }

  function oferta(primeira = false) {
    const maduras = e.plantas.filter(p => p.madura).length;
    const maxRar = primeira ? 1 : maduras >= 8 ? 4 : maduras >= 4 ? 3 : maduras >= 1 ? 2 : 1;
    const crescendo = new Set(e.plantas.filter(p => !p.madura).map(p => p.especie));
    let cand = Plantas.ESPECIES.filter(s => s.rar <= maxRar).map(s => {
      const faltam = s.var.filter(v => !e.colecao[`${s.id}:${v.id}`]);
      let peso = (faltam.length ? 4 : 1) * ({ 1: 1, 2: 1, 3: .85, 4: .7 })[s.rar];
      if (s.rar === maxRar && maxRar > 1) peso *= 1.6;
      if (crescendo.has(s.id)) peso *= .3;
      return { s, faltam, peso };
    });
    const escolha = [];
    while (escolha.length < 3 && cand.length) {
      const tot = cand.reduce((n, c) => n + c.peso, 0);
      let r = Math.random() * tot, i = 0;
      while (i < cand.length - 1 && (r -= cand[i].peso) > 0) i++;
      escolha.push(cand[i]); cand.splice(i, 1);
    }
    return escolha.map(({ s, faltam }) => ({ especie: s.id, variante: (faltam.length ? sortear(faltam) : sortear(s.var)).id, rar: s.rar }));
  }

  function plantar(especie, variante) {
    const p = { id: e.proxId++, especie, variante, pts: 0, madura: false, semente: null, data: Date.now() };
    e.plantas.push(p);
    salvar();
    return p;
  }
  function colher(id) { const p = planta(id); if (p && p.semente === 'pronta') { p.semente = 'colhida'; salvar(); return true; } return false; }
  function usarSementeExtra() { if (e.sementesExtra > 0) { e.sementesExtra--; salvar(); return true; } return false; }
  function presente(agua, adubo) { e.agua += agua; e.adubo += adubo; salvar(); }

  /* ---------- tempo de tela ---------- */
  function somarMinutos(min) {
    virarDia();
    e.dia.minutos += min;
    const h = e.historico[e.dia.data] || (e.historico[e.dia.data] = { atividades: 0, estrelas: 0, minutos: 0 });
    h.minutos = (h.minutos || 0) + min;
    salvar();
  }
  const tempoEsgotado = () => { virarDia(); return e.ajustes.limiteMin > 0 && e.dia.minutos >= e.ajustes.limiteMin + e.dia.extra; };
  function maisTempo(min) { e.dia.extra = Math.max(0, e.dia.minutos - e.ajustes.limiteMin) + min; salvar(); }

  /* ---------- pais ---------- */
  function exportar() { return JSON.stringify(e, null, 1); }
  function importar(txt) {
    const d = JSON.parse(txt);
    if (!d || typeof d !== 'object' || !Array.isArray(d.plantas) || typeof d.fases !== 'object') throw new Error('Arquivo não parece ser um backup do Jardim Mágico.');
    localStorage.setItem(CHAVE, JSON.stringify(d));
    carregar();
  }
  function zerar() { const { nome, ajustes, canetaVista } = e; e = Object.assign(padrao(), { nome, ajustes, canetaVista }); salvarJa(); }

  return {
    carregar, salvar, salvarJa, estado: () => e,
    mundos, mundoLiberado, mundoCompleto, faseLiberada, localizar, proxima, mundoSugerido, concluir, feita,
    fracao, planta, usar, oferta, plantar, colher, usarSementeExtra, presente,
    somarMinutos, tempoEsgotado, maisTempo, exportar, importar, zerar,
    raio: () => RAIO[e.ajustes.dificuldade] * e.auto,
    marcarCaneta() { if (!e.canetaVista) { e.canetaVista = true; salvar(); } }
  };
})();
