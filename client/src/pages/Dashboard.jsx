import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { IconStudents, IconClock, IconBell } from '../components/Icons.jsx';

/**
 * Dashboard: four clickable summary cards. Clicking a card opens the
 * matching list page.
 */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    { label: 'Total Students', value: stats?.totalStudents, to: '/students', cls: 'card-blue', Icon: IconStudents },
    { label: '3 Days Left', value: stats?.threeDaysLeft, to: '/reminders/3', cls: 'card-yellow', Icon: IconClock },
    { label: '2 Days Left', value: stats?.twoDaysLeft, to: '/reminders/2', cls: 'card-orange', Icon: IconClock },
    { label: 'Last Day', value: stats?.lastDay, to: '/reminders/0', cls: 'card-red', Icon: IconBell },
  ];

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>
      <ErrorMessage message={error} />
      <div className="cards-grid">
        {cards.map((card) => (
          <button
            key={card.label}
            className={`stat-card ${card.cls}`}
            onClick={() => navigate(card.to)}
          >
            <span className="stat-icon">
              <card.Icon />
            </span>
            <span className="stat-value">{card.value ?? '-'}</span>
            <span className="stat-label">{card.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
