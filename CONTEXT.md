# PromptVault - Project Context

## Project Overview

**PromptVault** is a lightweight, general-purpose prompt management tool that helps users save, organize, and share prompts for AI language models (Claude, ChatGPT, Gemini, etc.). The tool emphasizes prompt engineering best practices through features like reusable variables, collections, and sharing capabilities.

**Core Value Proposition:**
- Save prompts to avoid retyping the same patterns
- Variables system for reusable prompt templates
- Organize prompts into collections (playbooks)
- Share prompts and collections via links
- Quick access anywhere via browser extension
- AI-powered auto-tagging for organization

**Target Users:**
- Developers using AI coding tools
- Content creators using LLMs
- Anyone who uses ChatGPT/Claude/Gemini regularly
- Teams collaborating on prompts

---

## Core Features (MVP - Text-Only)

### 1. Prompt Management
- Create, read, update, delete prompts (text-only)
- Variables system: `{{variable}}` for reusable prompt patterns
- Multi-line content support
- Tagging (hybrid: AI-suggested + manual)
- Favorites
- Soft delete (deleted_at)
- Usage tracking (use_count, last_used_at)

### 2. Collections (Playbooks)
- Group related prompts
- One prompt belongs to one collection (or none)
- Collections have name, description, icon (emoji)

### 3. Sharing System
- Share individual prompts via link
- Share entire collections via link
- Two visibility modes:
  - **Private**: Only accessible via direct link (not in public listings)
  - **Public**: Link + appears in community browse
- Public preview pages (no login required to view)
- Import shared prompts/collections (requires login, creates copy)
- Share analytics: view_count, import_count, timestamps

### 4. Browser Extension
- Sidebar overlay on LLM sites (Claude.ai, ChatGPT, etc.)
- One-click prompt injection into textarea
- Variable popup for fill-in values
- Syncs with web app every 30s
- Always accessible (works on any site with textarea)

### 5. Search & Discovery
- Keyword search (own prompts)
- Filter by tags, favorites, collections
- Browse public shared prompts/collections (community)

**Note**: MVP is text-only. No file attachments. This covers 95% of use cases and allows faster shipping.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect)

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (handles JWT, sessions)
- **API**: Next.js API Routes (serverless functions)
- **Real-time**: Supabase Realtime (for extension sync)

### Browser Extension
- **Manifest**: V3
- **Storage**: Chrome Storage API + Supabase sync
- **Content Scripts**: Inject sidebar on LLM sites
- **Background**: Service worker for sync

### AI Features
- **Provider**: Anthropic Claude API
- **Use Case**: Auto-tagging prompts (suggest tags, user accepts/edits)

### Deployment
- **Web App**: Vercel (recommended - one-click deploy)
- **Database**: Supabase Cloud
- **Extension**: Chrome Web Store + Firefox Add-ons
- **Cost**: ~$12/year (domain only, free tiers for Vercel + Supabase)

---

## Database Schema

### Tables

#### 1. users
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
email             TEXT UNIQUE NOT NULL
username          TEXT UNIQUE NOT NULL
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```
**Note**: Managed by Supabase Auth

#### 2. prompts
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
collection_id     UUID REFERENCES collections(id) ON DELETE SET NULL

-- Core content
title             TEXT NOT NULL
content           TEXT NOT NULL
tags              TEXT[] DEFAULT '{}'

-- Sharing
is_shared         BOOLEAN DEFAULT false
share_id          TEXT UNIQUE
share_visibility  TEXT CHECK (share_visibility IN ('public', 'private'))
share_description TEXT
share_view_count  INTEGER DEFAULT 0
share_import_count INTEGER DEFAULT 0
first_shared_at   TIMESTAMP
last_shared_at    TIMESTAMP

-- User interaction
is_favorite       BOOLEAN DEFAULT false
use_count         INTEGER DEFAULT 0
last_used_at      TIMESTAMP

-- Timestamps
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
deleted_at        TIMESTAMP  -- Soft delete
```

**Indexes:**
```sql
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_collection_id ON prompts(collection_id);
CREATE INDEX idx_prompts_deleted_at ON prompts(deleted_at);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE UNIQUE INDEX idx_prompts_share_id ON prompts(share_id) WHERE share_id IS NOT NULL;
CREATE INDEX idx_prompts_shared ON prompts(is_shared, share_visibility) WHERE is_shared = true;
```

#### 3. collections
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE

