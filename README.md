# Jardim Mágico

Jogo de traçado com caneta para treinar a coordenação motora (pré-escrita) de crianças de ~4 anos.
A criança desenha no tablet, ganha **água** e **adubo**, cuida das plantas e, quando uma planta fica
adulta, ganha uma **semente** e escolhe qual planta nasce depois. São 18 espécies e 42 variações de cor para colecionar.

Roda no navegador, guarda tudo **no próprio aparelho** (nada vai para a internet), funciona offline e
instala como app no tablet, igual ao Heróis da Rotina.

## Como a criança joga

1. **Jardim** → toca no **lápis** (botão grande, canto de baixo).
2. **Trilha** → toca na fase que está pulando. A voz explica o que fazer.
3. **Traçado** → encosta a caneta no bichinho e leva ele pelo caminho até o alvo
   (a abelha até a flor, a gota até a plantinha...). Uma luz mostra o caminho antes de começar.
   - **Precisão:** só avança quem fica em cima da linha pontilhada, com tolerância de uns 3,5 mm para cada lado
     (nível Médio). Saiu disso, o bichinho para, o traço fica vermelho e a voz pede "Volte para a linha pontilhada!".
   - Para continuar, ela tem que **voltar ao ponto exato onde parou**: rabiscar cruzando a linha não avança.
   - A cada pedaço completado toca uma nota musical, e as notas vão subindo.
4. **Recompensa** → 1 a 3 estrelas, conforme ficou em cima da linha. Mais estrelas = mais água e adubo.
   Traço feito de qualquer jeito **não vale**: aparece "Quase!", não ganha nada e refaz.
5. **Jardim** → toca na planta → gota (regar) ou saquinho (adubar). Ela cresce na hora.
6. Planta adulta → aparece uma **semente** brilhando → toca → escolhe entre 3 pacotinhos.

## Trilha de fases (em ordem de dificuldade)

| Mundo | O que treina |
|---|---|
| 🐝 Linhas (11) | horizontal, vertical, diagonal, canto, escada, cruz |
| 🐸 Curvas (10) | arco, morro, U, ondas, C, círculo, caracol (espiral), arco-íris, laços |
| 🦖 Zigue-zague (7) | montanhas, dentes, castelo, coroa |
| ⭐ Formas (9) | círculo, quadrado, triângulo, oval, X, coração, casinha, sol, estrela |
| 🅰️ Vogais (5) | A E I O U, cada uma com uma palavra ("A de abelha") |
| 🔤 Letras (21) | as outras letras de forma, das mais fáceis (L, T, H) às mais difíceis (S, Q) |
| 🔢 Números (10) | 1 a 9 e 0, com a contagem de frutinhas |
| 💖 Meu nome | cada letra do nome (com acento e ç) e depois o nome inteiro |

Cada mundo libera o seguinte quando é completado (Números libera depois de Formas; Meu nome, depois de Vogais).
Completar um mundo dá uma **semente de presente**. Letras e números seguem a ordem de traçado ensinada na escola
(de cima para baixo, da esquerda para a direita), com o número de cada traço na tela.

## Equilíbrio das recompensas (pouco por atividade, para ela treinar bastante)

- Estrelas: 1★ = 1 água · 2★ = 2 águas · 3★ = 2 águas + 1 adubo. Primeira atividade do dia: +1 água.
- Água = 10 pontos de crescimento, adubo = 25. Plantas comuns precisam de 150 pontos, especiais de 240,
  raras de 330 e mágicas de 450: umas **5 atividades** por planta comum e **15** por planta mágica.
- **Ritmo do jardim** (área dos pais): Devagar (+50% de treino por planta), Normal, Rápido (−35%).
- Plantas especiais aparecem depois da 1ª planta adulta, as raras depois da 4ª e as mágicas depois da 8ª.
- **O jardim não tem fim**: cada planta adulta dá uma semente e nasce outra; completar um mundo dá uma semente
  extra. Depois de juntar as 42, os pacotinhos continuam vindo (o jardim só cresce, e rola para o lado).
  Ao abrir o jardim, ele já mostra a planta que precisa de água.
- **Largura do caminho** (área dos pais): Fácil (~5 mm para cada lado), Médio (~3,5 mm, padrão), Difícil (~2,5 mm)
  e Desafio (~2 mm). O jogo fica **mais exigente sozinho** quando ela tira 3 estrelas (até 25% mais fino) e nunca
  fica mais fácil que o nível escolhido.

