# Life Backend — Product Requirements Document v2

*Draft: 2026-04-11*
*Authors: Peter McEvoy, Claude*

---

## 1. What This Is

A personal management platform for organizing all of Peter's work, projects, creative output, and life logistics. Two apps: a **mobile capture PWA** for quick notes on the go, and a **desktop web app** for planning, processing, and reflection.

Think ClickUp or Asana, but simpler, less noisy, and built for one person. The desktop app should feel like a clean file browser (Google Drive-like) crossed with a task manager, with a calm, doc-like aesthetic (closer to Notion or Obsidian than to Jira).

**Core philosophy:**

- Capture everything, lose nothing
- AI assists, human decides
- Human-readable files (markdown, plain text)
- Degradable — the app must work fully without AI; AI enhances but is never required
- Simple structure, flexible content

---

## 2. The User

Peter. Solo user. Fabrication/design professional, creative practitioner (art, writing, music), community organizer (Makerfarm).

**Contexts of use:**

- **In the shop** — hands dirty, capturing notes via phone (voice, quick text, photos)
- **At the desk** — evening/weekend processing sessions: triaging inbox, planning projects, writing SOPs, journaling
- **On the go** — random thoughts, reflections, quick reminders via mobile

---

## 3. Daily Rhythm

The system supports a **capture-throughout → evening-process-and-reflect** workflow:

```
Morning / Throughout the day:
├── Quick captures via mobile PWA (tasks, ideas, photos, voice)
├── Reflection captures (💭) — fleeting observations about self, behavior, patterns
└── Work on active projects (reference SOPs, check off tasks)

Evening sit-down (desktop):
├── Process inbox — AI-assisted triage of day's captures into projects/SOPs
├── Review today's tasks and upcoming blockers
├── Journal/reflect — today's 💭 captures surface as prompts
└── Update SOPs with anything learned
```

---

## 4. Domains

All content lives within one of four top-level domains. Every project, task, SOP, and note belongs to a domain.

| Domain | What it covers |
|---|---|
| **Work** | Day job fabrication, client projects, shop work |
| **Creative** | Art/sculpture (bronze project etc.), writing (short stories, memoir), music production, personal design business (New Power Industry), business operations |
| **Makerfarm** | Community committee work, events, shared resources |
| **Life** | Taxes, legal, healthcare, car maintenance, housing, food/recipes, personal admin |

Journaling and SOPs are **cross-cutting** — they span all domains rather than living in just one.

---

## 5. Architecture Overview

### Two Apps, Shared Data

```
┌──────────────────────┐     ┌──────────────────────────────────┐
│  Mobile Capture PWA  │     │     Desktop Web App              │
│  (phone, on the go)  │     │     (browser, local server)      │
│                      │     │                                  │
│  • Quick text input  │     │  • File browser (Drive-like)     │
│  • Voice recording   │     │  • Inbox processing (AI triage)  │
│  • Photo + markup    │     │  • Projects + tasks              │
│  • 💭 Reflections    │     │  • Calendar (week/month)         │
│  • View inbox        │     │  • Journal + reflections         │
│  • Journal view      │     │  • SOPs                          │
│                      │     │  • Quick capture (desktop ver.)  │
└──────────┬───────────┘     └────────────────┬─────────────────┘
           │                                  │
           └──────────┐    ┌──────────────────┘
                      ▼    ▼
              ┌────────────────────┐
              │   Shared Markdown  │
              │   File Store       │
              │                    │
              │   workspace/       │
              │   ├── inbox.md     │
              │   ├── journal/     │
              │   ├── projects/    │
              │   └── sops/        │
              └────────────────────┘
```

Both apps read and write the same markdown files. Sync mechanism (git, Syncthing, shared folder) is TBD — for now, assume both can access the same filesystem.

### Technical Stack

- **Desktop app**: Local web app served from the machine, opened in browser. Lightweight enough to start with Express + vanilla JS/HTML, but designed so the frontend can be upgraded (React, Tauri, Electron) later without changing the data layer.
- **Mobile app**: The existing Task Capture PWA (`project-tracker/pwa/`). Already built and functional.
- **Storage**: Plain markdown files with YAML frontmatter. Git-friendly, human-readable, portable.
- **AI**: Claude API for inbox processing. Called from the server, not the client. The app must function completely without AI — the triage step just becomes manual.
- **Compatibility**: Files should be Obsidian-compatible where possible — `#hashtags`, `[[wikilinks]]`, YAML frontmatter. This means journal entries and notes can also be browsed in Obsidian if desired.

