require('dotenv').config();
const nodemailer = require('nodemailer');
const db = require('../db');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Build HTML email for a lesson.
 * @param {object} learner
 * @param {object} lesson
 * @returns {string} HTML string
 */
function buildLessonEmail(learner, lesson) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: Arial, sans-serif; background: #f9fafb; color: #1A1A1A; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; border: 1px solid #E5E7EB; overflow: hidden; }
        .header { background: #2E7D32; color: #fff; padding: 24px 32px; }
        .header h1 { font-size: 1.25rem; margin: 0; }
        .header p { font-size: 0.875rem; margin: 4px 0 0; opacity: 0.85; }
        .body { padding: 32px; }
        .lesson-badge { display: inline-block; background: #e8f5e9; color: #2E7D32; font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 12px; margin-bottom: 16px; }
        h2 { font-size: 1.25rem; margin: 0 0 16px; color: #1A1A1A; }
        .content { font-size: 0.95rem; line-height: 1.7; color: #374151; white-space: pre-line; }
        .cta { display: inline-block; margin-top: 24px; background: #2E7D32; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.95rem; }
        .footer { padding: 16px 32px; background: #f3f4f6; font-size: 0.75rem; color: #6B7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Greenfield Training</h1>
          <p>Claude for Beginners — Your Daily Lesson</p>
        </div>
        <div class="body">
          <p>Hi ${learner.name},</p>
          <div class="lesson-badge">Lesson ${lesson.order} of ${lesson.totalLessons || '?'}</div>
          <h2>${lesson.title}</h2>
          <div class="content">${lesson.content}</div>
        </div>
        <div class="footer">
          You're receiving this because you enrolled in Claude for Beginners training.<br/>
          © ${new Date().getFullYear()} Greenfield Training
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send next lesson to all learners who have one pending.
 * @returns {{ sent: number, skipped: number, errors: string[] }}
 */
async function sendScheduledLessons() {
  const data = db.read();
  const learners = data.learners || [];
  const lessons = data.lessons || [];

  if (lessons.length === 0) {
    console.warn('[send-lesson] No lessons in DB. Add lessons to src/db/data.json.');
    return { sent: 0, skipped: learners.length, errors: [] };
  }

  const totalLessons = lessons.length;
  let sent = 0;
  let skipped = 0;
  const errors = [];

  for (const learner of learners) {
    const lessonIndex = learner.currentLesson || 0;

    if (lessonIndex >= totalLessons) {
      skipped++;
      continue; // Learner completed all lessons
    }

    const lesson = { ...lessons[lessonIndex], order: lessonIndex + 1, totalLessons };

    try {
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || 'Greenfield Training'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: learner.email,
        subject: `Lesson ${lesson.order}: ${lesson.title} — Claude for Beginners`,
        html: buildLessonEmail(learner, lesson),
      });

      // Advance learner to next lesson
      learner.currentLesson = lessonIndex + 1;
      learner.lastSentAt = new Date().toISOString();
      sent++;
      console.log(`[send-lesson] Sent lesson ${lesson.order} to ${learner.email}`);
    } catch (err) {
      errors.push(`${learner.email}: ${err.message}`);
      console.error(`[send-lesson] Failed for ${learner.email}:`, err.message);
    }
  }

  db.write(data);
  return { sent, skipped, errors };
}

module.exports = { sendScheduledLessons };
