import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../server/index.js', import.meta.url), 'utf8');

const requiredContracts = [
  ['origin allowlist', /DEFAULT_ALLOWED_ORIGINS\s*=\s*new Set/],
  ['production local-origin rejection', /process\.env\.NODE_ENV !== 'production' && isLocalOrigin/],
  ['request body limit', /express\.json\(\{ limit: REQUEST_BODY_LIMIT \}\)/],
  ['API rate limit', /app\.use\('\/api',\s*\(req, res, next\)/],
  ['upload memory storage', /multer\(\{\s*storage: multer\.memoryStorage\(\)/],
  ['upload size limit', /limits:\s*\{ fileSize: MAX_FILE_SIZE \}/],
  ['document session validation', /DOCUMENT_SESSION_PATTERN/],
  ['document TTL cleanup', /DOCUMENT_TTL_MS/],
  ['secret redaction', /redactSensitiveText/],
  ['secret rejection during upload', /containsSensitiveText\(text\)/],
  ['manual Matrix publishing policy', /writeMode === "manual-publish-only"/],
];

for (const [name, pattern] of requiredContracts) {
  assert.match(source, pattern, `Missing security contract: ${name}`);
}

assert.match(
  source,
  /allowedHeaders:\s*\['Content-Type', 'Authorization', 'X-Laura-Session'\]/,
  'Laura session header must remain explicitly allowed'
);

console.log(`Server security contract passed: ${requiredContracts.length} invariants.`);
