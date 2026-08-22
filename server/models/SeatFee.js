const mongoose = require('mongoose');

/**
 * SeatFee model: the fee amount assigned to a given seat number.
 * Kept separate from Student so seats can be priced independently
 * of who (if anyone) currently occupies them.
 */
const seatFeeSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
      unique: true,
    },
    fees: { type: Number, required: [true, 'Fees is required'], min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SeatFee', seatFeeSchema);