-- Core content
name              TEXT NOT NULL
description       TEXT
icon              TEXT  -- Emoji or icon identifier

-- Sharing (same fields as prompts)
is_shared         BOOLEAN DEFAULT false
share_id          TEXT UNIQUE
share_visibility  TEXT CHECK (share_visibility IN ('public', 'private'))
share_description TEXT
share_view_count  INTEGER DEFAULT 0
share_import_count INTEGER DEFAULT 0
first_shared_at   TIMESTAMP
last_shared_at    TIMESTAMP

-- Timestamps
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```

**Indexes:**
```sql
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE UNIQUE INDEX idx_collections_share_id ON collections(share_id) WHERE share_id IS NOT NULL;
CREATE INDEX idx_collections_shared ON collections(is_shared, share_visibility) WHERE is_shared = true;
```

---

## Key Relationships

```
USER
 ├─ has many PROMPTS (user_id)
 └─ has many COLLECTIONS (user_id)

COLLECTION
 └─ has many PROMPTS (collection_id)
 
PROMPT
 ├─ belongs to USER (user_id)
 └─ belongs to COLLECTION (collection_id) - optional (can be NULL)

SHARING
 ├─ Prompt can be shared (share_id, is_shared)
 └─ Collection can be shared (share_id, is_shared)
```

**Important Design Decision**: One prompt can only be in ONE collection (or none). If user wants same prompt in multiple collections, they duplicate it (creates new ID with new user_id). This works like Google Docs - simpler mental model, faster queries.

---

## API Endpoints

### Authentication
```
POST   /api/auth/signup          Create account (email, password, username)
POST   /api/auth/login           Login (email, password)
POST   /api/auth/logout          Logout (invalidate session)
GET    /api/auth/user            Get current user
```

### Prompts
```
POST   /api/prompts              Create prompt
GET    /api/prompts              List all (filters: collection_id, tag, favorite, search)
GET    /api/prompts/:id          Get single prompt
PATCH  /api/prompts/:id          Update prompt
DELETE /api/prompts/:id          Soft delete (sets deleted_at)

POST   /api/prompts/:id/use      Track usage (increment use_count, update last_used_at)
POST   /api/prompts/:id/share    Enable sharing (generates share_id if needed)
GET    /api/prompts/:id/share    Get share status
PATCH  /api/prompts/:id/share    Update share settings (visibility, description)
DELETE /api/prompts/:id/share    Disable sharing (sets is_shared=false)
```

### Collections
```
POST   /api/collections          Create collection
GET    /api/collections          List all
GET    /api/collections/:id      Get collection + prompts
PATCH  /api/collections/:id      Update collection
DELETE /api/collections/:id      Delete collection (hard delete, sets prompts.collection_id=NULL)

POST   /api/collections/:id/share    Enable sharing
GET    /api/collections/:id/share    Get share status
PATCH  /api/collections/:id/share    Update share settings
DELETE /api/collections/:id/share    Disable sharing
```

### Public Sharing (No Auth Required)
```
GET    /p/:shareId               View shared prompt (public page)
POST   /p/:shareId/import        Import prompt (requires auth, creates copy)

GET    /c/:shareId               View shared collection (public page)
POST   /c/:shareId/import        Import collection (requires auth, creates copy)
```

### Search & Discovery
```
GET    /api/search               Search own prompts (query, tags, collection_id)
GET    /api/community            Browse public items (filter: type, sort: popular/recent)
```

---

## File Structure

```
promptvault/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── user/route.ts
│   │   ├── prompts/
│   │   │   ├── route.ts                  (POST create, GET list)
│   │   │   └── [id]/
│   │   │       ├── route.ts              (GET, PATCH, DELETE)
│   │   │       ├── use/route.ts          (POST)
│   │   │       └── share/route.ts        (POST, GET, PATCH, DELETE)
│   │   ├── collections/
│   │   │   ├── route.ts                  (POST create, GET list)
│   │   │   └── [id]/
│   │   │       ├── route.ts              (GET, PATCH, DELETE)
│   │   │       └── share/route.ts        (POST, GET, PATCH, DELETE)
│   │   ├── search/route.ts
│   │   └── community/route.ts
│   │
│   ├── p/[shareId]/
│   │   ├── page.tsx                      Public prompt preview
│   │   └── import/route.ts
│   │
│   ├── c/[shareId]/
│   │   ├── page.tsx                      Public collection preview
│   │   └── import/route.ts
│   │
│   ├── prompts/
│   │   ├── page.tsx                      List prompts
│   │   ├── new/page.tsx                  Create prompt
│   │   └── [id]/page.tsx                 View/edit prompt
│   │
│   ├── collections/
│   │   ├── page.tsx                      List collections
│   │   ├── new/page.tsx                  Create collection
│   │   └── [id]/page.tsx                 View collection
│   │
│   ├── layout.tsx
│   ├── page.tsx                          Homepage/landing
│   └── globals.css
│
├── lib/
│   ├── supabase.ts                       Supabase client setup
│   ├── auth.ts                           getCurrentUser helper
│   └── utils.ts                          Utility functions
│
├── components/
│   ├── PromptCard.tsx
│   ├── CollectionCard.tsx
│   ├── ShareModal.tsx
│   ├── VariablePopup.tsx
│   ├── Navbar.tsx
│   └── Footer.tsx
│
├── types/
│   └── index.ts                          TypeScript interfaces
│
├── extension/                            Browser extension
│   ├── manifest.json
│   ├── background.js                     Sync service worker
│   ├── content.js                        Sidebar injection
│   ├── popup.html
│   ├── popup.js
│   └── styles.css
│
├── .env.local
├── .env.local.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Key Concepts

