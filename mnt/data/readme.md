You are a senior full-stack engineer. Improve the GitHub repository https://github.com/kvnbbg/Laura using the provided attachments:

- Project archive: /mnt/data/Laura_Mistral_Integration.tar.gz
- Spec/guide: /mnt/data/Guide d'intégration de Mistral AI dans Laura.md

Objective
Build a robust, production-grade “Laura” application with an embedded Mistral AI chat feature, following the guide precisely, and then extend it with “attachments + embeddings” (RAG) so the chat can answer questions based on uploaded files.

Non-negotiable constraints (from the guide)
1) Secure configuration via environment variables:
   - VITE_MISTRAL_API_KEY (required when chat enabled)
   - VITE_MISTRAL_MODEL default mistral-small; options: mistral-small, mistral-medium, mistral-large
   - VITE_ENABLE_CHAT feature flag (true/false)
   Implement validation at startup and user-friendly failures when missing/invalid.
2) Multi-model support and ability to enable/disable chat via env flag.
3) Strict TypeScript, complete error handling, logging, tests, and WCAG accessibility (ARIA labels, contrast, keyboard nav).
4) Chat UI requirements:
   - Floating button + chat window
   - Message history in UI
   - Typing indicator
   - Clear history action
   - Responsive mobile-first design
5) Testing:
   - Ensure/implement tests for env validation, contactService, and complete mistralService test coverage (currently “to complete” per guide).
6) Deployment:
   - Production build works (dist/)
   - “serve” mode works on port 3000
   - .gitignore excludes .env / .env.local / .env.*.local

Extension (attachments + embeddings/RAG)
Add the capability for users to:
A) Upload one or more files in the chat (PDF, TXT, MD, DOCX if easy; at minimum TXT/MD).
B) Store uploaded content locally (client-side) or on the server (preferred) with safe limits:
   - Max file size, allowed mime-types, virus/abuse-safe handling (at least: reject executables, enforce size caps).
C) Build embeddings for uploaded documents and implement retrieval-augmented generation:
   - When user asks a question, retrieve top-k relevant chunks and include them as context to Mistral.
   - Provide citations in the assistant answer like: [DocName • chunk 3]
   - Add a “Delete my documents” control.
D) Keep it maintainable:
   - Clean module boundaries: config/, services/, components/
   - No secrets in client bundle beyond what is unavoidable; if VITE_* is client-exposed, implement a server proxy for Mistral calls (recommended).

Deliverables
1) A clear diff/patch (or PR-ready set of changes) implementing:
   - Mistral chat integration per guide
   - Full tests passing: npm test
   - Lint/typecheck passing (if configured)
   - RAG with file uploads + embeddings
2) Updated README:
   - Setup instructions
   - Env var examples
   - Dev commands
   - Deployment notes (Railway or equivalent)
3) “Acceptance checklist” in the final response:
   - Chat toggles via VITE_ENABLE_CHAT
   - Missing API key shows clean error and disables chat
   - Model selection works
   - Upload + retrieval works end-to-end
   - Accessibility pass (ARIA labels, keyboard navigation)
   - Conversation export (optional) if time permits, but prioritize RAG.

Working method (mandatory)
- First: unpack and inspect the tar.gz; summarize current structure and what already exists.
- Second: map guide requirements to the codebase; list gaps.
- Third: implement in small commits (or logically separated patches): config → services → UI → tests → RAG.
- Fourth: verify by running tests and a production build.
- Fifth: output the changes with file-by-file explanations and exact commands to run.

Do not hand-wave. If something is ambiguous, implement the most pragmatic default and document it.