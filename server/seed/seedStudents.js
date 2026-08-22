/**
 * One-off dummy-data seeder: 80 students, seats 1..80 (matches the reading
 * hall's full seat bank). Creates 56 active, 16 inactive, and 8 expired
 * students for UI testing, using the same fields the (now simplified)
 * Admission Form collects.
 * All phone (WhatsApp) numbers = 7727911044, all home numbers = 9509740274.
 * Due dates are spread so the 3-day / 2-day / last-day reminder lists fill up.
 *
 * Run once:  node seed/seedStudents.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Student = require('../models/Student');

const SEAT_COUNT = 80;
const PHONE = '7727911044';
const MOBILE = '9509740274';

const FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna',
  'Ishaan', 'Rohan', 'Ananya', 'Diya', 'Aadhya', 'Saanvi', 'Pari', 'Myra',
  'Anika', 'Navya', 'Riya', 'Aarohi', 'Kabir', 'Dhruv', 'Ayaan', 'Kiaan',
  'Aryan', 'Neha', 'Pooja', 'Sneha', 'Kavya', 'Isha',
];
const LAST = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Nair', 'Rao', 'Singh',
  'Kumar', 'Jain', 'Mehta', 'Shah', 'Yadav', 'Chauhan', 'Mishra', 'Das',
];
const MODES = ['Cash', 'UPI'];

const base = new Date();
base.setHours(0, 0, 0, 0);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const buildStudent = (i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`;
  const status = i < 56 ? 'active' : i < 72 ? 'inactive' : 'expired';
  const feeAmount = 500 + (i % 8) * 100; // 500..1200
  const paymentMode = MODES[i % MODES.length];

  // Active students are spread across the reminder days so those lists have entries.
  let dueDate;
  if (status === 'expired') dueDate = addDays(base, -(1 + (i % 5)));
  else if (i % 20 === 0) dueDate = base; // due today  -> Last Day
  else if (i % 20 === 1) dueDate = addDays(base, 2); // -> 2 Days Left
  else if (i % 20 === 2) dueDate = addDays(base, 3); // -> 3 Days Left
  else dueDate = addDays(base, 10 + (i % 50)); // 10..59 days out

  return {
    name,
    seatNumber: String(i + 1),
    phone: PHONE,
    mobile: MOBILE,
    email: i % 4 === 0 ? '' : `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    aadhaar: i % 2 === 0 ? String(100000000000 + i).padStart(12, '0') : '',
    admissionDate: new Date(2026, 7, 1 + (i % 22)), // August 2026
    dueDate,
    feeAmount,
    paymentMode,
    transactionId: paymentMode === 'UPI' ? `TXN${1000 + i}` : '',
    status,
  };
};

const run = async () => {
  await connectDB();
  const existing = await Student.countDocuments({});
  console.log(`Existing students: ${existing}`);

  let created = 0;
  // Sequential so the studentId auto-generate hook never races
  for (let i = 0; i < SEAT_COUNT; i += 1) {
    await Student.create(buildStudent(i));
    created += 1;
  }

  const total = await Student.countDocuments({});
  console.log(`Created ${created} students. Total now: ${total}`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
