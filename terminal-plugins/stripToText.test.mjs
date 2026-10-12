// stripToText feeds remote, attacker-influenceable HTML straight into an LLM
// prompt (see callBridge in both plugins), so a stripping bug is a prompt
// injection / source-disclosure bug, not a cosmetic one. These cases pin the
// two ways an order-dependent multi-pass strip fails.
import { describe, expect, it } from 'vitest';

import { stripToText as stripSocial } from './french-dev-social.mjs';
import { stripToText as stripMoltbook } from './moltbook.mjs';

describe.each([
  ['moltbook', stripMoltbook],
  ['french-dev-social', stripSocial],
])('%s stripToText', (_name, stripToText) => {
  it('drops script bodies that contain a stray "<!--"', () => {
    // Legal in JS via Annex B HTML-like comments, and common in minified
    // bundles. Comment-first stripping runs past </script> to the next "-->",
    // leaving the raw script source in the output.
    const html = '<script>var secret = 1 <!-- 2; leakMe();</script><p>visible</p><!-- nav -->';

    expect(stripToText(html)).toBe('visible');
  });

  it('drops style bodies that contain a stray "<!--"', () => {
    const html = '<style>a{content:"<!--"}b{color:red}</style><p>vis</p><!-- end -->';

    expect(stripToText(html)).toBe('vis');
  });

  it('keeps text that follows a commented-out <script>', () => {
    // The mirror failure: script-first stripping would consume from the
    // commented-out opening tag through the real closing tag, eating the text.
    const html = '<!-- <script> --> real text <script>secret()</script>';

    expect(stripToText(html)).toBe('real text');
  });

  it('strips ordinary markup, comments and scripts', () => {
    expect(stripToText('<p>hello</p><!-- c --><script>x()</script>')).toBe('hello');
  });

  it('collapses whitespace and trims', () => {
    expect(stripToText('<p>  a\n\n  b  </p>')).toBe('a b');
  });
});
