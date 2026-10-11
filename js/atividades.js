/* atividades.js — todas as fases de traçado, das linhas retas até o nome da criança.
   Cada traço é um caminho SVG (ou uma lista de pontos) dentro da caixa vb=[largura, altura].
   Os traços de cada fase são feitos na ordem, como se ensina a escrever. */

const Atividades = (() => {
  const Q = [100, 100]; // caixa quadrada (letras, números, formas)

  /* ---------- caminhos gerados por fórmula ---------- */
  function espiral() {
    const pts = [];
    for (let i = 0; i <= 420; i++) {
      const t = i / 420, a = -Math.PI / 2 + t * 2.15 * Math.PI * 2, r = 44 - 38 * t;
      pts.push([80 + r * Math.cos(a) * 1.3, 52 + r * Math.sin(a)]);
    }
    return pts;
  }
  function lacos() {
    const pts = [], voltas = 3, A = 6.2, B = 15, C = 30;
    for (let i = 0; i <= 600; i++) {
      const u = Math.PI + (i / 600) * voltas * 2 * Math.PI;
      pts.push([2 + A * u - B * Math.sin(u), 52 - C * Math.cos(u)]);
    }
    return pts;
  }

  /* fase: id, caixa, traços, personagem, alvo, frase falada, "comece pela/pelo ..." */
  const F = (id, vb, tracos, ator, alvo, fala, comece, extra = {}) => ({ id, vb, tracos, ator, alvo, fala, comece, ...extra });

  const LINHAS = [
    F('li1', [160, 100], ['M45 50H115'], '🐝', '🌸', 'Leve a abelha até a flor!', 'pela abelha'),
    F('li2', [160, 100], ['M14 50H146'], '🐌', '🥬', 'Leve o caracol até a folhinha!', 'pelo caracol'),
    F('li3', [160, 100], ['M80 16V84'], '💧', '🌱', 'Faça a chuva cair na plantinha!', 'pela gotinha'),
    F('li4', [160, 100], ['M80 6V94'], '🍎', '🧺', 'A maçã caiu! Leve até a cesta!', 'pela maçã'),
    F('li5', [160, 100], ['M20 32H140', 'M20 68H140'], '🚗', '🏠', 'Leve os carrinhos até a casa!', 'pelo carrinho'),
    F('li6', [160, 100], ['M40 14V86', 'M80 14V86', 'M120 14V86'], '💧', '🌱', 'Chuva! Molhe as três plantinhas!', 'pela gotinha'),
    F('li7', [160, 100], ['M24 14L136 86'], '🐧', '🐟', 'O pinguim vai escorregar até o peixe!', 'pelo pinguim'),
    F('li8', [160, 100], ['M24 86L136 14'], '🚀', '🌙', 'Leve o foguete até a lua!', 'pelo foguete'),
    F('li9', [160, 100], ['M36 12V86H128'], '🐭', '🧀', 'Ajude o ratinho a achar o queijo!', 'pelo ratinho'),
    F('li10', [160, 100], ['M16 88H46V64H76V40H106V16H144'], '🐻', '🍯', 'Suba a escada com o ursinho!', 'pelo ursinho'),
    F('li11', Q, ['M50 10V90', 'M10 50H90'], '🐞', '⭐', 'Faça uma cruz! Primeiro de cima para baixo.', 'pela joaninha')
  ];

  const CURVAS = [
    F('cu1', [160, 100], ['M30 78A50 50 0 0 1 130 78'], '🐸', '🍀', 'Pule com o sapo!', 'pelo sapo'),
    F('cu2', [160, 100], ['M12 76C45 76 50 22 80 22C110 22 115 76 148 76'], '🐰', '🥕', 'Ajude o coelho a pular o morro!', 'pelo coelho'),
    F('cu3', [160, 100], ['M30 16C30 106 130 106 130 16'], '🛹', '⭐', 'Desce e sobe com o skate!', 'pelo skate'),
    F('cu4', [160, 100], ['M15 50Q47.5 6 80 50T145 50'], '🐬', '🐠', 'Pule as ondas com o golfinho!', 'pelo golfinho'),
    F('cu5', [160, 100], ['M10 50Q27.5 16 45 50T80 50T115 50T150 50'], '🦆', '🐥', 'O patinho nadando nas ondinhas!', 'pelo patinho'),
    F('cu6', Q, ['M73 22A36 36 0 1 0 73 78'], '🐛', '🍎', 'Faça uma curva com a lagarta!', 'pela lagarta'),
    F('cu7', Q, ['M50 12A38 38 0 0 0 50 88A38 38 0 0 0 50 12'], '🐞', '🌼', 'Dê uma volta bem redondinha!', 'pela joaninha'),
    F('cu8', [160, 100], [{ pts: espiral() }], '🐌', '🍓', 'Faça um caracol até o morango!', 'pelo caracol'),
    F('cu9', [160, 100], ['M25 78A55 55 0 0 1 135 78', 'M37 78A43 43 0 0 1 123 78', 'M49 78A31 31 0 0 1 111 78'], '☁️', '☀️', 'Pinte o arco-íris!', 'pela nuvem', { cores: ['#ff5a5a', '#ffc21f', '#3fa9f5'] }),
    F('cu10', [160, 100], [{ pts: lacos() }], '✈️', '☁️', 'O avião vai dar piruetas!', 'pelo avião')
  ];

  const ZIGUE = [
    F('zz1', [160, 100], ['M20 84L80 16L140 84'], '🐐', '🌼', 'Suba e desça a montanha!', 'pela cabrinha'),
    F('zz2', [160, 100], ['M15 80L47.5 20L80 80L112.5 20L145 80'], '🦘', '⭐', 'Pule com o canguru!', 'pelo canguru'),
    F('zz3', [160, 100], ['M8 72L25 28L42 72L59 28L76 72L93 28L110 72L127 28L144 72'], '🦖', '🥚', 'O dinossauro vai buscar o ovo!', 'pelo dinossauro'),
    F('zz4', Q, ['M60 6L36 34L66 54L34 94'], '🍂', '🦔', 'A folha cai balançando até o ouriço!', 'pela folha'),
    F('zz5', [160, 100], ['M8 74V34H34V74H60V34H86V74H112V34H138V74H152'], '🐴', '🏰', 'Cavalgue até o castelo!', 'pelo cavalinho'),
    F('zz6', [160, 100], ['M15 80L45 22V80L75 22V80L105 22V80L135 22V80'], '🦈', '⭐', 'Faça as barbatanas do tubarão!', 'pelo tubarão'),
    F('zz7', Q, ['M14 86V30L32 56L50 22L68 56L86 30V86H14'], '🐞', '👑', 'Desenhe a coroa do rei!', 'pela joaninha')
  ];

  const FORMAS = [
    F('fo1', Q, ['M50 10A40 40 0 0 0 50 90A40 40 0 0 0 50 10'], '⚽', '🥅', 'Desenhe uma bola bem redonda!', 'pela bola'),
    F('fo2', Q, ['M18 18V82H82V18H18'], '🐜', '🍬', 'Faça um quadrado com a formiguinha!', 'pela formiguinha'),
    F('fo3', Q, ['M50 10L12 86H88L50 10'], '🐭', '🍕', 'Um triângulo, igual pedaço de pizza!', 'pelo ratinho'),
    F('fo4', Q, ['M50 8A30 42 0 0 0 50 92A30 42 0 0 0 50 8'], '🐔', '🥚', 'Desenhe o ovo da galinha!', 'pela galinha'),
    F('fo5', Q, ['M20 20L80 80', 'M80 20L20 80'], '🦜', '💰', 'Marque o X do tesouro!', 'pelo papagaio'),
    F('fo6', Q, ['M50 30C40 8 8 10 10 40C12 62 36 74 50 90', 'M50 30C60 8 92 10 90 40C88 62 64 74 50 90'], '🐱', '❤️', 'Faça um coração!', 'pelo gatinho'),
    F('fo7', Q, ['M22 44V88H78V44', 'M12 48L50 12L88 48'], '🐶', '🦴', 'Construa a casinha do cachorro!', 'pelo cachorrinho'),
    F('fo8', Q, ['M50 28A22 22 0 0 0 50 72A22 22 0 0 0 50 28', 'M50 20V5', 'M80 50H95', 'M50 80V95', 'M20 50H5'], '🐝', '🌻', 'Desenhe o sol: primeiro a bola, depois os raios!', 'pela abelha'),
    F('fo9', Q, ['M50 6L77 90L6 38H94L23 90L50 6'], '🧚', '⭐', 'Desenhe uma estrela mágica!', 'pela fadinha')
  ];

  /* ---------- letras de forma (letra bastão) na ordem de traçado ---------- */
  const LETRAS = {
    A: ['M50 10L18 90', 'M50 10L82 90', 'M30 62H70'],
    B: ['M24 10V90', 'M24 10H52C76 10 76 50 52 50H24', 'M24 50H56C82 50 82 90 56 90H24'],
    C: ['M78 22A38 40 0 1 0 78 78'],
    D: ['M24 10V90', 'M24 10H40C92 10 92 90 40 90H24'],
    E: ['M26 10V90', 'M26 10H76', 'M26 50H68', 'M26 90H76'],
    F: ['M28 10V90', 'M28 10H76', 'M28 50H68'],
    G: ['M77 22A38 40 0 1 0 87 60H60'],
    H: ['M22 10V90', 'M78 10V90', 'M22 50H78'],
    I: ['M50 10V90'],
    J: ['M66 10V64A22 24 0 0 1 22 64'],
    K: ['M24 10V90', 'M76 10L24 56', 'M42 41L78 90'],
    L: ['M30 10V90H76'],
    M: ['M18 10V90', 'M18 10L50 62L82 10', 'M82 10V90'],
    N: ['M22 10V90', 'M22 10L78 90V10'],
    O: ['M50 10A36 40 0 0 0 50 90A36 40 0 0 0 50 10'],
    P: ['M24 10V90', 'M24 10H52C78 10 78 54 52 54H24'],
    Q: ['M50 10A36 40 0 0 0 50 90A36 40 0 0 0 50 10', 'M58 68L84 94'],
    R: ['M24 10V90', 'M24 10H52C78 10 78 52 52 52H24', 'M48 52L80 90'],
    S: ['M76 22C70 10 30 6 27 28C24 50 76 46 75 70C74 94 32 94 24 78'],
    T: ['M14 10H86', 'M50 10V90'],
    U: ['M22 10V58A28 32 0 0 0 78 58V10'],
    V: ['M16 10L50 90L84 10'],
    W: ['M8 10L28 90L50 28L72 90L92 10'],
    X: ['M20 10L80 90', 'M80 10L20 90'],
    Y: ['M18 10L50 50', 'M82 10L50 50', 'M50 50V90'],
    Z: ['M18 10H82L18 90H82']
  };
  const NUMEROS = {
    1: ['M32 30L56 10V90'],
    2: ['M24 30C24 4 78 4 76 32C74 52 40 66 22 90H80'],
    3: ['M26 20C36 4 76 6 74 30C72 46 56 50 44 50C60 50 78 56 76 72C74 96 34 96 24 80'],
    4: ['M58 10L18 64H84', 'M62 34V90'],
    5: ['M32 10L28 46C44 34 78 38 76 64C74 92 36 96 24 80', 'M32 10H74'],
    6: ['M70 16C52 4 24 16 24 54C24 92 76 94 76 66C76 40 34 40 25 62'],
    7: ['M20 10H80L40 90'],
    8: ['M70 22C64 6 30 6 30 28C30 48 70 50 70 72C70 96 30 96 30 72C30 50 70 48 70 28'],
    9: ['M74 32C74 6 28 6 28 32C28 56 74 56 74 32L72 90'],
    0: ['M50 10A30 40 0 0 0 50 90A30 40 0 0 0 50 10']
  };
  const PALAVRAS = {
    A: ['🐝', 'Abelha', 'a'], B: ['⚽', 'Bola', 'a'], C: ['🏠', 'Casa', 'a'], D: ['🎲', 'Dado', 'o'], E: ['🐘', 'Elefante', 'o'],
    F: ['🌸', 'Flor', 'a'], G: ['🐱', 'Gato', 'o'], H: ['🦛', 'Hipopótamo', 'o'], I: ['⛪', 'Igreja', 'a'], J: ['🐊', 'Jacaré', 'o'],
    K: ['🥝', 'Kiwi', 'o'], L: ['🦁', 'Leão', 'o'], M: ['🐒', 'Macaco', 'o'], N: ['🚢', 'Navio', 'o'], O: ['🥚', 'Ovo', 'o'],
    P: ['🦆', 'Pato', 'o'], Q: ['🧀', 'Queijo', 'o'], R: ['🐭', 'Rato', 'o'], S: ['☀️', 'Sol', 'o'], T: ['🐢', 'Tartaruga', 'a'],
    U: ['🍇', 'Uva', 'a'], V: ['🐮', 'Vaca', 'a'], W: ['🧇', 'Waffle', 'o'], X: ['☕', 'Xícara', 'a'], Y: ['🍜', 'Yakisoba', 'o'], Z: ['🦓', 'Zebra', 'a']
  };
  const FRUTAS = {
    1: ['🍉', 'uma melancia', 'um'], 2: ['🍌', 'duas bananas', 'dois'], 3: ['🍎', 'três maçãs', 'três'], 4: ['🍓', 'quatro morangos', 'quatro'],
    5: ['🍊', 'cinco laranjas', 'cinco'], 6: ['🍐', 'seis peras', 'seis'], 7: ['🥕', 'sete cenouras', 'sete'], 8: ['🍋', 'oito limões', 'oito'],
    9: ['🍪', 'nove biscoitos', 'nove'], 0: ['🍽️', 'nada no prato', 'zero']
  };

  // como se fala o nome de cada letra (a voz gravada lê isso; na tela aparece a letra)
  const NOME_LETRA = {
    A: 'A', B: 'bê', C: 'cê', D: 'dê', E: 'É', F: 'éfe', G: 'gê', H: 'agá', I: 'I', J: 'jota', K: 'cá', L: 'éle', M: 'ême',
    N: 'êne', O: 'Ó', P: 'pê', Q: 'quê', R: 'érre', S: 'ésse', T: 'tê', U: 'U', V: 'vê', W: 'dáblio', X: 'xis', Y: 'ípsilon', Z: 'zê'
  };
  const NOME_SINAL = { agudo: 'com acento agudo', grave: 'com crase', circ: 'com chapéu', til: 'com til', cedilha: 'com cedilha' };
  const falaLetra = (base, sinal) => `Vamos escrever a letra ${NOME_LETRA[base]}${sinal ? ', ' + NOME_SINAL[sinal] : ''}!`;
  const cap = t => t[0].toUpperCase() + t.slice(1);

  function faseLetra(ch) {
    const [emo, palavra, art] = PALAVRAS[ch];
    return F(`le-${ch}`, Q, LETRAS[ch], emo, '⭐', falaLetra(ch), `pel${art} ${palavra.toLowerCase()}`,
      { final: { grande: ch, emoji: emo, legenda: palavra, fala: `${cap(NOME_LETRA[ch])}, de ${palavra.toLowerCase()}!` } });
  }
  function faseNumero(n) {
    const [emo, frase, nome] = FRUTAS[n];
    return F(`nu-${n}`, Q, NUMEROS[n], n === 0 ? '🐞' : emo, '⭐', `Vamos escrever o número ${nome}!`, n === 0 ? 'pela joaninha' : 'pela frutinha',
      { final: { grande: String(n), emoji: n === 0 ? '🍽️' : emo.repeat(n), legenda: frase, fala: n === 0 ? 'Zero! Não tem nada no prato!' : `${nome[0].toUpperCase() + nome.slice(1)}! ${frase[0].toUpperCase() + frase.slice(1)}!` } });
  }

  const VOGAIS = ['A', 'E', 'I', 'O', 'U'];
  const CONSOANTES = ['L', 'T', 'H', 'F', 'N', 'M', 'V', 'W', 'X', 'Z', 'K', 'Y', 'P', 'B', 'R', 'D', 'C', 'G', 'J', 'S', 'Q'];

  /* ---------- nome da criança (aceita acentos e ç) ---------- */
  const ACENTOS = {
    'Á': ['A', 'agudo'], 'À': ['A', 'grave'], 'Â': ['A', 'circ'], 'Ã': ['A', 'til'], 'É': ['E', 'agudo'], 'Ê': ['E', 'circ'],
    'Í': ['I', 'agudo'], 'Ó': ['O', 'agudo'], 'Ô': ['O', 'circ'], 'Õ': ['O', 'til'], 'Ú': ['U', 'agudo'], 'Ü': ['U', null], 'Ç': ['C', 'cedilha']
  };
  const SINAIS = {
    agudo: 'M44 20L58 4', grave: 'M42 4L56 20', circ: 'M34 20L50 4L66 20',
    til: 'M30 16C36 4 44 6 50 11C56 16 64 18 70 6', cedilha: 'M54 90L48 104C62 102 68 112 58 117C52 120 44 119 38 115'
  };
  function letraDoNome(ch, dx, dy) {
    const [base, sinal] = ACENTOS[ch] || [ch, null];
    const t = LETRAS[base].map(d => ({ d, dx, dy }));
    if (sinal === 'cedilha') t.push({ d: SINAIS.cedilha, dx, dy });
    else if (sinal) t.push({ d: SINAIS[sinal], dx, dy: dy - 16 });
    return t;
  }
  // falas do mundo do nome: genéricas, servem para qualquer nome (o áudio é gravado antes)
  const FALA_NOME = {
    letraFinal: 'Muito bem! Essa letra é do seu nome!', inteiro: 'Agora escreva o seu nome inteiro!',
    partes: 'Agora vamos escrever o seu nome, em partes!', proxima: 'Agora a próxima parte!', lindo: 'Que nome lindo!', falta: 'Isso! Falta pouco!'
  };
  function falasDoNome() {
    return [...Object.values(FALA_NOME), ...Object.values(ACENTOS).filter(([, s]) => s).map(([b, s]) => falaLetra(b, s)), ...Object.keys(LETRAS).map(ch => falaLetra(ch))];
  }

  function mundoNome(nome) {
    const primeiro = (nome || '').trim().split(/\s+/)[0] || '';
    const letras = [...primeiro.toUpperCase()].filter(ch => LETRAS[ch] || ACENTOS[ch]);
    if (!letras.length) return null;
    const temAcento = letras.some(ch => ACENTOS[ch] && ACENTOS[ch][1] && ACENTOS[ch][1] !== 'cedilha');
    const temCedilha = letras.includes('Ç');
    const dy = temAcento ? 16 : 0, h = 100 + dy + (temCedilha ? 26 : 0);
    const fases = letras.map((ch, i) => {
      const [base, sinal] = ACENTOS[ch] || [ch, null];
      return F(`no-${i}-${ch}`, [100, h], letraDoNome(ch, 0, dy), '✏️', '⭐', falaLetra(base, sinal), 'pelo lápis',
        { final: { grande: ch, emoji: '💖', legenda: primeiro, fala: FALA_NOME.letraFinal } });
    });
    // nome inteiro: até 5 letras de uma vez (mais que isso fica pequeno demais na tela, então vira partes)
    const passo = 84, partes = Math.ceil(letras.length / 5), porParte = Math.ceil(letras.length / partes);
    for (let p = 0; p < partes; p++) {
      const pedaco = letras.slice(p * porParte, (p + 1) * porParte);
      const ultima = p === partes - 1;
      fases.push(F(`no-todo-${p}-${pedaco.join('')}`, [passo * pedaco.length + 16, h], pedaco.flatMap((ch, i) => letraDoNome(ch, 8 + i * passo, dy)), '✏️', '⭐',
        partes === 1 ? FALA_NOME.inteiro : p === 0 ? FALA_NOME.partes : FALA_NOME.proxima, 'pelo lápis',
        { final: { grande: ultima ? letras.join('') : pedaco.join(''), emoji: '💖', legenda: '', fala: ultima ? FALA_NOME.lindo : FALA_NOME.falta, nomeInteiro: ultima } }));
    }
    return { id: 'nome', nome: 'Meu nome', de: 'do seu nome', mascote: '💖', cor: '#ff5f97', fundo: '#ffe9f2', requer: 'vogais', fases };
  }

  const BASE = [
    { id: 'linhas', nome: 'Linhas', de: 'das Linhas', mascote: '🐝', cor: '#3fa9f5', fundo: '#e2f3ff', fases: LINHAS },
    { id: 'curvas', nome: 'Curvas', de: 'das Curvas', mascote: '🐸', cor: '#4cbf5a', fundo: '#e6f8e2', requer: 'linhas', fases: CURVAS },
    { id: 'zigue', nome: 'Zigue-zague', de: 'do Zigue-zague', mascote: '🦖', cor: '#ff9f2f', fundo: '#fff1df', requer: 'curvas', fases: ZIGUE },
    { id: 'formas', nome: 'Formas', de: 'das Formas', mascote: '⭐', cor: '#ff5f8f', fundo: '#ffe8ef', requer: 'zigue', fases: FORMAS },
    { id: 'vogais', nome: 'Vogais', de: 'das Vogais', mascote: '🅰️', cor: '#9a6bff', fundo: '#efe8ff', requer: 'formas', fases: VOGAIS.map(faseLetra) },
    { id: 'letras', nome: 'Letras', de: 'das Letras', mascote: '🔤', cor: '#ff8a3d', fundo: '#fff0e3', requer: 'vogais', fases: CONSOANTES.map(faseLetra) },
    { id: 'numeros', nome: 'Números', de: 'dos Números', mascote: '🔢', cor: '#1fb5c9', fundo: '#e0f7fa', requer: 'formas', fases: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(faseNumero) }
  ];

  // normaliza: todo traço vira objeto {d} ou {pts}
  const norm = fase => ({ ...fase, tracos: fase.tracos.map(t => typeof t === 'string' ? { d: t } : t) });
  const BASE_N = BASE.map(m => ({ ...m, fases: m.fases.map(norm) }));

  let cacheNome = null, cacheMundos = null;
  function mundos(nome = '') {
    if (cacheMundos && cacheNome === nome) return cacheMundos;
    const mn = mundoNome(nome);
    cacheNome = nome;
    cacheMundos = mn ? [...BASE_N, { ...mn, fases: mn.fases.map(norm) }] : BASE_N;
    return cacheMundos;
  }

  /* desenho pequeno do caminho para os botões da trilha */
  function miniatura(fase, cor) {
    const [w, h] = fase.vb, p = Math.max(w, h) * .09, sw = Math.max(w, h) * .085;
    let s = `<svg viewBox="${-p} ${-p} ${w + 2 * p} ${h + 2 * p}" class="mini" aria-hidden="true">`;
    for (const t of fase.tracos) {
      const d = t.pts ? 'M' + t.pts.filter((_, i) => i % 4 === 0 || i === t.pts.length - 1).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') : t.d;
      s += `<path d="${d}" transform="translate(${t.dx || 0} ${t.dy || 0})" fill="none" stroke="${cor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return s + '</svg>';
  }

  return { mundos, miniatura, falasDoNome, mundoNomeExemplo: () => mundoNome('Ana'), LETRAS, NUMEROS };
})();