---

## 6. File Structure

```
workspace/
├── inbox.md                         # Global capture inbox (date-grouped)
│
├── journal/
│   └── YYYY-MM-DD.md                # Daily journal entries
│
├── projects/
│   ├── work/
│   │   └── {project-name}/
│   │       ├── todo.md              # Task list
│   │       ├── notes/               # Date-stamped work log
│   │       │   └── YYYY-MM-DD.md
│   │       └── media/               # Photos, DXFs, reference files
│   │
│   ├── creative/
│   │   └── {project-name}/...
│   │
│   ├── makerfarm/
│   │   └── {project-name}/...
│   │
│   └── life/
│       └── {project-name}/...
│
└── sops/
    ├── fabrication/
    │   └── {procedure}.md
    ├── finishing/
    │   └── {procedure}.md
    └── {domain}/
        └── {procedure}.md
```

### File Formats

**Inbox entry** (inside `inbox.md`):
```markdown
## 2026-04-11

- Need to order stainless grinding discs #work #planterbox
- Tab width for 10ga SS — ask laser shop #work
- Random idea: paper tiffany lamps for market? #creative
- Noticed I keep procrastinating on the budget stuff — fear of finding bad news? #reflection
```

**Project todo.md**:
```markdown
---
domain: work
status: active
created: 2026-03-15
---

# Planter Box Build

## Next Actions
- [ ] Get DXF files cut at Seaport
- [ ] Assemble and tack weld (blocked by: DXF cutting)
- [ ] Final welding pass

## Backlog
- [ ] Photo shoot for portfolio
- [ ] Write up SOP for perforated bends

## Done
- [x] Finish DXF design — 2026-03-20
- [x] Order stainless grinding discs — 2026-03-18
```

**Journal entry** (`journal/2026-04-11.md`):
```markdown
---
date: 2026-04-11
updated: 2026-04-11T21:30:00Z
---

# Journal — 2026-04-11

Noticed today that I keep putting off the budget review...
```

**SOP** (`sops/fabrication/mig-welding-6061-aluminum.md`):
```markdown
---
domain: fabrication
created: 2026-02-10
related:
  - "[[planter-box-build]]"
---

# MIG Welding Parameters for 6061 Aluminum (Spray Transfer)

Brief description of when/why to use this.

## Prerequisites
- 100% Argon shielding gas
- DCEP polarity

## Steps
1. Set gas flow to 15-20 LPM
2. Use push technique, not drag
...

## Parameters
| Filler | Wire Dia | Amps | Volts | WFS |
|--------|----------|------|-------|-----|
| ER5356 | 0.9mm    | 160  | 22    | 8m  |

## Tips & Gotchas
- Preheat thick sections to 150°F
```

---

## 7. Desktop App — MVP Views

### 7.1 Dashboard (Home)

The landing page when you open the app. Shows at a glance:

- **Today's tasks** — tasks due today or overdue, across all projects
- **Upcoming blockers** — tasks that are blocked, with what's blocking them
- **Recent captures** — last few inbox items (unprocessed)
- **Quick capture widget** — text input + 💭 reflection button, same as the mobile app so you can jot things down from desktop too
- **Calendar snippet** — this week's view (compact)

### 7.2 File Browser

A Google Drive-like file tree. Left sidebar shows the domain/project hierarchy:

```
▶ Work
  ▶ Planter Box Build
  ▶ Client: Johnson Railing
▶ Creative
  ▶ Bronze Sculpture
  ▶ Paper Tiffany Lamps
▶ Makerfarm
  ▶ Spring Event 2026
▶ Life
  ▶ Tax Prep 2025
  ▶ Honda Odyssey Maintenance
```

Clicking a project opens its contents — todo.md rendered as a task list, notes, media files. Files are browsable and editable in place.

### 7.3 Inbox

Shows all unprocessed captures from `inbox.md`, grouped by date (newest first).

**Manual mode**: Drag/move items to projects, mark as done, delete.

**AI-assisted triage** (Claude API): Press "Process inbox" and the AI suggests for each item: which project it belongs to, whether it's a task or a note, whether it could become an SOP. You confirm or reject each suggestion. Nothing moves without your approval.

### 7.4 Projects

A task-focused view. Shows all projects with their status (Active / On Hold / Complete), filterable by domain. Within a project:

- Task list with checkboxes, grouped into Next Actions / Backlog / Done
- Simple blockers: mark a task as "blocked by [other task]" — blocked tasks are visually dimmed and show what's blocking them
- Work log: date-stamped notes
- Media gallery: photos, DXFs, reference files

