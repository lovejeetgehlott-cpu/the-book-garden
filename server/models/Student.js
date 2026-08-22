const mongoose = require('mongoose');

/**
 * Student model.
 * dueDate is the date the membership/fee expires; "days left" is always
 * computed on the fly as the difference between today and dueDate.
 * dueAmount and paymentStatus are always recomputed server-side (pre-validate)
 * and never trusted from the client.
 */
const studentSchema = new mongoose.Schema(
  {
    // Student details
    name: { type: String, required: [true, 'Name is required'], trim: true },
    // Auto-generated (BG-0001 style) when left blank on create.
    // '' is coerced to undefined so the sparse unique index skips it
    // (sparse only ignores missing fields, not empty strings).
    studentId: { type: String, trim: true, set: (v) => (v === '' ? undefined : v) },
    gender: { type: String, enum: ['', 'Male', 'Female', 'Other'], default: '' },
    // WhatsApp number including country code, e.g. 919876543210
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    // Mobile number (separate from WhatsApp phone)
    mobile: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    aadhaar: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => !v || /^\d{12}$/.test(v),
        message: 'Aadhaar must be 12 digits',
      },
    },
    address: { type: String, trim: true, default: '' },
    // Base64 data URL (client resizes before submit)
    profilePhoto: { type: String, default: '' },

    // Seat details
    seatNumber: { type: String, trim: true, default: '' },
    hallNumber: {
      type: String,
      enum: ['', 'Hall 1', 'Hall 2', 'Hall 3'],
      trim: true,
      default: '',
    },
    shift: {
      type: String,
      enum: ['', 'Morning', 'Afternoon', 'Evening', 'Full Day'],
      default: '',
    },
    seatStatus: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved'],
      default: 'Occupied',
    },

    // Membership
    membershipPlan: {
      type: String,
      enum: ['', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'],
      default: '',
    },
    admissionDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: [true, 'Due date is required'] },

    // Payment
    feeAmount: { type: Number, required: [true, 'Fee amount is required'], min: 0 },
    discount: { type: Number, min: 0, default: 0 },
    paidAmount: { type: Number, min: 0, default: 0 },
    // Server-computed: feeAmount - discount - paidAmount (never below 0)
    dueAmount: { type: Number, min: 0, default: 0 },
    // Server-computed from dueAmount/paidAmount
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partial', 'Pending'],
      default: 'Pending',
    },
    paymentMode: {
      type: String,
      enum: ['', 'Cash', 'UPI', 'Card', 'Bank Transfer'],
      default: '',
    },
    transactionId: { type: String, trim: true, default: '' },
    paymentDate: { type: Date },

    // Attendance (HH:mm strings from <input type="time">)
    checkInTime: { type: String, default: '' },
    checkOutTime: { type: String, default: '' },

    // Other
    emergencyContact: { type: String, trim: true, default: '' },
    guardianName: { type: String, trim: true, default: '' },
    guardianContact: { type: String, trim: true, default: '' },
    remarks: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'expired', 'inactive'],
      default: 'active',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

studentSchema.index({ studentId: 1 }, { unique: true, sparse: true });

/**
 * Recompute payment fields on every save so client-sent values are never trusted.
 */
studentSchema.pre('validate', function (next) {
  this.dueAmount = Math.max(0, (this.feeAmount || 0) - (this.discount || 0) - (this.paidAmount || 0));
  this.paymentStatus = this.dueAmount <= 0 ? 'Paid' : this.paidAmount > 0 ? 'Partial' : 'Pending';
  next();
});

/**
 * Auto-generate a sequential studentId (BG-0001) on create when left blank.
 * Numeric max is taken by parsing all existing BG-#### ids (a lexicographic
 * sort would break past BG-9999).
 */
studentSchema.pre('validate', async function (next) {
  if (!this.isNew || this.studentId) return next();
  try {
    const existing = await this.constructor
      .find({ studentId: /^BG-\d+$/ })
      .select('studentId');
    const max = existing.reduce(
      (acc, doc) => Math.max(acc, parseInt(doc.studentId.slice(3), 10) || 0),
      0
    );
    this.studentId = `BG-${String(max + 1).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Student', studentSchema);
