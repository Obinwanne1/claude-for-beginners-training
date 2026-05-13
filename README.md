# Claude for Beginners Training — Greenfield Training

Automated delivery of Claude training content to beginners via scheduled email lessons.

---

## Prerequisites

- Node.js 18+
- npm
- SMTP credentials (Gmail App Password recommended)

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
copy .env.example .env

# 3. Fill in your SMTP credentials in .env
```

### Gmail App Password (recommended)

1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a password for "Mail"
4. Use that as `SMTP_PASS` in `.env`

---

## Run

```bash
# Production
npm start

# Development (auto-restart on file change)
npm run dev

# Windows one-click
start.bat
```

Open `http://localhost:3000` to see the status dashboard.

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Status dashboard |
| GET | `/health` | Health check (JSON) |
| POST | `/trigger` | Manually send lessons now |
| GET | `/learners` | List all learners |
| POST | `/learners` | Register a new learner |

### Register a learner

```bash
curl -X POST http://localhost:3000/learners \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Jane Doe\", \"email\": \"jane@example.com\"}"
```

### Manually trigger lesson delivery

```bash
curl -X POST http://localhost:3000/trigger
```

---

## Lessons

Lessons live in `src/db/data.json` under the `lessons` array. Each lesson:

```json
{
  "id": "lesson-1",
  "title": "What is Claude?",
  "content": "Lesson body text here..."
}
```

Add, edit, or reorder lessons directly. Learner progress is tracked by index — reordering lessons will affect learners mid-course. Add new lessons at the end only.

---

## Schedule

Set `LESSON_CRON` in `.env`:

```
0 9 * * *     = every day at 9am
0 9 * * 1-5   = weekdays only at 9am
0 9 * * 1     = every Monday at 9am
```

---

## Testing

```bash
npm test
```

---

## Deployment Notes

- Update `PORT` for your host environment
- Use environment variables — never hardcode credentials
- Ensure SMTP credentials are set as secrets on your hosting platform
- Recommended hosts: Railway, Render, Fly.io (free tier available)
