import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const includeBuild = process.argv.includes('--include-build');
const skipDirs = new Set([
  '.git',
  'coverage',
  'node_modules',
  '.vite',
  '.cache',
  'tmp',
]);
if (!includeBuild) {
  skipDirs.add('dist');
  skipDirs.add('build');
}
const skipFiles = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
]);

/**
 * Les tests d'un détecteur contiennent, par construction, des échantillons de
 * ce qu'il détecte : securityScanRules.test.ts porte un `/home/…` et un
 * `file:///…` comme cas attendus. Les scanner revient à signaler le garde
 * parce qu'il connaît le visage du voleur.
 *
 * L'exclusion porte sur les fichiers de TEST, jamais sur du code livré : un
 * secret déposé dans un `.test.ts` n'est pas publié, et le scan des sources et
 * des artefacts reste entier.
 */
const estFichierDeTest = (nom) =>
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(nom) || nom === '__tests__';

const findings = [];

const codePrefixes = [
  `bin${path.sep}`,
  `server${path.sep}`,
  `scripts${path.sep}`,
  `src${path.sep}`,
  `terminal-plugins${path.sep}`,
];

const isRuntimeCode = (file) => codePrefixes.some((prefix) => file.startsWith(prefix));
const isPublicArtifact = (file) =>
  file.startsWith(`public${path.sep}`) ||
  file.startsWith(`dist${path.sep}`) ||
  file.startsWith(`build${path.sep}`);

const rules = [
  {
    id: 'client-secret-env-name',
    test: (line) => /\bVITE_[A-Z0-9_]*(API_KEY|SECRET|TOKEN|PASSWORD)\b/.test(line),
  },
  {
    id: 'browser-bearer-token',
    test: (line, file) =>
      file.startsWith(`src${path.sep}`) &&
      /Authorization\s*:\s*[`'"]?Bearer\b/i.test(line),
  },
  {
    id: 'runtime-stack-trace-leak',
    test: (line, file) =>
      file !== `scripts${path.sep}security-scan.mjs` &&
      isRuntimeCode(file) &&
      /(\berror\.stack\b|\bstack\s*:)/.test(line),
  },
  {
    id: 'cors-reflects-all-origins',
    test: (line, file) =>
      file === `server${path.sep}index.js` &&
      /cors\s*\(\s*\{\s*origin\s*:\s*true\b/.test(line),
  },
  {
    id: 'private-key-block',
    test: (line) => /BEGIN (RSA |EC |OPENSSH |DSA |)?PRIVATE KEY/.test(line),
  },
  {
    id: 'local-home-path',
    test: (line, file) =>
      !file.startsWith(`docs${path.sep}AGENT_`) &&
      /\/home\/[A-Za-z0-9._-]+\//.test(line),
  },
  {
    id: 'real-looking-secret-assignment',
    test: (line) => {
      const match = line.match(/\b([A-Z][A-Z0-9_]*(API_KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*)\s*=\s*['"]?([^'"\s#;]+)?/);
      if (!match) return false;
      const value = match[3] ?? '';
      if (!value || value.length < 12) return false;
      if (value.startsWith('process.env.')) return false;
      return !/^(example|placeholder|changeme|dummy|test|your-|<)/i.test(value);
    },
  },
  {
    id: 'openclaw-local-command-public',
    test: (line, file) =>
      (isPublicArtifact(file) || file.startsWith(`docs${path.sep}`)) &&
      /\b(agentCommand|statusCommand|repoPath)\b/.test(line),
  },
  {
    id: 'public-local-or-private-origin',
    // Ce qu'on cherche : une adresse de DÉVELOPPEMENT laissée dans un artefact
    // publié — `http://localhost:5173/api`, une IP privée, un chemin absolu de
    // la machine du développeur.
    //
    // Ce qu'on ne cherche pas : `http://localhost` NU, sans port ni chemin.
    // C'est la base de repli de react-router lorsque `location.origin` vaut la
    // chaîne « null » (contexte bac à sable), inlinée dans chaque bundle. Elle
    // ne joint rien et ne révèle rien.
    //
    // La distinction n'est pas cosmétique : sans elle, le scan échouait à
    // CHAQUE exécution sur du code de bibliothèque. Un contrôle qui crie au
    // loup en permanence cesse d'être lu, et c'est alors la vraie fuite qui
    // passe — le bruit coûte plus cher que l'absence de règle.
    test: (line, file) =>
      isPublicArtifact(file) &&
      /(localhost[:/][\w-]|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d{1,3}\.\d|10\.0\.\d{1,3}\.\d|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d|\/home\/[a-z]|file:\/\/\/)/.test(line),
  },
  {
    id: 'public-hidden-admin-claim',
    test: (line, file) =>
      isPublicArtifact(file) &&
      /(hidden admin|private production access|raw terminal logs|hidden prompts)/i.test(line),
  },
];

function shouldSkipDir(dirent) {
  return !dirent.isDirectory() || skipDirs.has(dirent.name) || estFichierDeTest(dirent.name);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDir(entry)) {
        walk(fullPath);
      }
      continue;
    }
    if (!entry.isFile() || skipFiles.has(entry.name) || estFichierDeTest(entry.name)) {
      continue;
    }
    scanFile(fullPath);
  }
}

function scanFile(fullPath) {
  const relative = path.relative(root, fullPath);
  let text;
  try {
    text = fs.readFileSync(fullPath, 'utf8');
  } catch {
    return;
  }
  if (text.includes('\u0000')) {
    return;
  }

  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (rule.test(line, relative)) {
        findings.push({
          file: relative,
          line: index + 1,
          rule: rule.id,
        });
      }
    }
  });
}

walk(root);

if (findings.length) {
  console.error('Security scan failed. Review these public leak risks:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.rule}`);
  }
  process.exit(1);
}

console.log('Security scan passed.');