### 1. Variables (Prompt Engineering Pattern)

**Syntax**: `{{variable_name}}`

**Example**:
```
Prompt content:
"Explain {{topic}} to {{audience}} in {{style}} style"

Variables detected:
- topic
- audience  
- style

When user clicks prompt in extension:
→ Popup appears asking for variable values
→ User fills: topic="quantum computing", audience="beginners", style="simple"
→ Injects: "Explain quantum computing to beginners in simple style"
```

**Benefits**:
- One prompt → infinite variations
- Reusable patterns
- Core prompt engineering technique
- No need to edit prompt for different contexts

**Multi-line variables supported**:
```
"Review this {{language}} code:

{{code}}

Focus on {{criteria}}"

User can paste large code blocks into {{code}} variable
```

---

### 2. Sharing Model

**Fields stored directly on Prompt/Collection** (not separate table):

```typescript
interface Prompt {
  // ... other fields
  is_shared: boolean
  share_id: string | null          // e.g., "xyz789" (8 chars)
  share_visibility: 'public' | 'private' | null
  share_description: string | null
  share_view_count: number
  share_import_count: number
  first_shared_at: Date | null
  last_shared_at: Date | null
}
```

**Visibility Options**:
- **Private**: Only accessible via direct link (not in community browse)
- **Public**: Accessible via link AND appears in community listings

**Share URLs**:
- Prompts: `https://promptvault.com/p/xyz789`
- Collections: `https://promptvault.com/c/abc123`

**Why inline fields instead of separate table:**
- Simpler for MVP
- Faster queries (no joins needed)
- One share link per item is sufficient
- Can migrate to separate table later if multiple share links needed

---

### 3. Import Flow (How Sharing Works)

**User shares a prompt:**
```
1. User creates prompt: "Code Review Template"
2. Clicks "Share" → Enable sharing
3. System generates share_id: "xyz789"
4. Sets is_shared=true, share_visibility="public"
5. User gets link: promptvault.com/p/xyz789
6. User shares link on Twitter/Slack/etc.
```

**Someone imports the shared prompt:**
```
1. Click link: promptvault.com/p/xyz789
2. Public preview page loads (no login required)
   → Shows: title, content, tags, author, stats
3. Click "Import to My Prompts"
4. If not logged in → redirect to login
5. After login → Creates COPY in their account:
   → New UUID
   → New user_id (theirs)
   → Same content, title, tags
   → is_shared=false (their copy is private by default)
6. Original prompt: share_import_count += 1
7. User redirected to their new prompt
```

**Key point**: Import creates a copy, not a reference. Users can edit their copy without affecting the original.

---

### 4. Soft Delete (Prompts Only)

**Why soft delete for prompts:**
- Allow "undo" functionality
- Keep share links working (even if user deletes)
- Audit trail
- Users expect "trash/restore" behavior

**How it works:**
```javascript
// Delete prompt
PATCH /api/prompts/:id
body: { deleted_at: new Date().toISOString() }

// Restore prompt (future feature)
PATCH /api/prompts/:id
body: { deleted_at: null }

// Query prompts (always exclude deleted)
WHERE deleted_at IS NULL

// Permanent delete (admin/cleanup job)
DELETE FROM prompts WHERE deleted_at < NOW() - INTERVAL '30 days'
```

