/* pais.js — área dos pais: nome, dificuldade, caneta, tempo por dia, progresso e backup. */

const Pais = (() => {
  const DIFS = ['Bem fácil', 'Fácil', 'Médio', 'Desafio'];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function ultimosDias(n = 7) {
    const e = Jogo.estado(), dias = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = hoje(d), h = e.historico[k] || { atividades: 0, minutos: 0 };
      dias.push({ rotulo: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), ...h });
    }
    return dias;
  }

  function render() {
    const e = Jogo.estado(), a = e.ajustes;
    const dias = ultimosDias();
    const max = Math.max(1, ...dias.map(d => d.atividades));
    const mundos = Jogo.mundos().map(m => {
      const feitas = m.fases.filter(f => Jogo.feita(f.id));
      const est = feitas.reduce((n, f) => n + e.fases[f.id].estrelas, 0);
      return `<tr><td>${m.mascote} ${m.nome}</td><td>${feitas.length}/${m.fases.length}</td><td>${est ? (est / feitas.length).toFixed(1) + ' ★' : '—'}</td></tr>`;
    }).join('');
    const maduras = e.plantas.filter(p => p.madura).length;

    $('#pais-conteudo').innerHTML = `
      <div class="pais-topo"><h1>Área dos pais</h1><button class="bt-primario" id="pais-sair">Voltar ao jogo</button></div>

      <section class="pais-sec">
        <h2>Criança</h2>
        <label class="campo">Nome (aparece nas falas e vira o mundo "Meu nome")
          <input id="p-nome" maxlength="24" value="${esc(e.nome)}" autocomplete="off"></label>
      </section>

      <section class="pais-sec">
        <h2>Largura do caminho</h2>
        <div class="seg" id="p-dif">${DIFS.map((d, i) => `<button data-v="${i}" class="${a.dificuldade === i ? 'on' : ''}">${d}</button>`).join('')}</div>
        <p class="dica">O jogo também se ajusta sozinho: afina quando ela acerta muito e alarga quando está difícil. Ajuste automático agora: <b>${Math.round(e.auto * 100)}%</b> <button class="link" id="p-auto">voltar a 100%</button></p>
      </section>

      <section class="pais-sec">
        <h2>Ritmo do jardim</h2>
        <div class="seg" id="p-ritmo">${[['devagar', 'Devagar'], ['normal', 'Normal'], ['rapido', 'Rápido']].map(([v, t]) => `<button data-v="${v}" class="${a.ritmo === v ? 'on' : ''}">${t}</button>`).join('')}</div>
        <p class="dica">Cada atividade dá pouco: 1★ = 1 água · 2★ = 2 águas · 3★ = 2 águas + 1 adubo (+1 água na primeira do dia). No ritmo Normal uma planta comum precisa de umas 5 atividades e uma mágica, de umas 15. "Devagar" pede 50% mais treino por planta; "Rápido", uns 35% menos.</p>
      </section>

      <section class="pais-sec">
        <h2>Caneta</h2>
        <div class="seg seg-col" id="p-dedo">
          <button data-v="auto" class="${a.dedo === 'auto' ? 'on' : ''}">Automático (recomendado): se a caneta for usada, dedo e palma da mão não desenham</button>
          <button data-v="sim" class="${a.dedo === 'sim' ? 'on' : ''}">Aceitar dedo também</button>
          <button data-v="nao" class="${a.dedo === 'nao' ? 'on' : ''}">Só caneta ativa (S Pen e similares)</button>
        </div>
        <p class="dica">Caneta detectada neste aparelho: <b>${e.canetaVista ? 'sim' : 'ainda não'}</b>. Canetas "de borrachinha" (passivas) funcionam como dedo: nesse caso use "Aceitar dedo também".</p>
      </section>

      <section class="pais-sec">
        <h2>Som e voz</h2>
        <label class="chave"><input type="checkbox" id="p-voz" ${a.voz ? 'checked' : ''}> Voz que explica as atividades</label>
        <label class="chave"><input type="checkbox" id="p-sons" ${a.sons ? 'checked' : ''}> Sons e música</label>
        <button class="bt-sec" id="p-testar">Testar voz</button>
        <p class="dica">Falas gravadas: <b>${Voz.total()}</b> (voz feminina do Google Gemini, gravada uma vez e guardada no app; funciona sem internet).</p>
      </section>

      <section class="pais-sec">
        <h2>Tempo por dia</h2>
        <div class="seg" id="p-limite">${[0, 10, 15, 20, 30, 45].map(v => `<button data-v="${v}" class="${a.limiteMin === v ? 'on' : ''}">${v ? v + ' min' : 'Sem limite'}</button>`).join('')}</div>
        <p class="dica">Hoje: <b>${Math.round(e.dia.minutos)} min</b> de jogo, ${e.dia.atividades} atividades. Ao chegar no limite aparece "Hora de descansar" (adulto segura o botão para liberar +10 min).</p>
      </section>

      <section class="pais-sec">
        <h2>Progresso</h2>
        <div class="grafico">${dias.map(d => `<div class="barra-dia"><i style="height:${Math.round(d.atividades / max * 100)}%"></i><b>${d.atividades}</b><span>${d.rotulo}</span></div>`).join('')}</div>
        <p class="dica">Atividades por dia (últimos 7 dias). Total: <b>${e.totalAtividades}</b> atividades · <b>${e.plantas.length}</b> plantas (${maduras} adultas) · coleção <b>${Object.keys(e.colecao).length}/${Plantas.total}</b>.</p>
        <table class="tabela"><thead><tr><th>Mundo</th><th>Fases</th><th>Média</th></tr></thead><tbody>${mundos}</tbody></table>
        <label class="chave"><input type="checkbox" id="p-liberar" ${a.liberarTudo ? 'checked' : ''}> Liberar todas as fases (sem precisar seguir a ordem)</label>
      </section>

      <section class="pais-sec">
        <h2>Presentear</h2>
        <p class="dica">Para premiar algo feito fora do tablet (ex.: escreveu no caderno).</p>
        <button class="bt-sec" id="p-dar">Dar 3 de água e 1 de adubo</button>
      </section>

      <section class="pais-sec">
        <h2>Salvamento e backup</h2>
        <p class="dica">Salva sozinho no tablet a cada ação (fechar o app ou desligar o tablet não perde nada). Só se perde se alguém <b>limpar os dados do Chrome/app</b> ou desinstalar, então exporte um backup de vez em quando.
          Proteção contra limpeza automática do Android: <b id="p-persist">verificando…</b></p>
        <button class="bt-sec" id="p-exportar">Exportar</button>
        <label class="bt-sec">Importar<input type="file" id="p-importar" accept="application/json,.json" hidden></label>
        <button class="bt-perigo" id="p-zerar">Zerar progresso</button>
      </section>`;

    const salvar = () => { Jogo.salvar(); App.aplicarAjustes(); };
    $('#pais-sair').onclick = () => { App.ir('jardim'); };
    $('#p-nome').onchange = ev => { e.nome = ev.target.value.trim(); salvar(); avisar('Nome salvo'); };
    seg('#p-dif', v => { a.dificuldade = +v; salvar(); });
    $('#p-auto').onclick = () => { e.auto = 1; salvar(); render(); };
    seg('#p-dedo', v => { a.dedo = v; salvar(); });
    seg('#p-limite', v => { a.limiteMin = +v; e.dia.extra = 0; salvar(); });
    $('#p-voz').onchange = ev => { a.voz = ev.target.checked; salvar(); };
    $('#p-sons').onchange = ev => { a.sons = ev.target.checked; salvar(); };
    $('#p-testar').onclick = () => { Voz.ligar(true); Voz.falar(Falas.teste); App.aplicarAjustes(); };
    $('#p-liberar').onchange = ev => { a.liberarTudo = ev.target.checked; salvar(); };
    seg('#p-ritmo', v => { a.ritmo = v; salvar(); });
    $('#p-dar').onclick = () => { Jogo.presente(3, 1); avisar('Presente entregue! 💧+3  adubo+1'); };
    (navigator.storage?.persisted?.() || Promise.resolve(false)).then(ok => { const b = $('#p-persist'); if (b) b.textContent = ok ? 'ativada ✔' : 'não ativada (ative instalando o app na tela inicial)'; });
    $('#p-exportar').onclick = exportar;
    $('#p-importar').onchange = importar;
    $('#p-zerar').onclick = () => {
      if (!confirm('Apagar plantas, coleção e fases? (Nome e ajustes ficam.)')) return;
      if (!confirm('Tem certeza? Não dá para desfazer (a não ser com um backup exportado).')) return;
      Jogo.zerar(); avisar('Progresso zerado'); render();
    };
  }

  function seg(sel, aoMudar) {
    $$(sel + ' button').forEach(b => b.addEventListener('click', () => {
      $$(sel + ' button').forEach(x => x.classList.toggle('on', x === b));
      aoMudar(b.dataset.v);
    }));
  }

  function exportar() {
    const blob = new Blob([Jogo.exportar()], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `jardim-magico-backup-${hoje()}.json` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importar(ev) {
    const f = ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { Jogo.importar(r.result); App.aplicarAjustes(); avisar('Backup restaurado!'); render(); }
      catch (err) { alert(err.message || 'Não consegui ler esse arquivo.'); }
    };
    r.readAsText(f);
  }

  return { render };
})();
