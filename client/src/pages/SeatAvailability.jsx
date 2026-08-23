import { useEffect, useState } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { daysLeft, formatDate, formatINR } from '../utils/helpers';

/** "Available in N days" / "Available today" for an occupied seat's vacancy countdown. */
const vacatesInText = (days) => {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
};

/**
 * Seat Availability: every seat cross-referenced with its current active
 * occupant (if any), so it's easy to see which seats are free right now
 * and how soon an occupied one will open up.
 */
export default function SeatAvailability() {
  const [seats, setSeats] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // null = show all; true = empty seats only; false = occupied seats only
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    api
      .get('/seat-fees/availability')
      .then(({ data }) => setSeats(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load seat availability'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const emptyCount = seats.filter((s) => !s.occupied).length;
  const occupiedCount = seats.length - emptyCount;
  const visibleSeats = filter === null ? seats : seats.filter((s) => s.occupied !== filter);
  // Clicking the already-active card clears the filter back to "all"
  const toggleFilter = (value) => setFilter((f) => (f === value ? null : value));

  return (
    <div>
      <h2 className="page-title">Seat Availability</h2>
      <ErrorMessage message={error} />

      <div className="cards-grid">
        <button
          className={`stat-card card-blue${filter === true ? ' stat-card-active' : ''}`}
          onClick={() => toggleFilter(true)}
        >
          <span className="stat-value">{emptyCount}</span>
          <span className="stat-label">Empty Seats</span>
        </button>
        <button
          className={`stat-card card-orange${filter === false ? ' stat-card-active' : ''}`}
          onClick={() => toggleFilter(false)}
        >
          <span className="stat-value">{occupiedCount}</span>
          <span className="stat-label">Occupied Seats</span>
        </button>
      </div>

      <div className="card table-wrap" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Seat No</th>
              <th>Fee (₹)</th>
              <th>Status</th>
              <th>Occupant</th>
              <th>Available In</th>
            </tr>
          </thead>
          <tbody>
            {visibleSeats.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  {seats.length === 0
                    ? 'No seats set up yet.'
                    : filter === true
                    ? 'No empty seats right now.'
                    : 'No occupied seats right now.'}
                </td>
              </tr>
            ) : (
              visibleSeats.map((s) => (
                <tr key={s.seatNumber}>
                  <td className="cell-strong">{s.seatNumber}</td>
                  <td>{formatINR(s.fees)}</td>
                  <td>
                    <span className={`badge ${s.occupied ? 'badge-red' : 'badge-green'}`}>
                      {s.occupied ? 'Occupied' : 'Empty'}
                    </span>
                  </td>
                  <td>{s.studentName || '-'}</td>
                  <td>
                    {s.occupied
                      ? `${vacatesInText(daysLeft(s.dueDate))} (${formatDate(s.dueDate)})`
                      : 'Available now'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