**Collections use hard delete** (less critical, no share dependency issues)

---

### 5. Ownership Verification Pattern

**CRITICAL SECURITY**: Always verify user owns resource before UPDATE/DELETE/GET single item

**Standard pattern:**
```typescript
// app/api/prompts/[id]/route.ts

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  // 1. Get current user
  const user = await getCurrentUser(request)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Verify ownership
  const { data: prompt } = await supabase
    .from('prompts')
    .select('user_id')
    .eq('id', params.id)
    .single()
  
  if (!prompt || prompt.user_id !== user.id) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  
  // 3. Now safe to proceed with update
  const body = await request.json()
  const { data } = await supabase
    .from('prompts')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()
  
  return Response.json(data)
}
```

**Alternative: Use Supabase Row Level Security (RLS)** - more robust:
```sql
CREATE POLICY "Users can only access own prompts"
  ON prompts FOR ALL
  USING (auth.uid() = user_id);
```

With RLS enabled, Supabase automatically filters queries at database level.

---

## Authentication Flow

### Using Supabase Auth

**Signup:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      username: 'johndoe'
    }
  }
})
```

**Login:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
})
```

**Get current user (in API routes):**
```typescript
// lib/auth.ts
export async function getCurrentUser(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return error ? null : user
}
```

**Logout:**
```typescript
await supabase.auth.signOut()
```

**Protected Routes:**
All `/api/*` endpoints require auth EXCEPT:
- `/api/auth/*` (login, signup)
- `/p/:shareId` (GET only - public preview)
- `/c/:shareId` (GET only - public preview)
- `/api/community` (browse public items)

---

## Browser Extension Architecture

### Components

**1. Content Script** (`content.js`)
- Injected on LLM sites (Claude.ai, ChatGPT, Gemini, etc.)
- Detects textarea elements
- Shows sidebar with user's prompts
- Handles click → inject prompt into textarea
- Shows variable popup if prompt contains {{variables}}

**2. Background Service Worker** (`background.js`)
- Syncs with Supabase every 30 seconds
- Fetches user's prompts from API
- Caches in Chrome Storage (fast local access)
- Handles auth token refresh

**3. Popup** (`popup.html/js`)
- Accessible from extension icon (any page)
- Quick search for prompts
- View favorites
- Link to web app
- Login/logout

### Data Flow

```
┌─────────────────────────────────────┐
│  Web App (Supabase Database)       │
│  - User creates/edits prompts      │
└─────────────────┬───────────────────┘
                  │
                  ↓ (sync every 30s)
┌─────────────────────────────────────┐
│  Extension Background Worker        │
│  - Fetches latest prompts           │
│  - Stores in Chrome Storage         │
└─────────────────┬───────────────────┘
                  │
                  ↓ (reads from storage)
┌─────────────────────────────────────┐
│  Content Script (Sidebar)           │
│  - Shows prompts                    │
│  - Injects on click                 │
└─────────────────────────────────────┘
```

**Why Chrome Storage:**
- Fast local access (no network delay)
- Works offline (reads cached prompts)
- Reduces API calls
- Extension can read synchronously

---

## Hybrid Tagging System (AI + Manual)

### How It Works

**When user saves a prompt:**

```
1. User writes prompt content
2. Click "Save" or "Get Tag Suggestions"
3. Send prompt content to Claude API
4. Claude analyzes content, suggests tags
5. Show suggestions to user:
   ┌────────────────────────────────┐
   │ Suggested Tags (AI):           │
   │ [×] #code-review              │
   │ [×] #security                 │
   │ [×] #python                   │
   │                               │
   │ Add custom tags:              │
   │ [+ Add tag________]           │
   │                               │
   │ [Save] [Cancel]               │
   └────────────────────────────────┘
6. User can:
   - Accept all (one click)
   - Uncheck some
   - Add custom tags (#work, #urgent, #todo)
7. Save prompt with final tags
```

**Benefits:**
- Speed: AI suggests instantly
- Control: User decides final tags
- Learning: User discovers relevant tags they didn't think of
- Flexibility: Can add personal/team-specific tags
- Progressive: Works without AI if needed (manual only)

