# content-engine-ui

Next.js 14 frontend for the Content Engine API.

## Setup

```bash
npm install
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL to point at your API
npm run dev
```

Open http://localhost:3000

## Routes

| Path | Description |
|------|-------------|
| /admin/dashboard | Admin overview — stats, recent content, agent runs |
| /admin/clients | Manage clients (CRUD) |
| /admin/campaigns | Manage campaigns per client |
| /admin/content | Content briefs — Kanban + list view |
| /admin/agents | Run AI agents with live streaming output |
| /admin/chat | AI chat with conversation history |
| /admin/settings | AI providers + agent model defaults |
| /client/dashboard | Client portal dashboard |
| /client/content | Client content view |
| /client/campaigns | Client campaigns view |

## Stack: Next.js 14, TypeScript, Tailwind CSS, Lucide