### 7.5 Calendar

Two sub-views:

**Weekly/Daily view**: What's due this week. Tasks with due dates, reminders, any time-blocked items. Simple, not trying to be Google Calendar — just "here's what's coming up."

**Monthly overview**: A month grid showing project activity, deadlines, and milestones. Colored by domain. This is the placeholder view that eventually gets replaced by the donut calendar in v1.5.

### 7.6 Journal

Same concept as the PWA journal view:

- **Thoughts from today**: Today's `#reflection` captures displayed as cards at the top
- **Writing area**: Clean, light, serif-font editor for freeform journaling. Auto-saves. Obsidian-compatible output (hashtags, frontmatter).
- **Past entries**: Browse/search previous journal entries by date

### 7.7 SOPs

Browse and create Standard Operating Procedures:

- **Browse by domain**: fabrication, finishing, etc.
- **Search**: Full-text search across all SOPs
- **Create/edit**: Markdown editor with the SOP template pre-populated
- **Cross-references**: SOPs can link to projects (via `[[wikilinks]]`) and vice versa

---

## 8. AI Integration

### Scope in V1

AI is used **only for inbox processing**. Everything else is manual.

### How Inbox Triage Works

1. User presses "Process inbox" on the desktop app
2. Server sends unprocessed inbox items to Claude API with context about existing projects and domains
3. Claude returns suggestions for each item:
   - Suggested project assignment
   - Whether it's a task, note, or potential SOP
   - Extracted hashtags / domain classification
4. Desktop app shows suggestions inline — user confirms, edits, or rejects each one
5. Confirmed items are moved to their destinations (project todo.md, SOP draft, etc.)

### Degradability

If the Claude API is unavailable, unreachable, or the user hasn't configured an API key:

- Inbox processing falls back to fully manual drag-and-drop
- All other features work identically
- No feature should show an error or be disabled due to missing AI

### Future AI Features (Post-MVP)

- Post-journal reflection dialogue (searching questions after journaling)
- SOP drafting from notes
- Task prioritization suggestions
- Connections between notes across projects
- Reminders and nudges

---

## 9. Reminders & Notifications

### MVP

- **Due date reminders**: Tasks with due dates surface on the dashboard and calendar
- **Stale project alerts**: Projects not touched in 2+ weeks get flagged on the dashboard
- **Context-aware**: No notifications at night or outside configured hours

### Future

- Push notifications to mobile PWA
- "Remind me Monday" natural language parsing in captures
- Recurring reminders (e.g., car registration renewal annually)

---

## 10. What Already Exists

### Task Capture PWA (`project-tracker/pwa/`)

A working mobile-first Progressive Web App with:

- Quick text capture → `inbox.md`
- Voice recording (with Whisper transcription endpoint)
- Photo capture with markup/annotation tools
- 💭 Reflection capture (tagged `#reflection`)
- Journal view with "Thoughts from today" + writing area
- Journal entries saved as `journal/YYYY-MM-DD.md`
- Express backend (`server.js`) with REST API
- Dark theme, mobile-optimized
- Service worker for offline capability

**API endpoints**:
- `GET/POST/DELETE /api/notes` — inbox CRUD
- `GET /api/reflections/today` — today's reflection-tagged notes
- `GET/POST /api/journal/:date` — journal entry CRUD
- `GET /api/journal` — list all journal dates
- `POST /api/transcribe` — Whisper voice transcription

### Existing Content

- Google Drive contains 80+ projects and life areas already documented
- Existing SOPs (welding parameters, DXF conversion, patina techniques)
- Business task lists, project notes, reference materials
- All of this is potential migration content once the platform is running

---

## 11. Design Principles

1. **File-first**: Markdown files are the source of truth, not a database. The app is a nice UI on top of files you could also edit in a text editor or Obsidian.

2. **Obsidian-compatible**: Use `#hashtags`, `[[wikilinks]]`, and YAML frontmatter so files work in Obsidian out of the box.

3. **Content portability**: Everything you create in V1 must survive a rewrite. No data locked in app-specific formats. If the app dies, you still have your files.

4. **Progressive enhancement**: Start with what works (web app in browser), upgrade later (Electron/Tauri for a native feel). The data layer doesn't change.

5. **Calm UI**: Light, doc-like aesthetic. No gamification, no badge counts screaming for attention, no marketing upsells. Clean sidebar, readable typography, lots of white space.

6. **One person, no permissions**: No user accounts, no sharing model, no access control. This is Peter's app. Simplify everything that multi-user apps make complex.