**Implementation:**
```typescript
// app/api/prompts/analyze/route.ts
export async function POST(request: Request) {
  const { content } = await request.json()
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Analyze this prompt and suggest 3-5 relevant tags (one word each, lowercase, no #):

"${content}"

Return only the tags as a comma-separated list.`
      }]
    })
  })
  
  const data = await response.json()
  const tags = data.content[0].text.split(',').map(t => t.trim())
  
  return Response.json({ tags })
}
```

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone repo
git clone https://github.com/yourusername/promptvault.git
cd promptvault

# 2. Install dependencies
npm install

# 3. Set up Supabase
# - Go to supabase.com
# - Create new project
# - Copy project URL and anon key
# - Run SQL from schema below in Supabase SQL Editor

# 4. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 5. Run development server
npm run dev
# Open http://localhost:3000
```

### Database Schema SQL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_shared BOOLEAN DEFAULT false,
  share_id TEXT UNIQUE,
  share_visibility TEXT CHECK (share_visibility IN ('public', 'private')),
  share_description TEXT,
  share_view_count INTEGER DEFAULT 0,
  share_import_count INTEGER DEFAULT 0,
  first_shared_at TIMESTAMP,
  last_shared_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  share_id TEXT UNIQUE,
  share_visibility TEXT CHECK (share_visibility IN ('public', 'private')),
  share_description TEXT,
  share_view_count INTEGER DEFAULT 0,
  share_import_count INTEGER DEFAULT 0,
  first_shared_at TIMESTAMP,
  last_shared_at TIMESTAMP,
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_collection_id ON prompts(collection_id);
CREATE INDEX idx_prompts_deleted_at ON prompts(deleted_at);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE UNIQUE INDEX idx_prompts_share_id ON prompts(share_id) WHERE share_id IS NOT NULL;
CREATE INDEX idx_prompts_shared ON prompts(is_shared, share_visibility) WHERE is_shared = true;

CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE UNIQUE INDEX idx_collections_share_id ON collections(share_id) WHERE share_id IS NOT NULL;
CREATE INDEX idx_collections_shared ON collections(is_shared, share_visibility) WHERE is_shared = true;

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prompts
CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for collections
CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);
```

### Build Order (2-Week Sprint)

**Week 1: Core Features**
- Day 1: Project setup, Supabase config, auth endpoints
- Day 2: Prompts CRUD (create, list, view, edit, delete)
- Day 3: Collections CRUD, prompt organization
- Day 4: Sharing system (prompts)
- Day 5: Sharing system (collections)

**Week 2: Extension & Polish**
- Day 1: Browser extension basic structure, sidebar injection
- Day 2: Extension prompt injection, variable popup
- Day 3: Search, filters, community browse
- Day 4: AI tagging, UI polish, testing
- Day 5: Deploy to Vercel, publish extension

---

## Environment Variables

```bash
# .env.local

# Supabase (get from supabase.com dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...

# App URL
NEXT_PUBLIC_URL=http://localhost:3000  # dev
# NEXT_PUBLIC_URL=https://promptvault.com  # production