## Voz

As falas são **gravadas** com a voz feminina do Google Gemini (a mesma "podcaster-12" aprovada nos vídeos das
Explicações), num estilo de professora de educação infantil. São 337 frases em `audio/voz/`, que vão junto com o
app e funcionam sem internet. As frases não falam o nome da criança, a não ser que ele seja gravado à parte
(veja "Regravar ou acrescentar falas").

### Regravar ou acrescentar falas

Todas as frases ficam em `js/falas.js` (as das fases, em `js/atividades.js`). Depois de mudar alguma, rode:

```
node ferramentas/gerar-vozes.mjs --env "C:/Users/paulo/Desktop/Explicações Ensino Fundamental/.env"
```

Só grava o que mudou ou falta (cada frase custa frações de centavo). Para incluir as frases com o nome
("Oi, Ana!", "Muito bem, Ana!", "Ana! Que nome lindo!"), acrescente `--nome "Ana"`. `--listar` mostra o que falta
sem gastar nada. A chave é lida do `.env` indicado e nunca é copiada para este projeto.

## Área dos pais

No jardim, **segure o ⚙️ por 3 segundos**. Lá dá para:
nome da criança · largura do caminho · ritmo do jardim · modo da caneta · voz e sons · limite de tempo por dia ·
progresso (gráfico dos últimos 7 dias e média de estrelas por mundo) · liberar todas as fases ·
dar água/adubo de presente · backup (exportar/importar) · zerar.

### Salvamento

Salva sozinho no tablet a cada ação: fechar o app, trocar de app ou desligar o tablet não perde nada.
O jogo também pede ao Android para **nunca apagar os dados sozinho** quando faltar espaço (a área dos pais mostra
se essa proteção está ativa; instalando na tela inicial ela costuma ativar). O progresso só se perde se alguém
limpar os dados do Chrome ou desinstalar, por isso existe o **Exportar backup**.

### Caneta e palma da mão

No modo **Automático** (padrão), assim que o tablet percebe uma caneta ativa (S Pen e similares), o dedo e a
palma da mão param de desenhar, então a criança pode apoiar a mão na tela. Antes disso o dedo funciona
(útil para testar), e toques muito largos (palma) já são ignorados.
Canetas "de borrachinha" (passivas) o tablet enxerga como dedo: nesse caso use **Aceitar dedo também**.

## Colocar no tablet Android

1. Publicar a pasta numa URL https (GitHub Pages, Netlify ou Vercel, todas grátis).
2. Abrir o endereço no **Chrome** do tablet.
3. Menu ⋮ → **Instalar app** / **Adicionar à tela inicial**.
4. Abre em tela cheia, deitado, sem barra do navegador, e funciona sem internet depois da primeira vez.

A voz usa o leitor do próprio Android. Se ficar mudo, confira em Configurações → Acessibilidade →
Conversão de texto em voz se o mecanismo do Google e o idioma Português (Brasil) estão instalados.

## Testar no PC

Na pasta do projeto:

```
npx http-server -p 8778 -c-1
```

Depois abra `http://localhost:8778`. O mouse funciona como caneta para testar.

## Arquivos

```
index.html            estrutura das telas
css/app.css           visual
js/util.js            som sintetizado, voz, confete, ícones
js/plantas.js         as 18 espécies e o desenho de cada fase de crescimento
js/atividades.js      todas as fases de traçado (linhas, curvas, letras, números, nome)
js/falas.js           tudo o que a voz fala (catálogo usado pelo jogo e pelo gerador de vozes)
audio/voz/            as falas gravadas (arquivo = hash do texto) · audio/indice.json lista todas
ferramentas/gerar-vozes.mjs   grava as falas com o Gemini (só as que faltam)
js/jogo.js            estado salvo e regras (recompensas, crescimento, sementes, fases liberadas)
js/traco.js           motor do traçado: caneta, palma, caminho, avaliação e estrelas
js/telas.js           jardim, trilha, coleção, recompensa, escolha de semente, descanso
js/pais.js            área dos pais
js/app.js             abertura, navegação, tempo de jogo
sw.js                 funcionamento offline
manifest.webmanifest  instalação como app
```
