#!/usr/bin/env node
/* Grava as falas do jogo com a voz do Google Gemini (TTS) — só grava o que ainda não existe.

   Uso (na pasta do projeto):
     node ferramentas/gerar-vozes.mjs --env "C:/caminho/para/.env"            grava o que falta
     node ferramentas/gerar-vozes.mjs --env "..." --nome "Ana"                inclui as frases com o nome
     node ferramentas/gerar-vozes.mjs --listar                                só mostra o que falta (não gasta nada)
     node ferramentas/gerar-vozes.mjs --env "..." --amostra "Olá!" --voz pt-br-assistant-6   uma frase avulsa em ./amostras

   A chave vem da variável GEMINI_API_KEY ou do arquivo .env indicado em --env (linha GEMINI_API_KEY=...).
   Ela nunca é gravada neste projeto nem impressa.
   Mesma voz e modelo aprovados pelo Paulo no projeto "Explicações Ensino Fundamental" (04/10/2026). */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://generativelanguage.googleapis.com/v1beta';
const MODELO = 'gemini-3.8-flash-tts';
const VOZ_PADRAO = 'pt-br-podcaster-12';
const ESTILO = 'warm, cheerful and gentle, like a loving preschool teacher talking to a 4-year-old child';
const PASTA = path.join(RAIZ, 'audio', 'voz');
const INDICE = path.join(RAIZ, 'audio', 'indice.json');
const FORMATO = 'ogg';
const PARALELO = 2;

/* ---------- argumentos ---------- */
const args = process.argv.slice(2);
const opc = nome => { const i = args.indexOf(nome); return i >= 0 ? (args[i + 1] ?? true) : null; };
const voz = opc('--voz') || VOZ_PADRAO;
const nome = opc('--nome') || '';
const RPM = +(opc('--rpm') || 8); // pedidos por minuto (o modelo de voz tem limite por minuto)

/* ritmo: no máximo RPM pedidos começando por minuto, somando todos os trabalhadores */
let proximoHorario = 0;
async function vez() {
  const agora = Date.now(), quando = Math.max(agora, proximoHorario);
  proximoHorario = quando + 60000 / RPM;
  if (quando > agora) await new Promise(r => setTimeout(r, quando - agora));
}
let avisou429 = false;

/* ---------- catálogo de falas: roda os próprios arquivos do jogo ---------- */
function catalogo() {
  const fontes = ['js/plantas.js', 'js/atividades.js', 'js/falas.js'].map(f => fs.readFileSync(path.join(RAIZ, f), 'utf8')).join('\n;\n');
  const ctx = vm.createContext({ console, TextEncoder, Math });
  vm.runInContext(fontes + '\n;globalThis.__jogo = { Falas };', ctx);
  const { Falas } = ctx.__jogo;
  return { textos: Falas.todas(nome), hash: Falas.hash };
}

/* ---------- chave ---------- */
function chave() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const env = opc('--env');
  if (env && fs.existsSync(env)) {
    for (const linha of fs.readFileSync(env, 'utf8').split(/\r?\n/)) {
      const [k, ...v] = linha.split('=');
      if (k.trim() === 'GEMINI_API_KEY' && v.join('=').trim()) return v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
  console.error('Falta a chave: use --env "caminho/.env" (com GEMINI_API_KEY=...) ou a variável GEMINI_API_KEY.');
  process.exit(1);
}

/* ---------- API ---------- */
const esperar = ms => new Promise(r => setTimeout(r, ms));
async function sintetizar(texto, k) {
  const corpo = {
    model: MODELO,
    input: [{ type: 'user_input', content: [{ type: 'text', text: texto, annotations: [{ type: 'speech_metadata', style: ESTILO }] }] }],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice: voz }] }
  };
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    await vez();
    let r;
    try {
      r = await fetch(`${API}/interactions`, { method: 'POST', headers: { 'x-goog-api-key': k, 'content-type': 'application/json' }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(180000) });
    } catch (e) {
      console.log(`  sem resposta (${e.name}); tentando de novo em 20 s`);
      await esperar(20000); continue;
    }
    if ([429, 500, 503].includes(r.status)) {
      const t = await r.text();
      if (/per day/i.test(t)) throw new Error('Acabou a cota do dia do Gemini.');
      if (r.status === 429 && !avisou429) { avisou429 = true; console.log(`  limite do Gemini: ${t.replace(/\s+/g, ' ').slice(0, 400)}`); }
      const s = 20 * (tentativa + 1);
      console.log(`  gemini ${r.status}: esperando ${s} s`);
      await esperar(s * 1000); continue;
    }
    if (!r.ok) throw new Error(`Gemini respondeu ${r.status}: ${(await r.text()).slice(0, 400)}`);
    const js = await r.json();
    const audios = (js.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []).filter(c => c.type === 'audio');
    if (!audios.length) throw new Error(`O Gemini não devolveu áudio: ${JSON.stringify(js).slice(0, 300)}`);
    let dados = Buffer.from(audios.at(-1).data, 'base64');
    if (dados.subarray(0, 4).toString() !== 'RIFF') dados = wavDePcm(dados, 24000);
    return dados;
  }
  throw new Error('O Gemini não respondeu depois de várias tentativas.');
}

