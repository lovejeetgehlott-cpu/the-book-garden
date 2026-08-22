import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../api/axios';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { IconStudents, IconClock, IconBell } from '../components/Icons.jsx';
import { formatINR } from '../utils/helpers';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Chart tooltip styled to match the app's card surface. */
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card revenue-tooltip">
      <div className="revenue-tooltip-year">{label}</div>
      <div className="revenue-tooltip-value">{formatINR(payload[0].value)}</div>
    </div>
  );
};

/**
 * Dashboard: four clickable summary cards, plus a month-wise revenue chart.
 * Clicking a card opens the matching list page.
 */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/revenue-by-month')])
      .then(([statsRes, revenueRes]) => {
        setStats(statsRes.data);
        setRevenue(revenueRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    { label: 'Total Students', value: stats?.totalStudents, to: '/students', cls: 'card-blue', Icon: IconStudents },
    { label: '3 Days Left', value: stats?.threeDaysLeft, to: '/reminders/3', cls: 'card-yellow', Icon: IconClock },
    { label: '2 Days Left', value: stats?.twoDaysLeft, to: '/reminders/2', cls: 'card-orange', Icon: IconClock },
    { label: 'Last Day', value: stats?.lastDay, to: '/reminders/0', cls: 'card-red', Icon: IconBell },
  ];

  const chartData = (revenue || []).map((r) => ({
    ...r,
    label: `${MONTH_NAMES[r.month - 1]} ${r.year}`,
  }));
  const totalRevenue = chartData.reduce((sum, r) => sum + r.revenue, 0);

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

      <div className="card revenue-card">
        <div className="revenue-card-head">
          <h3>Revenue by Month</h3>
          {chartData.length > 0 && <span className="revenue-total">{formatINR(totalRevenue)} total</span>}
        </div>
        {chartData.length === 0 ? (
          <div className="empty-row">No admissions recorded yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--row-line)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: 'var(--hairline)' }}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                tickFormatter={(v) => formatINR(v)}
                width={72}
              />
              <Tooltip cursor={{ fill: 'var(--hairline-soft)' }} content={<RevenueTooltip />} />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
