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

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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
        .panel { background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
        .panel h2 { font-size: 1rem; font-weight: 600; margin-bottom: 12px; }
        code { background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 0.875rem; }
        .dot { width: 10px; height: 10px; background: #4CAF50; border-radius: 50%; display: inline-block; margin-right: 8px; }
        .btn { background: #2E7D32; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: inherit; }
        .btn:hover { background: #245f27; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline { background: #fff; color: #2E7D32; border: 1.5px solid #2E7D32; }
        .btn-outline:hover { background: #f0faf0; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field label { font-size: 0.8rem; font-weight: 500; color: #374151; }
        .field input { border: 1px solid #D1D5DB; border-radius: 6px; padding: 9px 12px; font-size: 0.9rem; font-family: inherit; outline: none; }
        .field input:focus { border-color: #2E7D32; box-shadow: 0 0 0 3px rgba(46,125,50,0.12); }
        .msg { font-size: 0.875rem; margin-top: 10px; min-height: 20px; }
        .learners-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-top: 12px; }
        .learners-table th { text-align: left; padding: 8px 12px; background: #f3f4f6; color: #6B7280; font-weight: 500; border-bottom: 1px solid #E5E7EB; }
        .learners-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
        .badge { display: inline-block; background: #e8f5e9; color: #2E7D32; font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
        .badge-done { background: #f3f4f6; color: #6B7280; }
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
        <!-- Register Learner -->
        <div class="panel">
          <h2>Register Learner</h2>
          <div class="form-row">
            <div class="field">
              <label for="regName">Full Name</label>
              <input id="regName" type="text" placeholder="Jane Doe" />
            </div>
            <div class="field">
              <label for="regEmail">Email Address</label>
              <input id="regEmail" type="email" placeholder="jane@example.com" />
            </div>
            <button class="btn" onclick="registerLearner()">Register</button>
          </div>
          <div id="regMsg" class="msg"></div>
        </div>

        <!-- Learners List -->
        <div class="panel">
          <h2>Learners <span id="learnerCount" style="color:#6B7280;font-weight:400;font-size:0.875rem;">(${learnerCount})</span></h2>
          <table class="learners-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Progress</th><th>Enrolled</th><th></th></tr>
            </thead>
            <tbody id="learnersBody">
              ${(data.learners || []).map(l => `
                <tr>
                  <td>${escHtml(l.name)}</td>
                  <td>${escHtml(l.email)}</td>
                  <td>${l.currentLesson >= lessonCount
                    ? '<span class="badge badge-done">Completed</span>'
                    : '<span class="badge">Lesson ' + (l.currentLesson + 1) + ' / ' + lessonCount + '</span>'
                  }</td>
                  <td style="color:#6B7280">${new Date(l.enrolledAt).toLocaleDateString()}</td>
                  <td><button onclick="removeLearner('${escHtml(l.id)}')" style="background:none;border:1px solid #DC2626;color:#DC2626;padding:4px 10px;border-radius:4px;font-size:0.75rem;cursor:pointer;">Remove</button></td>
                </tr>`).join('') || '<tr><td colspan="5" style="color:#6B7280;text-align:center;padding:20px;">No learners yet</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Schedule & Trigger -->
        <div class="panel">
          <h2>Schedule</h2>
          <p>Cron: <code>${LESSON_CRON}</code> — lessons delivered automatically on this schedule.</p>
          <button class="btn" onclick="triggerNow()" id="triggerBtn" style="margin-top:16px;">Send Lessons Now</button>
          <div id="triggerResult" class="msg"></div>
        </div>

        <script>
          function escHtml(s) {
            return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
          }

          async function registerLearner() {
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const msg = document.getElementById('regMsg');
            if (!name || !email) { msg.style.color='#DC2626'; msg.textContent='Name and email required.'; return; }
            msg.style.color='#6B7280'; msg.textContent='Registering...';
            try {
              const res = await fetch('/learners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
              });
              const data = await res.json();
              if (res.ok) {
                msg.style.color='#16A34A';
                msg.textContent = name + ' registered successfully.';
                document.getElementById('regName').value = '';
                document.getElementById('regEmail').value = '';
                setTimeout(() => location.reload(), 1000);
              } else {
                msg.style.color='#DC2626';
                msg.textContent = data.error || 'Registration failed.';
              }
            } catch (e) {
              msg.style.color='#DC2626'; msg.textContent='Request failed: ' + e.message;
            }
          }

          async function removeLearner(id) {
            if (!confirm('Remove this learner?')) return;
            try {
              const res = await fetch('/learners/' + id, { method: 'DELETE' });
              if (res.ok) location.reload();
              else { const d = await res.json(); alert('Error: ' + d.error); }
            } catch (e) { alert('Request failed: ' + e.message); }
          }

          async function triggerNow() {
            const btn = document.getElementById('triggerBtn');
            const out = document.getElementById('triggerResult');
            btn.disabled = true; btn.textContent = 'Sending...'; out.textContent = '';
            try {
              const res = await fetch('/trigger', { method: 'POST' });
              const data = await res.json();
              out.style.color = data.success ? '#16A34A' : '#DC2626';
              out.textContent = data.success
                ? 'Done — sent: ' + data.sent + ', skipped: ' + data.skipped + (data.errors.length ? ', errors: ' + data.errors.join('; ') : '')
                : 'Error: ' + data.error;
              if (data.success) setTimeout(() => location.reload(), 1500);
            } catch (e) {
              out.style.color='#DC2626'; out.textContent='Request failed: ' + e.message;
            }
            btn.disabled = false; btn.textContent = 'Send Lessons Now';
          }

          document.getElementById('regEmail').addEventListener('keydown', e => { if (e.key === 'Enter') registerLearner(); });
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

app.delete('/learners/:id', (req, res) => {
  const db = require('./db');
  const data = db.read();
  const before = (data.learners || []).length;
  data.learners = (data.learners || []).filter(l => l.id !== req.params.id);
  if (data.learners.length === before) {
    return res.status(404).json({ error: 'Learner not found' });
  }
  db.write(data);
  res.json({ success: true });
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
