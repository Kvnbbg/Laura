import { mkdirSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEFAULT_PORT = Number(process.env.LAURA_MINDWALK_PORT) || 8766;
const INSTALL_COMMAND =
  'curl -fsSL https://raw.githubusercontent.com/cosmtrek/mindwalk/master/scripts/install.sh | sh';

const usage = [
  'Usage:',
  '  /run mindwalk                 start mindwalk serve for Laura sessions',
  '  /run mindwalk check           verify the mindwalk binary',
  '  /run mindwalk build           write .mindwalk/laura-citymap.json',
  '  /run mindwalk trace <session> write .mindwalk/laura-trace.json',
  '  /run mindwalk open <session>  open one session',
  '  /run mindwalk analyze <session> [claude|codex]',
].join('\n');

const mindwalkBin = () => process.env.LAURA_MINDWALK_BIN || 'mindwalk';
const repoPath = () => process.env.LAURA_MINDWALK_REPO || ROOT;
const shouldOpenBrowser = (args) => args.includes('--open') || process.env.LAURA_MINDWALK_OPEN === 'true';

function runFinite(commandArgs, { cwd = repoPath() } = {}) {
  return spawnSync(mindwalkBin(), commandArgs, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
}

function binaryStatus() {
  const result = runFinite(['--help']);
  return {
    ok: result.status === 0,
    error: result.error,
    output: `${result.stdout || ''}${result.stderr || ''}`.trim(),
  };
}

function printMissingBinary(print, error) {
  print('mindwalk is not available on PATH yet.');
  if (error?.message) print(`check failed: ${error.message}`);
  print('');
  print('Install it manually, then restart the terminal session:');
  print(INSTALL_COMMAND);
  print('export PATH="$HOME/.local/bin:$PATH"');
}

function printResult(print, result) {
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  if (output) print(output);
  if (result.error) {
    print(`mindwalk failed: ${result.error.message}`);
  } else if (result.status !== 0) {
    print(`mindwalk exited with code ${result.status}`);
  }
}

function outputPath(fileName) {
  const dir = path.join(repoPath(), '.mindwalk');
  mkdirSync(dir, { recursive: true });
  return path.join(dir, fileName);
}

function startServe(print, args) {
  const portArg = args.find((arg) => /^\d+$/.test(arg));
  const port = Number(portArg) || DEFAULT_PORT;
  const commandArgs = ['serve', '--port', String(port)];
  if (!shouldOpenBrowser(args)) commandArgs.push('--no-open');

  const child = spawn(mindwalkBin(), commandArgs, {
    cwd: repoPath(),
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  print('Mindwalk bridge started for Laura.');
  print(`repo: ${repoPath()}`);
  print(`local UI: http://127.0.0.1:${port}`);
  print(`pid: ${child.pid}`);
  print('viewing is local-only; run analyze explicitly if you want a model judgment.');
}

export default {
  name: 'mindwalk',
  description: 'Launch or export Mindwalk views for Laura Codex/Claude session logs.',
  async run({ args = [], print }) {
    const command = (args[0] || 'serve').toLowerCase();

    if (command === 'help') {
      print(usage);
      return;
    }

    const status = binaryStatus();
    if (!status.ok) {
      printMissingBinary(print, status.error);
      return;
    }

    if (command === 'check') {
      print('mindwalk is available.');
      print(status.output.split('\n').slice(0, 12).join('\n'));
      return;
    }

    if (command === 'serve') {
      startServe(print, args.slice(1));
      return;
    }

    if (command === 'build') {
      const result = runFinite(['build', repoPath(), '-o', outputPath('laura-citymap.json')]);
      printResult(print, result);
      print(`citymap: ${outputPath('laura-citymap.json')}`);
      return;
    }

    if (command === 'trace') {
      const session = args[1];
      if (!session) {
        print(usage);
        return;
      }
      const result = runFinite(['trace', session, '-o', outputPath('laura-trace.json')]);
      printResult(print, result);
      print(`trace: ${outputPath('laura-trace.json')}`);
      return;
    }

    if (command === 'open') {
      const session = args[1];
      if (!session) {
        print(usage);
        return;
      }
      const commandArgs = ['open'];
      if (!shouldOpenBrowser(args)) commandArgs.push('--no-open');
      commandArgs.push(session);
      printResult(print, runFinite(commandArgs));
      return;
    }

    if (command === 'analyze') {
      const session = args[1];
      const judge = args[2] || process.env.LAURA_MINDWALK_JUDGE || 'codex';
      if (!session) {
        print(usage);
        return;
      }
      print('Analyze is explicit: mindwalk will ask your local agent CLI to judge a session summary.');
      printResult(print, runFinite(['analyze', session, '--judge', judge]));
      return;
    }

    print(usage);
  },
};
