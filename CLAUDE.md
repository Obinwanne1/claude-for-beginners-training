# CLAUDE.md

## Plan and Review
Before Starting Work — Add to chat (Cmd+L)
Write implementation plan in `.claude/tasks/TASK_NAME.md` before coding. Ask me to review before proceeding.

## Project Overview

**Business:** Greenfield Training
**Project:** claude-for-beginners-training
**Client:** Greenfield Training
**Goal:** Automate delivery of Claude training content to beginners via scheduled email lessons.
**Deadline:** 2026-05-15

---

## Design System

**Brand Name:** Greenfield Training
**Logo Path:** `assets/logo.svg`
**Google Fonts Import URL:** `https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap`

### Colors

| Role | Hex | Usage |
|---|---|---|
| Primary | `#2E7D32` | Buttons, CTAs, nav active states |
| Secondary | `#FFFFFF` | Backgrounds, cards, surfaces |
| Accent | `#4CAF50` | Hover states, highlights |
| Text | `#1A1A1A` | Body copy, headings |
| Text Muted | `#6B7280` | Subtext, placeholders |
| Error | `#DC2626` | Errors, destructive actions |
| Success | `#16A34A` | Confirmations |

### Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | Poppins | 2.5rem | 700 |
| Heading 2 | Poppins | 2rem | 600 |
| Body | Poppins | 1rem | 400 |
| Caption | Poppins | 0.875rem | 400 |
| Code | JetBrains Mono | 0.875rem | 400 |

### Component Patterns
- **Buttons:** Filled `#2E7D32`, `border-radius: 6px`, hover darken 10%
- **Cards:** `border: 1px solid #E5E7EB`, `border-radius: 8px`, `padding: 16px`
- **Forms:** Outlined inputs, top-aligned labels, inline validation

---

## Tech Stack

**Frontend:** Simple Express-served HTML status dashboard
**Backend:** Node.js + Express
**Database:** JSON file (`src/db/data.json`)
**Auth:** None (internal tool)
**Automation:** node-cron + nodemailer
**Hosting:** Localhost (update before deploy)
**Package Manager:** npm

---

## Environment & Config

**Primary port:** 3000
**`.env.example` committed:** Yes

```
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
FROM_NAME=Greenfield Training
FROM_EMAIL=training@greenfield.com
LESSON_CRON=0 9 * * *
```

Rules:
- Kill process on port before starting. Restart after any `.env` change.
- Never hardcode secrets. Always read from `.env`.
- `.env` is gitignored. `.env.example` is always committed.

---

## Project Structure

```
claude-for-beginners-training/
├── src/
│   ├── server.js              # Express app + health endpoint
│   ├── workflows/
│   │   └── send-lesson.js     # Core lesson delivery workflow
│   └── db/
│       ├── index.js           # JSON DB helpers
│       └── data.json          # Learners + progress store
├── data/
│   └── lessons/               # Lesson markdown/JSON files
├── tests/
├── .claude/
│   └── tasks/                 # Implementation plans
├── .env
├── .env.example
├── .gitignore
├── package.json
├── start.bat
└── README.md
```

---

## Coding Standards

### JavaScript
- ESLint + Prettier. `camelCase` vars/functions.
- `kebab-case` file names.

### General
- No magic numbers — name constants.
- No dead code left in files.
- One responsibility per function.

---

## Testing
**Runner:** Jest
**Run command:** `npm test`
Minimum: lesson delivery logic, DB helpers, cron trigger.
