# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm start        # Run production server
npm run lint     # Run ESLint
```

No automated test suite yet. Manual testing pages exist at `/test` (Supabase connection) and `/test-auth` (token extraction).

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_URL` (defaults to `http://localhost:3000`)

## Architecture

**PromptVault** is a Next.js 14 App Router application for managing AI prompts. Stack: TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth).

### Auth Flow

All API routes require `Authorization: Bearer <token>` headers. The token comes from Supabase Auth (Google OAuth).

- `lib/auth.ts` — `getCurrentUser(request)` validates the Bearer token server-side; `createAuthenticatedClient(token)` creates a per-request Supabase client that enforces RLS policies
- `lib/supabase-client.ts` — Browser client + `useUser()` React hook for client-side auth state
- `lib/supabase.ts` — Anonymous Supabase client for public operations
- OAuth callback is handled at `app/api/auth/callback/route.ts`

### API Pattern

Every API route handler follows this pattern:
1. Call `getCurrentUser(request)` → return 401 if null
2. Query Supabase using `createAuthenticatedClient(token)` (enforces RLS)
3. Check ownership if accessing a specific resource → return 403 if not owner
4. Return consistent error codes: 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (not found), 500 (server error)

### Data Model

- **prompts** — soft-deleted (sets `deleted_at`), support tags (TEXT array), favorites, optional `collection_id`
- **collections** — hard-deleted, contain multiple prompts
- Both tables support sharing fields (`is_shared`, `share_id`, `share_visibility`) — not yet implemented
- Users are managed by Supabase Auth automatically

### Key Directories

- `app/api/collections/` — CRUD for collections (`route.ts` = list/create, `[id]/route.ts` = get/update/delete)
- `app/api/prompts/` — CRUD for prompts with filtering by `collection_id`, `tag`, `favorite`, and search; soft deletes
- `lib/` — Auth utilities and Supabase clients
- `types/index.ts` — Shared TypeScript types (`User`, `Prompt`, `Collection`, `ShareVisibility`)
- `components/` — Empty, ready for React components

### Path Alias

`@/*` maps to the repo root (e.g., `import { getCurrentUser } from '@/lib/auth'`).

# Strict Workflow Rules

## CRITICAL: File Modification Protocol
You MUST follow this protocol for EVERY task:

1. **Analysis Phase**
   - Read the user's request
   - Determine which files need to be created or modified
   
2. **Confirmation Phase** (REQUIRED)
   - List ALL files that will be affected:
     - Files to be created
     - Files to be modified
     - Files to be read (if relevant)
   - Ask: "I will make changes to these files: [list]. Proceed?"
   - WAIT for explicit "yes" or "proceed" before continuing
   
3. **Execution Phase**
   - Only after confirmation, make the changes
   - ONLY touch the files that were approved

## Styling Rules (NON-NEGOTIABLE)
- Inline styles (style={{}}) are FORBIDDEN
- Use Tailwind utility classes for all styling
- If a style cannot be achieved with Tailwind, use CSS modules
- CSS-in-JS is not allowed

## If Unsure
When in doubt about whether to modify a file, ASK FIRST.