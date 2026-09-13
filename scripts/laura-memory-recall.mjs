#!/usr/bin/env node
import { buildRagContext } from '../server/memory-rag.mjs';
const q = process.argv.slice(2).join(' ') || 'laura architecture';
const { context, result } = await buildRagContext(q, { limit: 8 });
process.stdout.write(JSON.stringify({ query: q, ...result, context }, null, 2) + '\n');
