require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const { sendScheduledLessons } = require('./workflows/send-lesson');

const app = express();
const PORT = process.env.PORT || 3000;
const LESSON_CRON = process.env.LESSON_CRON || '0 9 * * *'; // Default: 9am daily

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Status dashboard
app.get('/', (req, res) => {
  const db = require('./db');
  const data = db.read();
  const learnerCount = data.learners ? data.learners.length : 0;
  const lessonCount = data.lessons ? data.lessons.length : 0;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Greenfield Training — Automation Status</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; background: #f9fafb; color: #1A1A1A; }
        header { background: #2E7D32; color: #fff; padding: 16px 32px; display: flex; align-items: center; gap: 12px; }
        header h1 { font-size: 1.25rem; font-weight: 600; }
        main { max-width: 900px; margin: 40px auto; padding: 0 24px; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .card .value { font-size: 2rem; font-weight: 700; color: #2E7D32; }
        .card .label { font-size: 0.875rem; color: #6B7280; margin-top: 4px; }
        .cron-info { background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px 24px; }
        .cron-info h2 { font-size: 1rem; font-weight: 600; margin-bottom: 8px; }
        code { background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 0.875rem; }
        .dot { width: 10px; height: 10px; background: #4CAF50; border-radius: 50%; display: inline-block; margin-right: 8px; }
      </style>
    </head>
    <body>
      <header>
        <span style="font-size:1.5rem;">🌿</span>
        <h1>Greenfield Training — Lesson Automation</h1>
      </header>
      <main>
        <div class="cards">
          <div class="card">
            <div class="value">${learnerCount}</div>
            <div class="label">Registered Learners</div>
          </div>
          <div class="card">
            <div class="value">${lessonCount}</div>
            <div class="label">Total Lessons</div>
          </div>
          <div class="card">
            <div class="value"><span class="dot"></span>Active</div>
            <div class="label">Automation Status</div>
          </div>
        </div>
        <div class="cron-info">
          <h2>Schedule</h2>
          <p>Cron: <code>${LESSON_CRON}</code> — lessons delivered automatically on this schedule.</p>
          <button onclick="triggerNow()" id="triggerBtn" style="margin-top:16px;background:#2E7D32;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:0.95rem;font-weight:600;cursor:pointer;">Send Lessons Now</button>
          <div id="triggerResult" style="margin-top:12px;font-size:0.875rem;"></div>
        </div>
        <script>
          async function triggerNow() {
            const btn = document.getElementById('triggerBtn');
            const out = document.getElementById('triggerResult');
            btn.disabled = true;
            btn.textContent = 'Sending...';
            out.textContent = '';
            try {
              const res = await fetch('/trigger', { method: 'POST' });
              const data = await res.json();
              out.style.color = data.success ? '#16A34A' : '#DC2626';
              out.textContent = data.success
                ? 'Done — sent: ' + data.sent + ', skipped: ' + data.skipped + (data.errors.length ? ', errors: ' + data.errors.join('; ') : '')
                : 'Error: ' + data.error;
            } catch (e) {
              out.style.color = '#DC2626';
              out.textContent = 'Request failed: ' + e.message;
            }
            btn.disabled = false;
            btn.textContent = 'Send Lessons Now';
          }
        </script>
      </main>
    </body>
    </html>
  `);
});

// Manual trigger endpoint
app.post('/trigger', async (req, res) => {
  try {
    const result = await sendScheduledLessons();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[trigger] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Learner management
app.get('/learners', (req, res) => {
  const db = require('./db');
  const data = db.read();
  res.json(data.learners || []);
});

app.post('/learners', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email required' });
  }
  const db = require('./db');
  const data = db.read();
  if (!data.learners) data.learners = [];

  const exists = data.learners.find(l => l.email === email);
  if (exists) return res.status(409).json({ error: 'Learner already registered' });

  const learner = {
    id: Date.now().toString(),
    name,
    email,
    currentLesson: 0,
    enrolledAt: new Date().toISOString(),
  };
  data.learners.push(learner);
  db.write(data);
  res.status(201).json(learner);
});

// Schedule cron job
cron.schedule(LESSON_CRON, async () => {
  console.log(`[cron] Firing at ${new Date().toISOString()}`);
  try {
    const result = await sendScheduledLessons();
    console.log(`[cron] Done — sent: ${result.sent}, skipped: ${result.skipped}`);
  } catch (err) {
    console.error('[cron] Error:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Greenfield Training Automation running on http://localhost:${PORT}`);
  console.log(`Lesson cron: ${LESSON_CRON}`);
});

module.exports = app;
