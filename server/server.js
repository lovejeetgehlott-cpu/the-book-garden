/**
 * Library Management System - API entry point.
 * Express + MongoDB (Mongoose) + JWT auth.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedSuperAdmin = require('./seed/seedAdmin');

const app = express();

// Middleware
app.use(cors());
// Larger limit for base64 profile photos on student create/update
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/seat-fees', require('./routes/seatFees'));

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5000;

// Connect to the database, seed the default super-admin, then listen
const start = async () => {
  await connectDB();
  await seedSuperAdmin();
  app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
};

start();
