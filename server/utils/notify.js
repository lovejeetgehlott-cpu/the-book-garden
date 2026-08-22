/**
 * Twilio/SMTP-backed bulk notifier for renewal reminders.
 *
 * Sends SMS and/or WhatsApp messages via Twilio, and email via SMTP
 * (nodemailer). Credentials are read from the environment (see
 * server/.env.example). If they are missing the module reports itself as
 * not-configured instead of throwing, so the rest of the app keeps working
 * without a gateway.
 *
 * Required env:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 *   TWILIO_SMS_FROM        e.g. +12025550123          (for SMS)
 *   TWILIO_WHATSAPP_FROM   e.g. +14155238886          (for WhatsApp; no "whatsapp:" prefix)
 *   SMTP_HOST, SMTP_USER, SMTP_PASS                   (for email)
 *   SMTP_PORT              defaults to 587
 *   EMAIL_FROM             defaults to SMTP_USER
 */
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SMS_FROM,
  TWILIO_WHATSAPP_FROM,
  SMTP_PORT = '587',
  EMAIL_FROM,
  // Default country code applied to bare 10-digit numbers (India = 91)
  DEFAULT_COUNTRY_CODE = '91',
} = process.env;

// EMAIL_USER/EMAIL_PASS accepted as aliases for SMTP_USER/SMTP_PASS.
// Host defaults to Gmail when creds exist but no host was given.
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const SMTP_HOST = process.env.SMTP_HOST || (SMTP_USER && SMTP_PASS ? 'smtp.gmail.com' : '');

// Lazily created singleton so a missing/invalid SID never crashes startup
let client = null;
const getClient = () => {
  if (!client) client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return client;
};

// Lazily created SMTP transport, same pattern as the Twilio client
let transport = null;
const getTransport = () => {
  if (!transport) {
    const port = parseInt(SMTP_PORT, 10) || 587;
    transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transport;
};

/** Whether Twilio creds exist at all (SID + token). */
const isConfigured = () => Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);

const channelReady = {
  sms: () => isConfigured() && Boolean(TWILIO_SMS_FROM),
  whatsapp: () => isConfigured() && Boolean(TWILIO_WHATSAPP_FROM),
  email: () => Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS),
};

/**
 * Normalise a stored number to E.164 (+<countrycode><number>).
 * Strips spaces/dashes; a bare 10-digit number gets DEFAULT_COUNTRY_CODE.
 * Returns null when there aren't enough digits to be a real number.
 */
const toE164 = (raw) => {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) digits = `${DEFAULT_COUNTRY_CODE}${digits}`;
  if (digits.length < 10) return null;
  return `+${digits}`;
};

const dueDateText = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

/** Per-tier reminder copy (mirrors the client's reminderMessage). */
const reminderMessage = (days, student) => {
  const due = dueDateText(student.dueDate);
  if (days === 3) {
    return `Dear ${student.name}, your membership/fee is due in 3 days (${due}). Please renew soon.`;
  }
  if (days === 2) {
    return `Dear ${student.name}, your membership/fee is due in 2 days (${due}).`;
  }
  return `Dear ${student.name}, today is the last day for your membership/fee (${due}). Please renew today.`;
};

/** Send one message on one channel; resolves to a result record (never throws). */
const sendOne = async (channel, student, body) => {
  const base = { student: student.name, channel };
  if (channel === 'email') {
    if (!student.email) return { ...base, ok: false, error: 'No email address' };
    try {
      await getTransport().sendMail({
        // .env ships EMAIL_FROM= (empty string), which defeats the
        // destructuring default — fall back here instead
        from: EMAIL_FROM || SMTP_USER,
        to: student.email,
        subject: 'The Book Garden — Library Notice',
        text: body,
      });
      return { ...base, ok: true };
    } catch (err) {
      return { ...base, ok: false, error: err.message };
    }
  }
  const to = toE164(channel === 'sms' ? student.mobile || student.phone : student.phone);
  if (!to) return { ...base, ok: false, error: 'No valid phone number' };
  try {
    if (channel === 'sms') {
      await getClient().messages.create({ to, from: TWILIO_SMS_FROM, body });
    } else {
      await getClient().messages.create({
        to: `whatsapp:${to}`,
        from: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
        body,
      });
    }
    return { ...base, ok: true };
  } catch (err) {
    return { ...base, ok: false, error: err.message };
  }
};

/**
 * Send a message to every student in `students` over the requested channels.
 * `channels` is an array subset of ['sms', 'whatsapp', 'email'].
 * `bodyFor(student)` returns the message text for that student.
 * Returns { sent, failed, results } — results is a flat per-message list.
 */
const sendToAll = async (students, channels, bodyFor) => {
  const tasks = [];
  for (const student of students) {
    const body = bodyFor(student);
    for (const channel of channels) {
      tasks.push(sendOne(channel, student, body));
    }
  }
  const results = await Promise.all(tasks);
  const sent = results.filter((r) => r.ok).length;
  return { sent, failed: results.length - sent, results };
};

/** Send the per-tier renewal reminder to every student. */
const notifyStudents = (days, students, channels) =>
  sendToAll(students, channels, (student) => reminderMessage(days, student));

/** Send one custom message (same text) to every student. */
const notifyCustom = (students, channels, message) =>
  sendToAll(students, channels, () => message);

module.exports = { isConfigured, channelReady, notifyStudents, notifyCustom, toE164 };
