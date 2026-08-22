const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User (Admin) model.
 * role: 'super-admin' can manage other users; 'admin' can manage students only.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return the hash by default
    },
    role: {
      type: String,
      enum: ['super-admin', 'admin'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

// Hash the password automatically whenever it is created or changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare a plaintext candidate against the stored hash
userSchema.methods.matchPassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
