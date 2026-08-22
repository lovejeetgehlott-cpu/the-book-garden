const express = require('express');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const { dayRange, startOfToday } = require('../utils/dates');
const { channelReady, notifyStudents, notifyCustom } = require('../utils/notify');

/** Build the case-insensitive search filter shared by list + bulk send. */
const searchFilter = (search) => {
  if (!search) return {};
  const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: [
      { name: rx },
      { phone: rx },
      { mobile: rx },
      { email: rx },
      { studentId: rx },
      { seatNumber: rx },
    ],
  };
};

/**
 * Restrict a list or bulk send to active or inactive students, computed
 * live from dueDate rather than a stored field — a student whose renewal
 * is overdue (dueDate before today) is "inactive", no matter what was
 * last saved on the record.
 */
const statusFilter = (status) => {
  if (status === 'inactive') return { dueDate: { $lt: startOfToday() } };
  if (status === 'active') return { dueDate: { $gte: startOfToday() } };
  return {};
};

/** Reject a bulk send early if a requested channel has no gateway configured. */
const gatewayGuard = (channels, res) => {
  const missing = channels.filter((c) => !channelReady[c]());
  if (missing.length) {
    // Email runs on SMTP_*, the phone channels on TWILIO_*
    const needsSmtp = missing.includes('email');
    const needsTwilio = missing.some((c) => c !== 'email');
    const hint = [needsTwilio && 'TWILIO_*', needsSmtp && 'SMTP_*'].filter(Boolean).join(' / ');
    res.status(503).json({
      message: `${missing.join(' & ')} gateway not configured. Add the ${hint} values to server/.env.`,
    });
    return false;
  }
  return true;
};

/** Parse a { channel } body into a validated channels array, or null if invalid. */
const parseChannels = (channel = 'both') => {
  if (channel === 'both') return ['whatsapp', 'sms']; // back-compat
  if (channel === 'all') return ['whatsapp', 'sms', 'email'];
  return ['sms', 'whatsapp', 'email'].includes(channel) ? [channel] : null;
};

const router = express.Router();

// All student routes require a valid JWT
router.use(protect);

/**
 * GET /api/students
 * Optional ?search= filters by name, phone, mobile, email, studentId,
 * seatNumber or membershipPlan (case-insensitive).
 */
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({ ...searchFilter(req.query.search), ...statusFilter(req.query.status) })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/students/notify-all
 * Bulk-send a custom message to every student (optionally narrowed by the
 * same ?search filter the list uses) via Twilio.
 * Body: { message, channel: 'sms' | 'whatsapp' | 'email' | 'both' | 'all', search? }.
 * Returns { sent, failed, total, results }. 503 if the channel isn't configured.
 */
router.post('/notify-all', async (req, res) => {
  try {
    const message = (req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Message text is required' });

    const channels = parseChannels(req.body.channel);
    if (!channels) {
      return res.status(400).json({ message: "channel must be 'sms', 'whatsapp', 'email', 'both' or 'all'" });
    }
    if (!gatewayGuard(channels, res)) return;

    const students = await Student.find({
      ...searchFilter(req.body.search),
      ...statusFilter(req.body.status),
    }).sort({ name: 1 });
    if (!students.length) {
      return res.json({ sent: 0, failed: 0, total: 0, results: [] });
    }

    const { sent, failed, results } = await notifyCustom(students, channels, message);
    res.json({ sent, failed, total: students.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/students/reminders/:days
 * Students whose dueDate falls exactly :days calendar days from today.
 * :days must be 0 (last day), 2 or 3.
 */
router.get('/reminders/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days, 10);
    if (![0, 2, 3].includes(days)) {
      return res.status(400).json({ message: 'days must be 0, 2 or 3' });
    }
    const { start, end } = dayRange(days);
    const students = await Student.find({
      dueDate: { $gte: start, $lt: end },
      status: 'active',
    }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/students/reminders/:days/notify
 * Bulk-send the renewal reminder to every active student in the :days tier
 * Body: { channel: 'sms' | 'whatsapp' | 'email' | 'both' | 'all' } (default 'both').
 * Returns { sent, failed, total, results }. 503 if the chosen channel's
 * Twilio credentials are not configured.
 */
router.post('/reminders/:days/notify', async (req, res) => {
  try {
    const days = parseInt(req.params.days, 10);
    if (![0, 2, 3].includes(days)) {
      return res.status(400).json({ message: 'days must be 0, 2 or 3' });
    }

    const channels = parseChannels(req.body.channel);
    if (!channels) {
      return res.status(400).json({ message: "channel must be 'sms', 'whatsapp', 'email', 'both' or 'all'" });
    }
    if (!gatewayGuard(channels, res)) return;

    const { start, end } = dayRange(days);
    const students = await Student.find({
      dueDate: { $gte: start, $lt: end },
      status: 'active',
    }).sort({ name: 1 });

    if (!students.length) {
      return res.json({ sent: 0, failed: 0, total: 0, results: [] });
    }

    const { sent, failed, results } = await notifyStudents(days, students, channels);
    res.json({ sent, failed, total: students.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/students/:id - single student (used by the edit form)
 */
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ message: 'Invalid student id' });
  }
});

/**
 * POST /api/students - create a new student (admission form)
 * dueAmount/paymentStatus are server-computed, never trusted from the client.
 */
router.post('/', async (req, res) => {
  try {
    delete req.body.dueAmount;
    delete req.body.paymentStatus;
    const student = await Student.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * PUT /api/students/:id - update a student.
 * Loads the doc and saves it so schema pre-validate hooks run
 * (findByIdAndUpdate would skip them).
 */
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    delete req.body.dueAmount;
    delete req.body.paymentStatus;
    Object.assign(student, req.body);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /api/students/:id - remove a student
 */
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
