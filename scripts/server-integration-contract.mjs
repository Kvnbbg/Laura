import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 4100 + Math.floor(Math.random() * 400);
const baseUrl = `http://127.0.0.1:${port}`;
const sessionId = 'integration-session-20260918';

const server = spawn(process.execPath, ['server/index.js'], {
  cwd: new URL('..', import.meta.url),
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    HOST: '127.0.0.1',
    MISTRAL_API_KEY: '',
    OLLAMA_MODEL: '',
    LAURA_RATE_LIMIT_PER_MINUTE: '120',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
server.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

const stop = () => {
  if (!server.killed) {
    server.kill('SIGTERM');
  }
};

const waitForHealth = async () => {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return response;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Laura API did not become ready. Output: ${output.slice(-2000)}`);
};

try {
  await waitForHealth();

  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');

  const chat = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'integration contract check' }],
    }),
  });
  assert.equal(chat.status, 200);
  const chatBody = await chat.json();
  assert.equal(chatBody.message?.role, 'assistant');
  assert.match(chatBody.message?.content ?? '', /Mode local sans API/);

  const stream = await fetch(`${baseUrl}/api/chat/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'stream contract check' }],
    }),
  });
  assert.equal(stream.status, 200);
  const streamBody = await stream.text();
  assert.match(streamBody, /data:/);
  assert.match(streamBody, /\[DONE\]/);

  const documentsWithoutSession = await fetch(`${baseUrl}/api/documents`);
  assert.equal(documentsWithoutSession.status, 400);

  const upload = new FormData();
  upload.append(
    'files',
    new Blob(['echo unsafe'], { type: 'text/plain' }),
    'unsafe.sh'
  );
  const rejectedUpload = await fetch(`${baseUrl}/api/documents`, {
    method: 'POST',
    headers: { 'X-Laura-Session': sessionId },
    body: upload,
  });
  assert.equal(rejectedUpload.status, 415);

  const matrixRejected = await fetch(`${baseUrl}/api/bridge/matrix-progress`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ context: {} }),
  });
  assert.equal(matrixRejected.status, 400);

  const matrixAccepted = await fetch(`${baseUrl}/api/bridge/matrix-progress`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      source: 'french-dev-ai-tools',
      target: 'laura',
      mode: 'chat',
      context: {
        matrixProgress: {
          contract: 'laura-bridge-progress-v1',
          matrixCitizenId: 'integration-test',
          bonusWorld: 'verification',
          quest: 'server-contract',
          xpTotal: 1,
        },
        bridgeSecurity: {
          publicOrigin: 'https://techandstream.com',
          targetRepository: 'french-dev-ai-tools',
          writeMode: 'manual-publish-only',
        },
      },
    }),
  });
  assert.equal(matrixAccepted.status, 200);
  const matrixBody = await matrixAccepted.json();
  assert.equal(matrixBody.status, 'accepted');
  assert.equal(matrixBody.bridge?.security?.trusted, true);

  console.log('Server integration contract passed: health, chat, stream, upload guard, and Matrix bridge.');
} finally {
  stop();
}
