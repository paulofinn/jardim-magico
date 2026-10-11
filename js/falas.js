/* falas.js — tudo o que a voz fala no jogo, num lugar só.
   Cada frase é gravada uma vez com a voz do Gemini (ferramentas/gerar-vozes.mjs) e vira um arquivo
   audio/voz/<hash>.ogg. Por isso as frases não usam o nome da criança: o nome entra só se for gravado
   à parte (gerar-vozes.mjs --nome "Ana"), e o jogo usa essas frases quando elas existem. */

const Falas = (() => {
  const F = {
    regarDica: 'Toque na gotinha para regar!',
    semAgua: 'Acabou a água! Vamos desenhar para ganhar mais?',
    semAdubo: 'Acabou o adubo! Vamos desenhar para ganhar mais?',
    semNada: 'Para ganhar mais água e adubo, toque no lápis e vamos desenhar!',
    toqueSemente: 'Toque na semente!',
    primeiraSemente: 'Vamos plantar o seu jardim! Escolha uma semente!',
    escolhaSemente: 'Escolha uma semente!',
    ganhouInicio: 'Você ganhou água e adubo! Toque na plantinha para regar!',
    escolhaFase: 'Escolha a fase que está pulando!',
    colecao: 'Sua coleção de plantas!',
    naoTem: 'Essa você ainda não tem! Continue cuidando do jardim!',
    faseTrancada: 'Ainda não! Primeiro faça a fase que está pulando!',
    mundoTrancado: 'Este mundo ainda está trancado!',
    descanso: 'Hora de descansar! As plantinhas foram dormir. Amanhã tem mais!',
    oi: 'Oi!',
    oiSemente: 'Tem uma semente esperando por você!',
    oiAgua: 'Suas plantinhas estão esperando água!',
    oiDesenhar: 'Vamos desenhar para ganhar água e adubo?',
    proximo: 'Agora o próximo!',
    ganhouAgua: 'Você ganhou água para o seu jardim!',
    ganhouAguaAdubo: 'Você ganhou água e adubo para o seu jardim!',
    teste: 'Olá! Vamos cuidar do jardim?'
  };

  const ELOGIOS = {
    3: ['Perfeito!', 'Uau, que caprichado!', 'Você é demais!', 'Ficou lindo!', 'Arrasou!', 'Que traço bonito!'],
    2: ['Muito bem!', 'Ótimo trabalho!', 'Mandou bem!', 'Que legal!', 'Bom demais!'],
    1: ['Conseguiu! Na próxima, tente ficar no caminho!', 'Muito bem! Vamos treinar mais um pouquinho?', 'Boa! Você está aprendendo!']
  };

  const art = eid => Plantas.especie(eid).art;
  const Art = eid => art(eid).toUpperCase();
  const minus = t => t.toLowerCase();

  const plantas = {
    grandona: eid => `${Art(eid)} ${minus(Plantas.especie(eid).nome)} já está ${art(eid) === 'o' ? 'grandão' : 'grandona'}!`,
    cresceu: eid => `Uau! ${Art(eid)} ${minus(Plantas.especie(eid).nome)} cresceu! E deu uma semente! Toque na semente!`,
    escolheu: (eid, vid) => `${Art(eid)} ${minus(Plantas.nomeCompleto(eid, vid))}! Vamos plantar!`,
    nome: eid => `${Plantas.especie(eid).nome}!`
  };
  const mundos = {
    nome: m => `${m.nome}!`,
    trancado: req => `Ainda está trancado! Primeiro termine o mundo ${req.de}.`,
    completo: m => `Você completou o mundo ${m.de}! Ganhou uma semente especial!`
  };
  const dica = fase => `Comece ${fase.comece || 'por aqui'}!`;
  const ganhou = adubo => adubo ? F.ganhouAguaAdubo : F.ganhouAgua;

  /* frases com o nome da criança (só tocam se tiverem sido gravadas) */
  const comNome = {
    oi: n => `Oi, ${n}!`,
    elogio: n => `Muito bem, ${n}!`,
    parabens: n => `Parabéns, ${n}!`,
    lindo: n => `${n}! Que nome lindo!`
  };

  /* todas as frases que precisam de áudio (o gerador lê isto) */
  function todas(nome = '') {
    const s = new Set(Object.values(F));
    Object.values(ELOGIOS).flat().forEach(t => s.add(t));
    for (const e of Plantas.ESPECIES) {
      s.add(plantas.grandona(e.id)); s.add(plantas.cresceu(e.id)); s.add(plantas.nome(e.id));
      e.var.forEach(v => s.add(plantas.escolheu(e.id, v.id)));
    }
    const ms = [...Atividades.mundos(''), Atividades.mundoNomeExemplo()];
    for (const m of ms) {
      s.add(mundos.nome(m)); s.add(mundos.completo(m));
      const req = ms.find(x => x.id === m.requer);
      if (req) s.add(mundos.trancado(req));
      for (const f of m.fases) { s.add(f.fala); s.add(dica(f)); if (f.final) s.add(f.final.fala); }
    }
    Atividades.falasDoNome().forEach(t => s.add(t));
    const n = (nome || '').trim().split(/\s+/)[0];
    if (n) Object.values(comNome).forEach(fn => s.add(fn(n)));
    return [...s];
  }

  /* nome do arquivo de cada frase: FNV-1a de 32 bits do texto (igual no jogo e no gerador) */
  function hash(t) {
    const b = new TextEncoder().encode(String(t).trim());
    let h = 0x811c9dc5;
    for (const x of b) { h ^= x; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }

  return { ...F, ELOGIOS, plantas, mundos, dica, ganhou, comNome, todas, hash };
})();
