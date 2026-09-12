import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PLUGINS = path.join(ROOT, 'terminal-plugins');

const SPELLS = [
  {
    id: 'rune',
    title: 'Rune IDE',
    why: 'IDE GPU clavier-first pour coder sans quitter un environnement pro ; Laura le pilote, le code GPL reste hors dépôt.',
    run: '/run rune run',
    check: '/run rune check',
  },
  {
    id: 'copy',
    title: 'COPY paper desk',
    why: 'Hunt et paper trade sans custody dans Laura.',
    run: '/run copy doctor',
  },
  {
    id: 'rustfx',
    title: 'rustFX Web3',
    why: 'Moteur Rust pour catalogue chaînes / coins, piloté par Laura.',
    run: '/run rustfx status',
  },
  {
    id: 'mindwalk',
    title: 'Mindwalk',
    why: 'Visualiser les sessions agent en local.',
    run: '/run mindwalk check',
  },
];

const LIGHT_SMART = ['qwen2.5:3b', 'phi3:mini', 'llama3.2:3b', 'gemma2:2b'];

function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    encoding: 'utf8',
  });
  return r.status === 0;
}

function ollamaTags() {
  try {
    const res = spawnSync('curl', ['-sS', '--max-time', '2', 'http://127.0.0.1:11434/api/tags'], {
      encoding: 'utf8',
    });
    if (res.status !== 0 || !res.stdout) return [];
    const json = JSON.parse(res.stdout);
    return (json.models || []).map((m) => m.name).filter(Boolean);
  } catch {
    return [];
  }
}

async function runSibling(name, args, ctx) {
  const file = path.join(PLUGINS, `${name}.mjs`);
  if (!existsSync(file)) {
    ctx.print(`Sort ${name} absent du Grimoire (fichier manquant).`);
    return;
  }
  const mod = await import(pathToFileURL(file).href);
  const plugin = mod.default ?? mod;
  if (typeof plugin?.run !== 'function') {
    ctx.print(`Plugin ${name} sans run().`);
    return;
  }
  await plugin.run({ ...ctx, args });
}

function printCatalog(print) {
  print('=== Grimoire de Laura ===');
  print('Reste dans le terminal : Laura propose, tu valides les commandes.');
  for (const s of SPELLS) {
    print(`• ${s.id} — ${s.title}`);
    print(`  Pourquoi : ${s.why}`);
    print(`  Lancer : ${s.run}`);
  }
  print('Autres pages : /grimoire llm | /grimoire improve | /grimoire lancer rune');
}

function printLlmPolicy(print) {
  const local = process.env.LAURA_LOCAL_MODEL || process.env.OLLAMA_MODEL || '(non défini)';
  const tags = ollamaTags();
  print('=== Politique LLM de Laura ===');
  print('1. Préférence agentique : Mistral (MISTRAL_API_KEY) pour raisonnement long.');
  print(`2. Local Ollama : OLLAMA_URL + OLLAMA_MODEL / LAURA_LOCAL_MODEL (actuel: ${local}).`);
  print('3. qwen:1.5b : accepté si tu forces LAURA_LOCAL_MODEL=qwen:1.5b, mais trop petit');
  print('   pour plans multi-étapes, code et ponts (Rune/COPY). Laura te le dira franchement.');
  print('4. Fast but smarter (suggestions à tirer toi-même) :');
  for (const m of LIGHT_SMART) print(`   ollama pull ${m}`);
  if (tags.length) {
    print(`5. Modèles déjà sur cette machine : ${tags.slice(0, 12).join(', ')}`);
    if (tags.some((t) => t.includes('1.5b') || t === 'qwen:1.5b')) {
      print('   Note : un 1.5b est détecté — utile pour smoke tests, pas comme cerveau principal.');
    }
  } else {
    print('5. Ollama tags : indisponible (service arrêté ou curl manquant).');
  }
  print('Laura ne pull jamais seule. Tu colles la commande après relecture.');
}

function printImprove(print) {
  print('=== Amélioration proposée (commandes à valider) ===');
  const missing = [];
  if (!which('go')) missing.push({ need: 'Go', cmd: 'sudo apt-get install -y golang-go   # ou https://go.dev/dl/' });
  if (!which('ollama')) {
    missing.push({
      need: 'Ollama',
      cmd: '# installer depuis https://ollama.com puis: ollama pull qwen2.5:3b',
    });
  }
  if (!which('rustc')) {
    missing.push({
      need: 'Rust (rustFX)',
      cmd: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
    });
  }
  if (!process.env.LAURA_RUNE_REPO) {
    missing.push({
      need: 'Rune checkout',
      cmd: 'git clone https://github.com/unstablebuild/rune.git && cd rune && make rune && export LAURA_RUNE_REPO="$PWD"',
    });
  }
  if (!process.env.MISTRAL_API_KEY && !(process.env.OLLAMA_MODEL || process.env.LAURA_LOCAL_MODEL)) {
    missing.push({
      need: 'Cerveau chat',
      cmd: 'export MISTRAL_API_KEY=...   # ou export LAURA_LOCAL_MODEL=qwen2.5:3b',
    });
  }
  if (missing.length === 0) {
    print('Rien d’évident à installer. Tu peux demander : « Laura, propose un LLM local plus malin ».');
  } else {
    for (const m of missing) {
      print(`• Manque : ${m.need}`);
      print(`  ${m.cmd}`);
    }
  }
  print('Aucune de ces lignes n’est exécutée par Laura automatiquement.');
}

export default {
  name: 'grimoire',
  description:
    'Grimoire Laura : Rune, LLM locaux, amélioration par commandes proposées (sans auto-install).',
  async run(ctx) {
    const { args = [], print, callBridge } = ctx;
    const raw = args.join(' ').trim().toLowerCase();
    const head = (args[0] || 'list').toLowerCase();

    if (!raw || head === 'list' || head === 'help' || head === 'catalogue') {
      printCatalog(print);
      return;
    }

    if (head === 'llm' || head === 'models' || head === 'modèles' || head === 'modeles') {
      printLlmPolicy(print);
      return;
    }

    if (head === 'improve' || head === 'améliore' || head === 'ameliorer' || head === 'upgrade') {
      printImprove(print);
      try {
        const reply = await callBridge(
          'En 3 puces max : quelles commandes Linux l’utilisateur devrait revoir pour renforcer Laura (Ollama malin, Rune, pas d’auto-install).',
          { mode: 'agent', context: { activity: 'grimoire-improve', tags: ['tooling'] } },
        );
        if (reply?.message?.content) {
          print('');
          print(reply.message.content);
        }
      } catch {
        /* offline ok */
      }
      return;
    }

    const wantsRune =
      head === 'rune' ||
      raw.includes('lancer rune') ||
      raw.includes('lance rune') ||
      raw.includes('launch rune') ||
      raw.includes('open rune');

    if (wantsRune) {
      print('Grimoire → Rune : Laura le propose parce que c’est l’IDE pro GPU hors navigateur.');
      print('Checkout GPL séparé ; on ne vendore pas dans Laura.');
      const action = raw.includes('check') ? ['check'] : raw.includes('build') ? ['build'] : ['run'];
      if (action[0] === 'run') {
        print('Lancement via /run rune run …');
      }
      await runSibling('rune', action, ctx);
      return;
    }

    if (SPELLS.some((s) => s.id === head)) {
      const rest = args.slice(1);
      await runSibling(head, rest.length ? rest : head === 'copy' ? ['doctor'] : ['status'], ctx);
      return;
    }

    printCatalog(print);
  },
};
