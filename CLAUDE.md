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


# Project Instructions for AI Assistants

## 1. SCOPE CONTROL RULES

### Change Boundaries
```markdown
**CRITICAL: Ask before making changes to:**
- File structure or directory organization
- Package.json dependencies
- Build configuration (webpack, vite, tsconfig, etc.)
- Environment variables or .env files
- Database schemas or migrations
- API routes or endpoints
- Authentication/authorization logic

**Always confirm before:**
- Deleting files or functions
- Refactoring code outside the immediate request
- Changing component APIs that affect other files
- Modifying state management patterns
- Altering data flow or prop drilling patterns

**Never do without explicit request:**
- "Improving" or "cleaning up" code that wasn't mentioned
- Renaming files or folders for "consistency"
- Adding features "while I'm here"
- Changing styling of unrelated components
- Reformatting entire files when changing one function
```

### Single Responsibility per Request
```markdown
When asked to "add a button":
✅ Add the button as requested
❌ Don't also refactor the entire component
❌ Don't reorganize imports
❌ Don't update styling of other elements
❌ Don't add error handling that wasn't requested

If you see issues, mention them separately:
"I've added the button as requested. I noticed [issue X] - would you like me to address that separately?"
```

---

## 2. STYLING ARCHITECTURE

### Approach: [Choose ONE per project]

#### Option A: Tailwind with Design Tokens
```markdown
**REQUIRED STYLING APPROACH:**
- Use Tailwind utility classes ONLY
- All colors/spacing MUST come from tailwind.config.js
- NO arbitrary values like `bg-[#ff0000]` or `w-[127px]`
- NO inline styles via the style prop
- Custom utilities go in @layer utilities in globals.css

**Design Token Location:**
- Colors: tailwind.config.js → theme.extend.colors
- Spacing: tailwind.config.js → theme.extend.spacing
- Typography: tailwind.config.js → theme.extend.fontFamily

**Example:**
✅ `className="bg-primary-500 text-lg px-spacing-md"`
❌ `style={{ backgroundColor: '#3b82f6' }}`
❌ `className="bg-blue-500"` (use semantic tokens instead)
```

#### Option B: CSS Modules
```markdown
**REQUIRED STYLING APPROACH:**
- Each component gets a .module.css file
- NO inline styles via style prop
- NO global CSS except in globals.css
- Use CSS custom properties for theming

**File Structure:**
```
Button/
  ├── Button.tsx
  ├── Button.module.css
  └── index.ts
```

**CSS Variables Location:**
- :root variables in styles/variables.css
- Import order: variables → globals → component modules

**Example:**
✅ `className={styles.primaryButton}`
✅ `background: var(--color-primary);`
❌ `style={{ backgroundColor: 'blue' }}`
```

#### Option C: Styled Components / Emotion
```markdown
**REQUIRED STYLING APPROACH:**
- All styles in styled-components with theme provider
- NO inline styles via style prop
- NO CSS files (except global resets)
- Theme values MUST come from theme.ts

**Theme Location:**
- theme/index.ts exports default theme object
- Colors, spacing, typography defined there
- Use theme props: ${props => props.theme.colors.primary}

**Example:**
✅ `const Button = styled.button\`background: ${p => p.theme.colors.primary};\``
❌ `<button style={{ background: 'blue' }}>`
```

---

## 3. COMPONENT ARCHITECTURE

### Component Structure
```markdown
**REQUIRED STRUCTURE for all components:**

1. Imports (grouped and ordered)
   - React/Next/framework imports
   - Third-party libraries
   - Local components
   - Types
   - Styles/constants

2. Types/Interfaces
   - Props interface
   - Local types

3. Component definition
   - Props destructuring
   - Hooks (useState, useEffect, custom hooks)
   - Derived state/computed values
   - Event handlers
   - Return JSX

4. Exports
   - Named export for testing
   - Default export for usage

**Example:**
```typescript
// ✅ CORRECT
import { useState } from 'react';
import { Button } from '@/components/ui';
import type { User } from '@/types';
import styles from './UserCard.module.css';

interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToggle = () => setIsExpanded(!isExpanded);
  
  return (
    <div className={styles.card}>
      {/* ... */}
    </div>
  );
}

export default UserCard;
```

### State Management Rules
```markdown
**When to use each:**
- useState: Component-local state only
- useContext: App-wide theme, auth, user preferences
- Props: Parent-to-child data flow
- Custom hooks: Reusable logic (useAuth, useFetch)

**NEVER:**
- Prop drilling more than 2 levels (use context or composition)
- Storing derived state (calculate on render)
- Duplicating state across components

**Ask before:**
- Adding global state management (Redux, Zustand)
- Creating new contexts
- Changing state management patterns
```

### Linting
- Add semi colons after each line of code 

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

## Linting Rules
- End all lines with a semicolon

## If Unsure
When in doubt about whether to modify a file, ASK FIRST.