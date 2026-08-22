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

  return (
    <div>
      <h2 className="page-title">Seat Availability</h2>
      <ErrorMessage message={error} />

      <div className="cards-grid">
        <div className="stat-card card-blue">
          <span className="stat-value">{emptyCount}</span>
          <span className="stat-label">Empty Seats</span>
        </div>
        <div className="stat-card card-orange">
          <span className="stat-value">{occupiedCount}</span>
          <span className="stat-label">Occupied Seats</span>
        </div>
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
            {seats.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  No seats set up yet.
                </td>
              </tr>
            ) : (
              seats.map((s) => (
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
