# Todo: Auto-reminders based on importance and willful ignorance

**Created:** 2026-02-13  
**Source:** Voice note (Peter)  
**Status:** Open  
**Priority:** High

---

## Task
Add automatic reminder system to project app based on importance levels and history of "willful ignorance" (tasks that are seen but ignored).

---

## Context
From voice note: "Add to project app instructions- do automatic reminders based on importance and the history of willful ignorance"

**Details:**
- Track how many times a task is viewed vs. ignored
- Escalate reminder frequency based on "willful ignorance" count
- Higher importance = more aggressive reminders
- Adaptive system that learns user patterns

---

## Feature Requirements

**Data to track per task:**
- `importance` (high/medium/low)
- `created_at` (timestamp)
- `last_viewed` (timestamp when last opened/viewed)
- `ignore_count` (total times viewed but not acted upon)
- `ignore_streak` (consecutive ignores without action)
- `willful_ignore_score` (calculated based on streak + importance)
- `last_reminded` (timestamp of last reminder)
- `reminder_tier` (current escalation level: 1-5)

**Reminder escalation tiers:**
1. **Tier 1:** Passive (show in list, no push)
2. **Tier 2:** Gentle (daily reminder)
3. **Tier 3:** Firm (multiple reminders/day)
4. **Tier 4:** Urgent (push notification + highlight)
5. **Tier 5:** Critical (escalate to Telegram/other channels)

**Auto-trigger rules:**
- Increase tier after N ignores within timeframe
- Decrease tier if task is acted upon
- Importance affects escalation speed (high = faster)

---

## Implementation Phases

**Phase 1:** Data model
- Add reminder tracking fields to note objects
- Implement `willful_ignore_score` calculation
- Add `ignore_count` and `ignore_streak` tracking

**Phase 2:** Escalation logic
- Define escalation rules (when to move between tiers)
- Implement tier adjustment algorithm
- Add reminder scheduling

**Phase 3:** Delivery system
- In-app reminders
- Push notifications (PWA)
- Telegram integration for critical reminders

**Phase 4:** Learning system
- Track user response patterns
- Optimize reminder timing based on when user is most responsive
- Learn optimal reminder frequency per task type

---

## Notes

**"Willful Ignorance" Definition:**
- Task was viewed/seen
- User consciously chose not to act on it
- Not just "not seen" - that's different

**Balance:**
- Too many reminders = annoyance
- Too few = forgotten tasks
- Find sweet spot

**User control:**
- Always allow user to:
  - Snooze reminders
  - Adjust importance
  - Complete/archive tasks to stop reminders
  - Mark as "working on" to pause escalation

**Philosophy:** Helpful assistant, not nagging boss.