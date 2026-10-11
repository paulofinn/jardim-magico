/* app.js — abertura, navegação entre telas, tempo de jogo e instalação offline. */

const App = (() => {
  let tela = 'inicio', faseAtual = null;
  const TELAS_DE_JOGO = ['jardim', 'trilha', 'traco', 'album'];

  function aplicarAjustes() {
    const a = Jogo.estado().ajustes;
    Som.ligar(a.sons);
    Voz.ligar(a.voz);
  }

  function ir(id, { semChecar = false, mundo = null } = {}) {
    if (!semChecar && id !== 'pais' && id !== 'inicio' && Jogo.tempoEsgotado()) { Descanso.mostrar(); return; }
    if (tela === 'traco' && id !== 'traco') { Traco.parar(); TelaAcesa.soltar(); }
    if (id !== tela) Voz.parar();
    tela = id;
    $$('.tela').forEach(t => t.classList.toggle('ativa', t.id === 'tela-' + id));
    if (id === 'jardim') Jardim.render();
    else if (id === 'trilha') Trilha.render(mundo || Jogo.mundoSugerido().id);
    else if (id === 'album') Album.render();
    else if (id === 'pais') Pais.render();
  }

  function jogar(fase) {
    if (!fase) return ir('trilha');
    if (Jogo.tempoEsgotado()) { Descanso.mostrar(); return; }
    faseAtual = fase;
    const loc = Jogo.localizar(fase.id);
    ir('traco', { semChecar: true });
    $('#tela-traco').style.setProperty('--fundo', loc ? loc.mundo.fundo : '#fffaf0');
    pontos(fase, 0);
    const e = Jogo.estado();
    Traco.iniciar(fase, {
      raio: Jogo.raio(), dedo: e.ajustes.dedo, canetaVista: e.canetaVista,
      aoVerCaneta: () => Jogo.marcarCaneta(),
      aoEvento: (tipo, x) => {
        if (tipo === 'dica') Voz.falar(Falas.dica(fase));
        else if (tipo === 'traco') { pontos(fase, x); if (x === 1 && fase.tracos.length > 1) Voz.falar(Falas.proximo); }
        else if (tipo === 'fim') pontos(fase, fase.tracos.length);
      },
      aoFim: res => Recompensa.mostrar(fase, res)
    });
    setTimeout(() => { if (tela === 'traco') Voz.falar(fase.fala); }, 350);
    TelaAcesa.pedir();
  }

  function pontos(fase, feitos) {
    const n = fase.tracos.length;
    $('#traco-pontos').innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<i class="${i < feitos ? 'ok' : i === feitos ? 'agora' : ''}"></i>`).join('') : '';
  }

  /* ---------- abertura ---------- */
  function abertura() {
    const e = Jogo.estado();
    const amostra = [['girassol', 'amarelo'], ['tulipa', 'vermelha'], ['margarida', 'rosa'], ['estrela', 'dourada'], ['hortensia', 'azul']];
    $('#inicio-plantas').innerHTML = amostra.map(([s, v], i) => `<div class="inicio-planta p${i}">${Plantas.svg(s, v, 1)}</div>`).join('');
    const primeira = !e.plantas.length && !e.totalAtividades;
    $('#inicio-nome').hidden = !primeira || !!e.nome;
    $('#bt-comecar').addEventListener('click', comecar);
  }

  async function comecar() {
    Som.destravar();
    const e = Jogo.estado();
    const campo = $('#campo-nome');
    if (!$('#inicio-nome').hidden && campo.value.trim()) { e.nome = campo.value.trim(); Jogo.salvar(); }
    telaCheia();
    history.pushState({ jardim: 1 }, ''); // com toque do usuário o Chrome respeita a trava do botão voltar
    Som.pop();
    ir('jardim');
    if (!e.plantas.length) {
      await esperar(500);
      Escolha.abrir({ primeira: true });
    } else {
      const pronta = e.plantas.some(p => p.semente === 'pronta');
      const fala = pronta ? Falas.oiSemente : (e.agua || e.adubo) ? Falas.oiAgua : Falas.oiDesenhar;
      setTimeout(() => Voz.falar([comNome(Falas.comNome.oi, Falas.oi), fala]), 400);
      if (!e.agua && !e.adubo) Jardim.chamarBrincar();
    }
  }

  function telaCheia() {
    const instalado = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    if (!instalado && document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
    } else screen.orientation?.lock?.('landscape').catch(() => {});
  }

  /* ---------- botões fixos ---------- */
  function ligarBotoes() {
    $('#bt-brincar').addEventListener('click', () => { Som.pop(); Jardim.fecharAcoes(); ir('trilha'); Voz.falar(Falas.escolhaFase); });
    $('#bt-album').addEventListener('click', () => { Som.pop(); ir('album'); Voz.falar(Falas.colecao); });
    $('#bt-semente-extra').addEventListener('click', () => { Som.magia(); Escolha.abrir({ extra: true }); });
    Segurar.ligar($('#bt-pais'), () => ir('pais'), 2500);
    $('#bt-pais').addEventListener('pointerup', () => { if (tela === 'jardim') avisar('Área dos pais: segure o botão por 3 segundos'); });
    $('#bt-trilha-jardim').addEventListener('click', () => { Som.pop(); ir('jardim'); });
    $('#bt-album-voltar').addEventListener('click', () => { Som.pop(); ir('jardim'); });
    $('#bt-traco-voltar').addEventListener('click', () => { Som.pop(); ir('trilha', { mundo: faseAtual && Jogo.localizar(faseAtual.id)?.mundo.id }); });
    $('#bt-traco-ouvir').addEventListener('click', () => { if (faseAtual) Voz.falar(faseAtual.fala); });
    $('#bt-traco-refazer').addEventListener('click', () => { Som.pop(); if (faseAtual) jogar(faseAtual); });
    // fecha o balão de regar ao tocar fora das plantas
    $('#tela-jardim').addEventListener('click', ev => { if (!ev.target.closest('.canteiro')) Jardim.fecharAcoes(); });
  }

  /* botão "voltar" do Android: não fecha o app, volta para o jardim */
  function prenderVoltar() {
    history.pushState({ jardim: 1 }, '');
    addEventListener('popstate', () => {
      history.pushState({ jardim: 1 }, '');
      if (Modal.aberto()) { if (!$('#modal').dataset.fixo) Modal.fechar(); return; }
      if (tela === 'traco') ir('trilha');
      else if (tela !== 'jardim' && tela !== 'inicio') ir('jardim', { semChecar: true });
    });
  }

  function contarTempo() {
    setInterval(() => {
      if (document.visibilityState === 'visible' && TELAS_DE_JOGO.includes(tela)) Jogo.somarMinutos(.25);
    }, 15000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { Jogo.salvarJa(); Voz.parar(); }
      else if (tela === 'traco') TelaAcesa.pedir();
    });
    addEventListener('pagehide', () => Jogo.salvarJa());
  }

  function iniciar() {
    Jogo.carregar();
    aplicarAjustes();
    Traco.montar($('#cv-traco'));
    ligarBotoes();
    abertura();
    prenderVoltar();
    contarTempo();
    document.addEventListener('contextmenu', ev => { if (!ev.target.closest('input, textarea')) ev.preventDefault(); });
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
    // pede ao Android para nunca apagar os dados do jogo sozinho quando faltar espaço (no Chrome não aparece pergunta)
    navigator.storage?.persist?.().catch(() => {});
  }

  return { iniciar, ir, jogar, aplicarAjustes, tela: () => tela };
})();

App.iniciar();
