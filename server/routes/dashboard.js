const express = require('express');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const { dayRange, startOfToday } = require('../utils/dates');
const { channelReady } = require('../utils/notify');

const router = express.Router();

router.use(protect);

// The reading hall has a fixed bank of 80 seats
const TOTAL_SEATS = 80;

/**
 * GET /api/dashboard/stats
 * The four legacy dashboard counts:
 *   totalStudents, threeDaysLeft, twoDaysLeft, lastDay (due today)
 */
router.get('/stats', async (req, res) => {
  try {
    const countForDay = (days) => {
      const { start, end } = dayRange(days);
      return Student.countDocuments({ dueDate: { $gte: start, $lt: end }, status: 'active' });
    };

    const [totalStudents, threeDaysLeft, twoDaysLeft, lastDay] = await Promise.all([
      Student.countDocuments({}),
      countForDay(3),
      countForDay(2),
      countForDay(0),
    ]);

    res.json({ totalStudents, threeDaysLeft, twoDaysLeft, lastDay });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/dashboard/revenue-by-year
 * Total fees (feeAmount) grouped by the calendar year of admissionDate -
 * the only fee/date fields the current Admission Form actually collects.
 */
router.get('/revenue-by-year', async (req, res) => {
  try {
    const rows = await Student.aggregate([
      { $group: { _id: { $year: '$admissionDate' }, revenue: { $sum: '$feeAmount' } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(rows.map((r) => ({ year: r._id, revenue: r.revenue })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/dashboard/overview
 * Everything the rich dashboard needs in one call:
 *   seats:    { total, occupied, available }
 *   money:    { todaysCollection, monthlyRevenue }
 *   expiring: { week }                        (active, dueDate within 7 days)
 *   revenueSeries:   [{ month, revenue }]     last 6 calendar months (by paymentDate)
 *   growthSeries:    [{ month, students }]    admissions per month, last 6
 *   paymentSplit:    { Paid, Partial, Pending }
 *   paymentModes:    [{ mode, count }]
 *   recent:          latest 8 students (name, seatNumber, paymentStatus, createdAt, updatedAt)
 */
router.get('/overview', async (req, res) => {
  try {
    const today = startOfToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const [
      occupied,
      todayAgg,
      monthAgg,
      expiringWeek,
      revenueAgg,
      growthAgg,
      splitAgg,
      modeAgg,
      recent,
    ] = await Promise.all([
      Student.countDocuments({ status: 'active', seatNumber: { $ne: '' }, seatStatus: 'Occupied' }),
      Student.aggregate([
        { $match: { paymentDate: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      Student.aggregate([
        { $match: { paymentDate: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      Student.countDocuments({ status: 'active', dueDate: { $gte: today, $lt: weekEnd } }),
      Student.aggregate([
        { $match: { paymentDate: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { y: { $year: '$paymentDate' }, m: { $month: '$paymentDate' } },
            revenue: { $sum: '$paidAmount' },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      Student.aggregate([
        { $match: { admissionDate: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { y: { $year: '$admissionDate' }, m: { $month: '$admissionDate' } },
            students: { $sum: 1 },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      Student.aggregate([{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }]),
      Student.aggregate([
        { $match: { paymentMode: { $ne: '' } } },
        { $group: { _id: '$paymentMode', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Student.find({})
        .sort({ updatedAt: -1 })
        .limit(8)
        .select('name seatNumber paymentStatus paidAmount createdAt updatedAt'),
    ]);

    const monthName = (m) =>
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];

    res.json({
      seats: {
        total: TOTAL_SEATS,
        occupied,
        available: Math.max(0, TOTAL_SEATS - occupied),
      },
      money: {
        todaysCollection: todayAgg[0]?.total || 0,
        monthlyRevenue: monthAgg[0]?.total || 0,
      },
      expiring: { week: expiringWeek },
      revenueSeries: revenueAgg.map((r) => ({
        month: `${monthName(r._id.m)}`,
        revenue: r.revenue,
      })),
      growthSeries: growthAgg.map((g) => ({
        month: `${monthName(g._id.m)}`,
        students: g.students,
      })),
      paymentSplit: Object.fromEntries(splitAgg.map((s) => [s._id, s.count])),
      paymentModes: modeAgg.map((m) => ({ mode: m._id, count: m.count })),
      recent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/dashboard/gateways
 * Which bulk-messaging channels are configured (for the Settings page).
 */
router.get('/gateways', (req, res) => {
  res.json({
    whatsapp: channelReady.whatsapp(),
    sms: channelReady.sms(),
    email: channelReady.email(),
  });
});

module.exports = router;