function wavDePcm(pcm, sr) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/* wav → ogg (opus), tirando o silêncio do começo e do fim para a fala sair na hora */
function converter(wav, destino) {
  const tmp = path.join(os.tmpdir(), `jardim-${process.pid}-${Math.random().toString(36).slice(2)}.wav`);
  fs.writeFileSync(tmp, wav);
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-af',
      'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.15,areverse',
      '-ac', '1', '-ar', '24000', '-c:a', 'libopus', '-b:a', '40k', destino]);
  } finally { fs.rmSync(tmp, { force: true }); }
}
function duracao(arq) {
  try { return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq]).toString()); } catch { return NaN; }
}

/* ---------- principal ---------- */
async function main() {
  fs.mkdirSync(PASTA, { recursive: true });

  const amostra = opc('--amostra');
  if (amostra && amostra !== true) {
    const dir = path.join(RAIZ, 'amostras'); fs.mkdirSync(dir, { recursive: true });
    const destino = path.join(dir, `${voz}.${FORMATO}`);
    converter(await sintetizar(amostra, chave()), destino);
    console.log(`amostra: ${destino} (${duracao(destino).toFixed(1)} s)`);
    return;
  }

  const { textos, hash } = catalogo();
  const faltam = textos.filter(t => !fs.existsSync(path.join(PASTA, `${hash(t)}.${FORMATO}`)));
  const chars = faltam.reduce((n, t) => n + t.length, 0);
  console.log(`${textos.length} falas no jogo · ${faltam.length} para gravar (${chars} caracteres) · voz ${voz}`);
  if (opc('--listar')) { faltam.forEach(t => console.log(`  ${hash(t)}  ${t}`)); return; }

  if (faltam.length) {
    const k = chave();
    let feitas = 0, i = 0;
    const erros = [];
    const trabalhador = async () => {
      while (i < faltam.length) {
        const t = faltam[i++];
        try {
          converter(await sintetizar(t, k), path.join(PASTA, `${hash(t)}.${FORMATO}`));
          feitas++;
          if (feitas % 10 === 0 || feitas === faltam.length) console.log(`  ${feitas}/${faltam.length} gravadas`);
        } catch (e) { erros.push([t, e.message]); console.log(`  ERRO em "${t}": ${e.message}`); if (/cota do dia/.test(e.message)) i = faltam.length; }
      }
    };
    await Promise.all(Array.from({ length: PARALELO }, trabalhador));
    if (erros.length) console.log(`${erros.length} falas com erro (rode de novo para tentar só essas).`);
  }

  // índice: só as falas que o jogo usa e que têm arquivo
  const clips = {};
  const curtas = [], longas = [];
  for (const t of textos) {
    const h = hash(t), arq = path.join(PASTA, `${h}.${FORMATO}`);
    if (!fs.existsSync(arq)) continue;
    clips[h] = t;
    const d = duracao(arq), esperado = t.length / 14; // ~14 caracteres por segundo
    if (d < Math.max(.35, esperado * .3)) curtas.push([t, d]);
    if (d > esperado * 3 + 2) longas.push([t, d]);
  }
  fs.writeFileSync(INDICE, JSON.stringify({ modelo: MODELO, voz, estilo: ESTILO, formato: FORMATO, clips }, null, 1));
  console.log(`índice: ${Object.keys(clips).length} falas em audio/indice.json`);
  if (curtas.length || longas.length) {
    console.log('Conferir no ouvido (duração estranha):');
    [...curtas, ...longas].forEach(([t, d]) => console.log(`  ${d.toFixed(1)} s  ${t}`));
  }
  const usados = new Set(Object.keys(clips).map(h => `${h}.${FORMATO}`));
  const sobras = fs.readdirSync(PASTA).filter(f => !usados.has(f));
  if (sobras.length) console.log(`${sobras.length} arquivo(s) em audio/voz não são mais usados pelo jogo (não apaguei).`);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
