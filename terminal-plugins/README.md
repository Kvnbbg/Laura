# Laura terminal plugins

Drop a `.mjs` file here to extend the terminal chat (`npm run chat`). Each
plugin is an ES module with a default export shaped like:

```js
export default {
  name: 'example',
  description: 'One-line summary shown in /plugins',
  async run({ callBridge, print }) {
    // callBridge(content, { mode, context }) talks to the same /api/chat
    // bridge as the chat itself (mode: 'chat' | 'agent' | 'broadcast' | 'social').
    // print(line) writes a line to the terminal.
    print('Hello from the example plugin!');
  },
};
```

Run it from the chat with `/run example` (the file name without `.mjs`).

## Roadmap (not yet implemented)

This is the extension point for connecting Laura's terminal to other tools
in the ecosystem — each becomes its own plugin file once scoped, instead of
being hard-wired into the core CLI:

- `ssh-ai-chat` — remote terminal chat sessions over SSH
- `second-me` — personal-agent memory/context bridge
- `bluesky-video` — social video feed integration
- `wp-malware-scanner` — security scan trigger + report viewer
- `bookish-octo-invention` — layered content/automation pipeline
- `chroma` — vector store / embeddings backend
- `french-dev-ai-tools` MoltBots — richer bot-network feed beyond the
  built-in `/api/chat` `mode: "social"` background ticker

Keep each plugin self-contained: its own auth/config via env vars, no
shared mutable state with the core CLI beyond `callBridge`/`print`.
