# SMTP Setup for ChronosAI

This document explains the simplest, reliable SMTP setup for ChronosAI when running the backend on Render (free tier) and frontend on Vercel. The recommended provider is Gmail SMTP with an App Password.

---

## 1) Render environment variables (exact values)

Set these variables in your Render service's Environment (or in your secret manager):

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=chronosai.notifications@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_USE_TLS=true
SMTP_FROM="ChronosAI Notifications <chronosai.notifications@gmail.com>"
REMINDER_MINUTES_BEFORE=15

Notes:
- `SMTP_PASSWORD` should be a Gmail App Password (see below).
- `REMINDER_MINUTES_BEFORE` is the legacy single reminder value; ChronosAI also supports `REMINDER_SCHEDULE_MINUTES` as a comma-separated list (e.g. `REMINDER_SCHEDULE_MINUTES=1440,60,15`).

---

## 2) How to create a Gmail App Password (required)

1. Open your Google Account > Security.
2. Turn on 2-Step Verification for the account.
3. Under "App passwords", create a new app password (select "Other" and name it e.g. `chronosai-render`).
4. Copy the 16-character password (no spaces) and paste into `SMTP_PASSWORD` in Render.

Important: Do NOT use your Gmail login password here.

---

## 3) What to fill in each env var

- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `587` (TLS)
- `SMTP_USER`: `chronosai.notifications@gmail.com` (create a dedicated account)
- `SMTP_PASSWORD`: 16-character App Password
- `SMTP_USE_TLS`: `true`
- `SMTP_FROM`: the friendly From header (Example: `"ChronosAI Notifications <chronosai.notifications@gmail.com>"`)
- `REMINDER_MINUTES_BEFORE`: `15` (or set `REMINDER_SCHEDULE_MINUTES` for multiple reminders)

---

## 4) Example reminder email content

Subject: ⏰ Reminder: Event starting soon

Hi Rahul,

This is a reminder that your scheduled event will start in 15 minutes.

Event: Project Meeting
Time: 4:30 PM

Open ChronosAI to view details.

— ChronosAI

---

## 5) Node.js example (Nodemailer)

```js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // TLS via STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
  });
};
```

---

## 6) Python example (ChronosAI backend)

ChronosAI's backend already includes SMTP settings in `backend/app/config.py` and a `send_email` helper in `backend/app/services/email.py` that uses those env vars. Example usage in code:

```py
from app.services.email import send_email

# fire-and-forget
import asyncio
asyncio.create_task(send_email(["user@example.com"], "Reminder: Meeting", "Your meeting starts in 15 minutes"))
```

If you'd like the Python snippet for a simple standalone sender:

```py
import smtplib
from email.message import EmailMessage

msg = EmailMessage()
msg["From"] = "ChronosAI Notifications <chronosai.notifications@gmail.com>"
msg["To"] = "user@example.com"
msg["Subject"] = "⏰ Reminder: Event starting soon"
msg.set_content("Your event starts in 15 minutes")

with smtplib.SMTP("smtp.gmail.com", 587) as s:
    s.starttls()
    s.login("chronosai.notifications@gmail.com", "YOUR_APP_PASSWORD")
    s.send_message(msg)
```

---

## 7) Recommended email address

Use a dedicated address like `chronosai.notifications@gmail.com` or `chronosai.scheduler@gmail.com` to appear professional.

---

## 8) Optional: smarter reminder schedule

For a better demo experience, use `REMINDER_SCHEDULE_MINUTES` with values like `1440,60,15` (1 day, 1 hour, 15 minutes). ChronosAI supports per-meeting reminder schedules and methods (email/popup) — the backend now accepts `reminder_schedule_minutes` and `reminder_methods` on meeting create/update.

---

## 9) Troubleshooting

- If email sending fails, check Render logs for SMTP connection errors.
- Ensure the Gmail account has 2FA + App Password and that `SMTP_USER`/`SMTP_PASSWORD` are correct.
- Some providers may rate-limit; create a dedicated Gmail account for production notifications.

---

If you want, I can:
- create an `.env.example` file in the repo, and
- add an Alembic migration for the new `reminder_*` columns (I didn't modify migrations yet).

Tell me which of these you'd like next.