# Optional: AI Features
ANTHROPIC_API_KEY=sk-ant-xxxxx...  # For auto-tagging
```

---

## Design Decisions & Rationale

### 1. Text-Only MVP (No File Attachments)

**Decision**: MVP supports text prompts only. No file uploads.

**Rationale**:
- 95%+ of prompts are text-only (validated by PromptBase, ChatGPT community)
- Ships 3 weeks faster
- Simpler mental model for users
- Lower costs (no storage/bandwidth)
- Can add files in v2.0 if users request it (20%+ adoption signal)

**Workaround for files**:
- Multi-line variables: Users paste code/data into {{code}} variable
- Context templates: "You're reviewing {{type}} code. User will paste code in next message."

### 2. One Prompt, One Collection

**Decision**: Prompt has `collection_id` field (not many-to-many join table)

**Rationale**:
- Simpler queries (no joins)
- Faster performance
- Clearer mental model (like Google Docs folders)
- If user wants prompt in multiple collections → duplicate it

**Trade-off**: Must duplicate prompts for multiple collections (acceptable for MVP)

### 3. Sharing Fields on Model

**Decision**: Add sharing fields directly to `prompts` and `collections` tables

**Rationale**:
- Simpler for MVP
- Fewer joins → faster queries
- One share link per item is sufficient
- Can migrate to separate `shares` table later if needed

### 4. Soft Delete for Prompts

**Decision**: Use `deleted_at` timestamp instead of DELETE

**Rationale**:
- Allow undo functionality
- Keep shared prompts accessible (links don't break)
- Audit trail
- Collections use hard delete (less critical)

### 5. Hybrid Tagging (AI + Manual)

**Decision**: AI suggests tags, user accepts/rejects/adds custom

**Rationale**:
- Best of both worlds: speed + control
- Users learn from AI suggestions
- Can customize for personal/team conventions
- Works without AI (manual fallback)

### 6. Next.js Over Plain React

**Decision**: Use Next.js App Router instead of plain React + separate backend

**Rationale**:
- Built-in API routes (no separate Express server)
- File-based routing (simpler than React Router)
- Server-side rendering (better for share link previews, SEO)
- One-click Vercel deployment
- Smaller codebase (frontend + backend together)

---

## Common Queries

### Get all prompts in a collection
```typescript
const { data } = await supabase
  .from('prompts')
  .select('*')
  .eq('collection_id', collectionId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
```

### Get uncategorized prompts
```typescript
const { data } = await supabase
  .from('prompts')
  .select('*')
  .is('collection_id', null)
  .is('deleted_at', null)
```

### Search prompts
```typescript
const { data } = await supabase
  .from('prompts')
  .select('*')
  .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
  .is('deleted_at', null)
```

### Get prompts by tag
```typescript
const { data } = await supabase
  .from('prompts')
  .select('*')
  .contains('tags', [tag])
  .is('deleted_at', null)
```

### Get public shared prompts
```typescript
const { data } = await supabase
  .from('prompts')
  .select('*, users(username)')
  .eq('is_shared', true)
  .eq('share_visibility', 'public')
  .is('deleted_at', null)
  .order('share_import_count', { ascending: false })
  .limit(20)
```

---

## Deployment

### Web App (Vercel)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/promptvault.git
git push -u origin main

# 2. Deploy to Vercel
# - Go to vercel.com
# - Import GitHub repository
# - Add environment variables:
#   - NEXT_PUBLIC_SUPABASE_URL
#   - NEXT_PUBLIC_SUPABASE_ANON_KEY
#   - NEXT_PUBLIC_URL (your production URL)
#   - ANTHROPIC_API_KEY
# - Deploy

# 3. Done! App is live at promptvault.vercel.app
# 4. Add custom domain in Vercel settings
```

### Browser Extension

```bash
# 1. Build extension
cd extension
# Update manifest.json with production API URL
# Zip all files

# 2. Chrome Web Store
# - Go to chrome.google.com/webstore/devconsole
# - Pay $5 one-time developer fee
# - Upload zip
# - Fill in details, screenshots
# - Submit for review (1-3 days)

# 3. Firefox Add-ons
# - Go to addons.mozilla.org/developers
# - Upload zip
# - Submit for review
```

---

## Future Enhancements (Post-MVP)

**Version 1.1 (Month 2)**
- File attachments to prompts (if 20%+ users request)
- Prompt analytics dashboard
- Export prompts (JSON, CSV)

**Version 2.0 (Month 3-4)**
- Semantic search with embeddings (find similar prompts)
- Prompt chaining/workflows
- Team collaboration features
- Premium tier

**Version 3.0 (Month 5+)**
- Mobile app (React Native)
- Prompt quality scoring
- A/B testing variations
- Marketplace for selling prompts

---

## Troubleshooting

### Supabase RLS Issues

If queries fail with "permission denied":

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verify policies exist
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Recreate policies (see Database Schema SQL above)
```

### Extension Not Syncing

1. Check Chrome Storage permissions in `manifest.json`
2. Verify background service worker is running (chrome://extensions)
3. Check Supabase credentials in extension code
4. Look for errors in extension console (Inspect background page)

### Auth Token Issues

```typescript
// In API routes, always check for valid user
const user = await getCurrentUser(request)
if (!user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

// On frontend, refresh token before expiry
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed')
  }
})
```

---

## Testing Strategy

### Unit Tests
- Utility functions (variable parsing, tag extraction)
- Supabase query builders
- Auth helpers

### Integration Tests
- API endpoints (all CRUD operations)
- Auth flow (signup, login, logout)
- Sharing flow (create share, import)

### E2E Tests (Optional)
- User journey: Create account → Create prompt → Share → Import
- Browser extension: Inject prompt → Fill variables → Use

**Testing Tools:**
- Jest for unit tests
- Playwright for E2E tests
- Postman for API testing

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Anthropic API Reference](https://docs.anthropic.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## Contributing

See [CONTRIBUTING.md] for development guidelines.

---

**Last Updated**: 2026-04-04  
**Version**: 1.0.0 (MVP)  
**Status**: In Development
