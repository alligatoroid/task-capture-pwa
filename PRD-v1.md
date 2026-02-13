# Task & Project Management App — PRD v1

*Draft: 2026-02-07*
*Author: Hugo (with Peter)*

---

## Overview

A personal "life backend" system for capturing, organizing, and executing on work — spanning fabrication projects, personal life, learning, and everything in between.

**Core philosophy:**
- Capture everything, lose nothing
- AI assists, human decides
- Human-readable files (markdown, plain text)
- Simple structure, flexible content

---

## Problem Statement

Peter currently uses paper notes for capture, periodically collating and sorting them into categories. This works but has limitations:
- No search
- No reminders
- No cross-referencing
- Manual effort to maintain
- Hard to access on the go

The goal is to digitize this workflow while preserving what works: quick capture, periodic processing, project-based organization.

---

## User

Primary: Peter (solo user)

Contexts:
- **In the shop** — hands dirty, need voice/quick capture
- **At the desk** — planning sessions, processing inbox, writing SOPs
- **On the go** — random thoughts, quick reminders

---

## Core Workflow

```
┌─────────────┐
│   CAPTURE   │  Voice, text, photo → inbox.md
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   PROCESS   │  Periodic triage session (AI-assisted)
└──────┬──────┘
       │
       ├──→ Projects (tasks, notes)
       ├──→ SOPs (generalizable knowledge)
       ├──→ Purchases (order it)
       └──→ Archive (done/irrelevant)
       
       ▼
┌─────────────┐
│   EXECUTE   │  Work on projects, check off tasks
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   REFLECT   │  End of day: update SOPs, note learnings
└─────────────┘
```

---

## File Structure

```
workspace/
├── inbox.md                    # Global capture (organized by date)
│
├── projects/
│   └── {project-name}/
│       ├── todo.md             # Task list (pre-populated template)
│       ├── media/              # Images, DXFs, reference files
│       └── notes/              # Optional date-stamped work log
│           └── YYYY-MM-DD.md
│
└── sops/
    └── {domain}/               # e.g., metalworking, fabrication, finishing
        └── {procedure}.md      # Cross-project reference docs
```

### Inbox Format

```markdown
# Inbox

## 2026-02-07

- Need to order stainless grinding discs #planterbox
- Tab width for 10ga SS — ask laser shop #fabrication
- Random idea: paper tiffany lamps for market? #business

## 2026-02-06

- Respirator strap broke, need 3M replacement #purchase
- Call dentist if no callback by Monday #personal
```

**Conventions:**
- Hashtags for loose project/category association
- One line per thought (can be expanded later)
- Date headers for chronological context

### Project todo.md Template

```markdown
# {Project Name}

## Status
Active | On Hold | Complete

## Next Actions
- [ ] 

## Backlog
- [ ] 

## Done
- [x] 
```

### SOP Format

```markdown
# {Procedure Name}

{Brief description of when/why to use this}

## Prerequisites
- 

## Steps
1. 
2. 
3. 

## Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
|           |       |       |

## Tips & Gotchas
- 

## Related
- [[other-sop]]
- [[project-that-uses-this]]
```

---

## MVP Features

### 1. Capture
- [ ] Quick text input → inbox.md (with auto date header)
- [ ] Voice transcription → inbox.md
- [ ] Photo attachment → project media folder
- [ ] Hashtag parsing for project association

### 2. Process (AI-Assisted)
- [ ] "Process inbox" command triggers triage session
- [ ] AI suggests: project assignment, task extraction, SOP candidates
- [ ] Human confirms each suggestion (tight grip)
- [ ] Move/copy items to appropriate locations

### 3. Projects
- [ ] Create new project (pre-populated template)
- [ ] List projects (with status)
- [ ] Add task to project
- [ ] Mark task complete
- [ ] View project tasks

### 4. SOPs
- [ ] Create new SOP (with template)
- [ ] Browse SOPs by domain
- [ ] Search SOPs
- [ ] Link SOP ↔ project references

### 5. Reminders
- [ ] Date-based reminders ("remind me Monday")
- [ ] Stale project alerts ("hasn't been touched in 2 weeks")
- [ ] Context-aware delivery (don't nag at night)

### 6. Search
- [ ] Full-text search across all files
- [ ] Filter by project, date, hashtag

---

## Future Features (Post-MVP)

### Purchasing Automation
- "Just buy it" flow for supplies
- Integration with Amazon/suppliers
- Track pending orders

### Learning & Tutoring
- Organize questions by subject
- Generate study materials
- Quiz mode for retention
- PLM/BOM management training

### Fabrication Tools
- DXF processing automation (micro joints, nesting)
- Part versioning and naming conventions
- BOM generation and tracking
- Part labeling for laser cuts

### Video → SOP
- Record process video
- Auto-generate SOP with extracted frames
- Edit and refine

### Work Tracking
- Clock in/out of projects
- Time tracking per project
- Daily/weekly summaries

### Life Backend
- Calendar integration
- Finance/tax organization
- Travel planning
- Restaurant/activity recommendations

---

## Reach Goals (Nice-to-Have, Not Core)

### Circular/Wheel Calendar (Donut-Shaped Annual View)
- **Concept:** A year-shaped wheel/donut calendar showing all projects and events
- **Visual:** Circular layout with months as wedges or concentric rings
- **Purpose:** Peter's idiosyncratic annual planning system — visualize the year as a whole
- **Implementation Ideas:**
  - GUI port from Google Calendar (circular rendering of calendar data)
  - Interactive wheel: rotate to view different months/quarters
  - Color-coded by project type or domain
  - Integration with existing inbox/project data
- **Note:** Peter has illustrations to clarify the exact visualization needed
- **Status:** Documented for future exploration, not blocking MVP

### Custom Annual Planning System
- Personalized time segmentation (not standard months/quarters)
- Visual planning horizons (immediate, mid-term, long-term)
- Seasonal or context-based organization
- Integrate with project deadlines and milestones

---

## Technical Decisions

### Storage: Plain Markdown Files
**Why:**
- Human-readable without special tools
- Version control friendly (git)
- Portable, no lock-in
- Easy to script/automate
- **Newest first** — reverse chronological in all docs for quick access

### Interface: Telegram + Direct File Access
- **Telegram:** Voice notes, text, photos → Hugo captures to inbox
- **Desktop:** Chat with Hugo directly, or browse/edit files yourself
- **No separate app needed** — Hugo is the interface

### Input: Multi-Modal
- **Text:** Telegram messages
- **Voice:** Telegram voice notes → Whisper transcription
- **Photos:** Telegram attachments

### AI Role: Assistant, Not Decider
- AI suggests organization and connections
- AI drafts SOPs from notes
- AI reminds and nudges
- Human approves all filing decisions
- Human owns the structure

### Sync: Git-Based (Later)
- Local-first, files on disk
- Git for backup and history
- Potential multi-device sync via repo

---

## Open Questions

1. **Mobile app:** Build custom? Use Obsidian mobile? Telegram-only for capture?

2. **Offline:** How important is offline access? (Affects architecture)

3. **Multi-user:** Ever need to share projects? (Probably not for MVP)

4. **Existing content:** Migrate Google Drive docs to this structure?

5. **Project hierarchy:** Allow sub-projects? Or keep flat?

---

## Next Steps

1. [ ] Review this PRD — what's wrong, missing, or overbuilt?
2. [ ] Decide: build custom app vs. extend existing tools (Obsidian + plugins?)
3. [ ] Define MVP scope more precisely
4. [ ] Prototype the capture → inbox flow
5. [ ] Test with real usage for a week

---

*This is a living document. Tear it apart.*
