const express = require('express');
const SeatFee = require('../models/SeatFee');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All seat-fee routes require a valid JWT
router.use(protect);

/**
 * GET /api/seat-fees - list all seat fees, sorted numerically by seat number
 */
router.get('/', async (req, res) => {
  try {
    const seatFees = await SeatFee.find();
    seatFees.sort((a, b) => Number(a.seatNumber) - Number(b.seatNumber));
    res.json(seatFees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/seat-fees - set the fee for a seat number
 */
router.post('/', async (req, res) => {
  try {
    const { seatNumber, fees } = req.body;
    const exists = await SeatFee.findOne({ seatNumber });
    if (exists) {
      return res.status(400).json({ message: `Seat ${seatNumber} already has a fee set` });
    }
    const seatFee = await SeatFee.create({ seatNumber, fees });
    res.status(201).json(seatFee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * PUT /api/seat-fees/:id - update a seat's number and/or fee
 */
router.put('/:id', async (req, res) => {
  try {
    const seatFee = await SeatFee.findById(req.params.id);
    if (!seatFee) return res.status(404).json({ message: 'Seat fee not found' });

    const { seatNumber, fees } = req.body;
    if (seatNumber) seatFee.seatNumber = seatNumber;
    if (fees !== undefined) seatFee.fees = fees;

    await seatFee.save();
    res.json(seatFee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /api/seat-fees/:id - remove a seat fee
 */
router.delete('/:id', async (req, res) => {
  try {
    const seatFee = await SeatFee.findByIdAndDelete(req.params.id);
    if (!seatFee) return res.status(404).json({ message: 'Seat fee not found' });
    res.json({ message: 'Seat fee deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
