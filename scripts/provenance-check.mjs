import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const findings = [];

function readText(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function requireFile(file, snippets = []) {
  if (!fs.existsSync(path.join(root, file))) {
    findings.push(`${file}: missing`);
    return '';
  }
  const text = readText(file);
  for (const snippet of snippets) {
    if (!text.includes(snippet)) {
      findings.push(`${file}: missing ${snippet}`);
    }
  }
  return text;
}

function requireEqual(label, actual, expected) {
  if (actual !== expected) {
    findings.push(`${label}: expected ${expected}, got ${actual || '<empty>'}`);
  }
}

function requireIncludes(label, actual, expected) {
  if (!String(actual || '').includes(expected)) {
    findings.push(`${label}: missing ${expected}`);
  }
}

const pkg = readJson('package.json');
requireIncludes('package.author', pkg.author, 'Kevin Marville');
requireEqual('package.license', pkg.license, 'Apache-2.0');
requireEqual('package.repository.type', pkg.repository?.type, 'git');
requireIncludes('package.repository.url', pkg.repository?.url, 'github.com/Kvnbbg/Laura');
requireIncludes('package.homepage', pkg.homepage, 'github.com/Kvnbbg/Laura');
requireIncludes('package.bugs.url', pkg.bugs?.url, 'github.com/Kvnbbg/Laura/issues');

requireFile('LICENSE', ['Apache License', 'Version 2.0']);
requireFile('NOTICE', ['Kevin Marville', 'Apache License, Version 2.0']);
requireFile('AUTHORS.md', ['Kevin Marville', 'Techandstream']);
requireFile('CITATION.cff', ['Kevin', 'repository-code: "https://github.com/Kvnbbg/Laura"', 'Apache-2.0']);
requireFile('SECURITY.md', ['Reporting A Vulnerability', 'npm run check:security']);
requireFile('docs/SECURITY_GUARDRAILS.md', ['ANSSI-style hygiene', 'npm run check:security']);
requireFile('docs/AUTHORSHIP_AND_PROVENANCE.md', ['NOTICE', 'Apache-2.0']);
requireFile('.github/CODEOWNERS', ['@Kvnbbg']);

const bridge = readJson('public/moltbot-matrix-bridge.json');
requireEqual('bridge.provenance.author', bridge.provenance?.author, 'Kevin Marville / Techandstream');
requireEqual('bridge.provenance.license', bridge.provenance?.license, 'Apache-2.0');
requireEqual('bridge.provenance.sourceRepositoryUrl', bridge.provenance?.sourceRepositoryUrl, 'https://github.com/Kvnbbg/Laura');

const goBridge = requireFile('internal/bridge/bridge.go', [
  'AuthorName',
  'SourceRepositoryURL',
  'Apache-2.0',
]);
if (!/AuthorName\s+=\s+"Kevin Marville"/.test(goBridge)) {
  findings.push('internal/bridge/bridge.go: AuthorName must remain Kevin Marville');
}

if (findings.length) {
  console.error('Provenance check failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('Provenance check passed.');
