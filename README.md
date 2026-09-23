# Objection Room

A voice sales drill. You pitch; Vic Halloran pushes back. He is hiding one real
reason he won't sign, and it is never the one he says first. Find it and you can
close him. Miss it and you get a flat no, then a scored review of why.

## How it works

Two separate model roles, deliberately kept apart:

- **The buyer** holds hidden state — interest, trust, urgency — that you never
  see, plus a hidden reason generated fresh each call. He reveals it only if you
  earn it. He lowballs once on purpose as a test.
- **The coach** reads the full transcript *and* the hidden state afterwards, then
  scores five dimensions and quotes the exact turns that decided the call.

A single model doing both jobs softens the buyer so it has something nice to say
in the review. Keeping them separate is what makes the buyer hard.

## Three ways it reaches Claude

The same HTML file works in three contexts and picks whichever applies:

| Context | How it calls Claude | Who pays |
| --- | --- | --- |
| Published Claude artifact | `claude.use("sample")` | each viewer |
| Hosted (Vercel) | `/api/claude` proxy | the owner |
| Local file | key pasted into the brief | whoever pasted it |

## Deploying

The hosted build needs two environment variables:

- `ANTHROPIC_API_KEY` — from console.anthropic.com. Never committed; it lives
  only in Vercel's environment settings.
- `ACCESS_CODE` — a shared code visitors type once. Because the proxy spends the
  owner's credits, an ungated public URL would be an open tab on your card.

`api/claude.js` also refuses unknown models, conversations over 60 messages,
`max_tokens` above 3200, and oversized bodies. It rebuilds the request rather
than forwarding it, so nothing unexpected reaches the API.

## Voice

Push-to-talk, via the browser's built-in speech APIs — hold the bar or the
spacebar. Push-to-talk rather than continuous listening because the buyer speaks
aloud, and an open mic hears him and transcribes his words as yours.

Speech recognition needs Chrome or Edge, and a **secure context**: an `https://`
origin or `http://localhost`. Opening the file directly as `file://` blocks the
microphone with no prompt, and the page falls back to typing.

## Local development

```bash
npx --yes serve .          # http://localhost:3000 — mic works here
vercel dev                 # also runs the /api/claude function
```
