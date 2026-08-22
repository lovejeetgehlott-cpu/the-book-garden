/**
 * Refresh the 50 bundled demo records (BG-0001..BG-0050) without touching
 * any manually created student. Keeps every screen populated for testing.
 *
 * Run: node seed/refreshDemoStudents.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Student = require('../models/Student');

const DEMO_IDS = Array.from({ length: 50 }, (_, i) => `BG-${String(i + 1).padStart(4, '0')}`);

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, days) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const buildUpdate = (index, today) => {
  const status = index < 35 ? 'active' : index < 45 ? 'inactive' : 'expired';
  let dueDate;

  if (status === 'expired') dueDate = addDays(today, -(1 + (index % 5)));
  else if (index % 20 === 0) dueDate = today;
  else if (index % 20 === 1) dueDate = addDays(today, 2);
  else if (index % 20 === 2) dueDate = addDays(today, 3);
  else dueDate = addDays(today, 10 + (index % 50));

  return {
    status,
    dueDate,
    seatStatus: status === 'active' ? 'Occupied' : 'Available',
  };
};

const run = async () => {
  await connectDB();
  const students = await Student.find({ studentId: { $in: DEMO_IDS } }).select('_id studentId');
  const today = startOfToday();
  const operations = students.map((student) => {
    const index = parseInt(student.studentId.slice(3), 10) - 1;
    return {
      updateOne: {
        filter: { _id: student._id },
        update: { $set: buildUpdate(index, today) },
      },
    };
  });

  if (operations.length) await Student.bulkWrite(operations);
  console.log(`Refreshed ${operations.length} demo students.`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Demo refresh failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
