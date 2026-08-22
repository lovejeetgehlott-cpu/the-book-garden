import { useEffect, useState } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const emptyForm = { seatNumber: '', fees: '' };

/**
 * Seat Fees page: set, edit and remove the fee amount for each seat number.
 * Kept separate from the Admission Form so seats can be priced up front,
 * independent of who ends up occupying them.
 */
export default function SeatFees() {
  const [seatFees, setSeatFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSeatFees = () => {
    setLoading(true);
    api
      .get('/seat-fees')
      .then(({ data }) => setSeatFees(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load seat fees'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchSeatFees, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (sf) => {
    setForm({ seatNumber: sf.seatNumber, fees: sf.fees });
    setEditingId(sf._id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = { seatNumber: form.seatNumber, fees: Number(form.fees) };
      if (editingId) {
        await api.put(`/seat-fees/${editingId}`, payload);
      } else {
        await api.post('/seat-fees', payload);
      }
      setShowForm(false);
      fetchSeatFees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save seat fee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sf) => {
    if (!window.confirm(`Delete fee for Seat ${sf.seatNumber}?`)) return;
    try {
      await api.delete(`/seat-fees/${sf._id}`);
      setSeatFees((list) => list.filter((x) => x._id !== sf._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete seat fee');
    }
  };

  return (
    <div>
      <div className="page-head">
        <h2 className="page-title">Seat Fees</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Seat Fee
        </button>
      </div>
      <ErrorMessage message={error} />

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Seat Fee' : 'New Seat Fee'}</h3>
          <div className="form-grid">
            <label className="field">
              <span>Seat No *</span>
              <input
                type="number"
                min="1"
                value={form.seatNumber}
                onChange={set('seatNumber')}
                placeholder="e.g. 12"
                required
              />
            </label>
            <label className="field">
              <span>Seat Fee (₹) *</span>
              <input
                type="number"
                min="0"
                step="any"
                value={form.fees}
                onChange={set('fees')}
                placeholder="e.g. 500"
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Seat No</th>
                <th>Fee (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {seatFees.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-row">
                    No seat fees set yet.
                  </td>
                </tr>
              ) : (
                seatFees.map((sf) => (
                  <tr key={sf._id}>
                    <td className="cell-strong">{sf.seatNumber}</td>
                    <td>₹{sf.fees}</td>
                    <td className="cell-actions">
                      <button className="btn btn-small btn-outline" onClick={() => openEdit(sf)}>
                        Edit
                      </button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(sf)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