---

## 12. MVP Scope Summary

### In MVP

- [ ] Desktop web app (Express + frontend, served locally, opened in browser)
- [ ] Dashboard with today's tasks, upcoming blockers, recent captures, quick capture widget
- [ ] File browser (domain → project hierarchy, view/edit files)
- [ ] Inbox view with manual processing + AI-assisted triage (Claude API)
- [ ] Project view with task management, simple blockers, work log, media
- [ ] Calendar (weekly + monthly views)
- [ ] Journal view (reflection prompts + writing area + past entries)
- [ ] SOP browser/editor with search and cross-references
- [ ] Four domains: Work, Creative, Makerfarm, Life
- [ ] Shared markdown file store compatible with existing PWA
- [ ] Light, doc-like visual design

### Post-MVP (v1.5+)

- [ ] Donut calendar (circular annual view)
- [ ] AI post-journal reflection dialogue
- [ ] AI-drafted SOPs from notes
- [ ] Push notifications to mobile
- [ ] Natural language reminders ("remind me Monday")
- [ ] Google Drive content migration tooling
- [ ] Purchasing automation ("just buy it" flow)
- [ ] Time tracking / clock in-out per project
- [ ] Video → SOP generation
- [ ] DXF processing automation
- [ ] Learning/tutoring features (quiz mode, study materials)

---

## 13. Open Questions

1. **Sync mechanism**: How do the mobile PWA and desktop app share the same files across devices? Git, Syncthing, shared folder, or a central server?

2. **Server architecture**: Should the desktop app's Express server be the same server as the PWA's, or a separate one? Could one server serve both UIs?

3. **Search implementation**: Full-text search across all markdown files — built-in (ripgrep, lunr.js) or external (MeiliSearch)?

4. **Image/media storage**: Photos and DXFs in the file tree, or a separate media store with references?

5. **Backup strategy**: Git is the obvious answer, but needs to be set up. Auto-commit on save? Manual commits?

6. **Migration path**: When/how to migrate existing Google Drive content into the workspace file structure?

---

## 14. Technical Notes for Implementation

This section is guidance for Claude Code when building the desktop app.

### Server

- Express.js on Node, same stack as the existing PWA server
- Serve the desktop frontend on a different port (e.g., 3001) or as a separate route namespace
- API endpoints should be RESTful and map cleanly to file operations
- Claude API integration should be a single module with a clean interface, easy to swap out or disable
- All file operations go through a data access layer, never direct `fs` calls from route handlers

### Frontend

- Start simple: vanilla HTML/CSS/JS or lightweight framework (Alpine.js, htmx)
- Can upgrade to React/Svelte later — keep components modular
- Sidebar navigation: Dashboard | Files | Inbox | Projects | Calendar | Journal | SOPs
- Responsive enough to be usable but this is primarily a desktop app
- Markdown rendering: use a library (marked, markdown-it) for displaying .md files
- Editor: contenteditable div for journal, CodeMirror or similar for markdown editing

### File Operations

- Reading: Parse YAML frontmatter + markdown body
- Writing: Preserve frontmatter, update body, write back
- Task parsing: Read `- [ ]` and `- [x]` checkboxes from todo.md files
- Blocker parsing: Convention like `(blocked by: Task Name)` in task text
- Hashtag/wikilink extraction for cross-referencing

### API Design (Draft)

```
GET    /api/dashboard          # Aggregated dashboard data
GET    /api/inbox              # All inbox items
POST   /api/inbox              # New capture
POST   /api/inbox/process      # AI-assisted triage
GET    /api/projects           # List all projects
GET    /api/projects/:domain   # List projects in domain
GET    /api/projects/:domain/:name          # Project detail
POST   /api/projects/:domain/:name/tasks    # Add task
PATCH  /api/projects/:domain/:name/tasks/:id # Update task
GET    /api/calendar           # Calendar events/tasks
GET    /api/journal            # List journal entries
GET    /api/journal/:date      # Get journal entry
POST   /api/journal/:date      # Save journal entry
GET    /api/sops               # List all SOPs
GET    /api/sops/:domain       # SOPs by domain
GET    /api/sops/:domain/:name # Get SOP
POST   /api/sops/:domain       # Create SOP
PUT    /api/sops/:domain/:name # Update SOP
GET    /api/search?q=          # Full-text search
```

---

*This document is the blueprint for building the Life Backend desktop app. It should be kept in the `project-tracker` repo and updated as decisions are made during development.*
