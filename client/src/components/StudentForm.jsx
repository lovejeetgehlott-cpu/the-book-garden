import { useEffect, useState } from 'react';
import api from '../api/axios';
import { toInputDate } from '../utils/helpers';

const empty = {
  name: '',
  email: '',
  phone: '',
  mobile: '', // "Home Number" — a second contact number, separate from Phone Number
  seatNumber: '',
  shift: 'Full Day',
  feeAmount: '',
  paymentMode: '',
  transactionId: '',
  aadhaar: '',
  admissionDate: toInputDate(new Date()),
  dueDate: '',
};

/**
 * Reusable student form used by both the Admission page (create)
 * and the Edit page (update). Calls onSubmit(values) and lets the
 * parent handle the API call.
 */
export default function StudentForm({ initial, onSubmit, submitting, submitLabel }) {
  const [form, setForm] = useState(() => {
    if (!initial) return empty;
    // Whitelist against `empty` so API metadata (_id, timestamps) and
    // server-computed fields never round-trip back on submit.
    const picked = Object.fromEntries(
      Object.keys(empty).map((k) => [k, initial[k] ?? empty[k]])
    );
    return {
      ...picked,
      admissionDate: toInputDate(initial.admissionDate),
      dueDate: toInputDate(initial.dueDate),
    };
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const [seatOptions, setSeatOptions] = useState([]);

  // Seat Number choices come from the Seat Fees list, not a fixed 1-80 range
  useEffect(() => {
    api
      .get('/seat-fees')
      .then(({ data }) => setSeatOptions(data))
      .catch(() => {});
  }, []);

  // Picking a seat auto-fills its fee from the Seat Fees list; still editable after
  const setSeat = (e) => {
    const seatNumber = e.target.value;
    const match = seatOptions.find((sf) => sf.seatNumber === seatNumber);
    setForm((f) => ({
      ...f,
      seatNumber,
      feeAmount: match ? String(match.fees) : f.feeAmount,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      feeAmount: Number(form.feeAmount),
    });
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Name *</span>
          <input value={form.name} onChange={set('name')} placeholder="Student name" required />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} placeholder="student@email.com" />
        </label>
        <label className="field">
          <span>Phone Number *</span>
          <input
            value={form.phone}
            onChange={set('phone')}
            placeholder="e.g. 919876543210"
            required
          />
        </label>
        <label className="field">
          <span>Home Number</span>
          <input value={form.mobile} onChange={set('mobile')} placeholder="e.g. 9876543210" />
        </label>
        <label className="field">
          <span>Seat No</span>
          <select value={form.seatNumber} onChange={setSeat}>
            <option value="">Select…</option>
            {seatOptions.map((sf) => (
              <option key={sf._id} value={sf.seatNumber}>
                {sf.seatNumber} — ₹{sf.fees}
              </option>
            ))}
            {form.seatNumber && !seatOptions.some((sf) => sf.seatNumber === form.seatNumber) && (
              <option value={form.seatNumber}>{form.seatNumber}</option>
            )}
          </select>
        </label>
        <label className="field">
          <span>Shift</span>
          <select value={form.shift} onChange={set('shift')}>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
            <option value="Full Day">Full Day</option>
          </select>
        </label>
        <label className="field">
          <span>Fee (₹) *</span>
          <input
            type="number"
            min="0"
            step="any"
            value={form.feeAmount}
            onChange={set('feeAmount')}
            placeholder="e.g. 500"
            required
          />
        </label>
        <label className="field">
          <span>Fees Type</span>
          <select value={form.paymentMode} onChange={set('paymentMode')}>
            <option value="">Select…</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
          </select>
        </label>
        {form.paymentMode === 'UPI' && (
          <label className="field">
            <span>Transaction ID</span>
            <input
              value={form.transactionId}
              onChange={set('transactionId')}
              placeholder="UPI reference"
            />
          </label>
        )}
        <label className="field">
          <span>Aadhaar Card No</span>
          <input
            value={form.aadhaar}
            onChange={set('aadhaar')}
            placeholder="12-digit Aadhaar"
            pattern="\d{12}"
            title="Aadhaar must be 12 digits"
            inputMode="numeric"
          />
        </label>
        <label className="field field-dates">
          <span>Date of Joining *</span>
          <input type="date" value={form.admissionDate} onChange={set('admissionDate')} required />
        </label>
        <label className="field field-dates">
          <span>End Date *</span>
          <input type="date" value={form.dueDate} onChange={set('dueDate')} required />
        </label>
      </div>
      <button className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
