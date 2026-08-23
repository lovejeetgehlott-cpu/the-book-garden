import { useEffect, useState } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { formatDate, whatsappLink, reminderMessage } from '../utils/helpers';
import { IconWhatsApp, IconSms, IconMail, IconExcel } from '../components/Icons.jsx';
import { exportToExcel } from '../utils/exportExcel';

const TITLES = { 3: '3 Days Left', 2: '2 Days Left', 0: 'Last Day (Due Today)' };

/**
 * Shared page for the three reminder lists (3 days / 2 days / last day).
 *
 * Top corner: "WhatsApp All", "SMS All" and "Email All" buttons bulk-send the
 * renewal reminder to every student in the list at once through the server's
 * gateways, and an Excel button downloads the list as a spreadsheet. Each row
 * also keeps a per-student WhatsApp button (opens wa.me).
 */
export default function ReminderList({ days }) {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setResult('');
    api
      .get(`/students/reminders/${days}`)
      .then(({ data }) => setStudents(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reminders'))
      .finally(() => setLoading(false));
  }, [days]);

  // Per-row WhatsApp: opens wa.me in a new tab (free, admin taps send)
  const sendWhatsApp = (student) => {
    const message = reminderMessage(days, student);
    window.open(whatsappLink(student.phone, message), '_blank', 'noopener');
  };

  // Bulk send via the server gateways. channel: 'whatsapp' | 'sms' | 'email'
  const sendAll = async (channel) => {
    const label = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' }[channel];
    if (!window.confirm(`Send ${label} reminder to all ${students.length} student(s) in this list?`)) {
      return;
    }
    setSending(channel);
    setError('');
    setResult('');
    try {
      const { data } = await api.post(`/students/reminders/${days}/notify`, { channel });
      setResult(`${label}: ${data.sent} sent, ${data.failed} failed (of ${data.total}).`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to send ${label} reminders`);
    } finally {
      setSending('');
    }
  };

  // Download the current list as an .xlsx spreadsheet
  const handleExport = () => {
    const filename = days === 0 ? 'reminders-last-day' : `reminders-${days}-days`;
    const rows = students.map((s) => ({
      'Student ID': s.studentId,
      Name: s.name,
      Phone: s.phone,
      Seat: s.seatNumber || '-',
      Shift: s.shift || '-',
      'Fee Amount': s.feeAmount,
      'Due Date': formatDate(s.dueDate),
    }));
    if (!exportToExcel(filename, rows)) setError('Nothing to export');
  };

  const empty = students.length === 0;

  return (
    <div>
      <div className="page-head">
        <h2 className="page-title">{TITLES[days]}</h2>
        <div className="reminder-actions">
          <button
            className="btn btn-small btn-whatsapp"
            onClick={() => sendAll('whatsapp')}
            disabled={empty || Boolean(sending)}
          >
            <IconWhatsApp />
            {sending === 'whatsapp' ? 'Sending…' : 'WhatsApp All'}
          </button>
          <button
            className="btn btn-small btn-outline"
            onClick={() => sendAll('sms')}
            disabled={empty || Boolean(sending)}
          >
            <IconSms />
            {sending === 'sms' ? 'Sending…' : 'SMS All'}
          </button>
          <button
            className="btn btn-small btn-primary"
            onClick={() => sendAll('email')}
            disabled={empty || Boolean(sending)}
          >
            <IconMail />
            {sending === 'email' ? 'Sending…' : 'Email All'}
          </button>
          <button className="btn btn-small btn-outline" onClick={handleExport} disabled={empty}>
            <IconExcel />
            Excel
          </button>
        </div>
      </div>
      {result && <div className="alert alert-success">{result}</div>}
      <ErrorMessage message={error} />
      {loading ? (
        <Spinner />
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Seat</th>
                <th>Shift</th>
                <th>Fee Amount</th>
                <th>Due Date</th>
                <th>Reminder</th>
              </tr>
            </thead>
            <tbody>
              {empty ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    No renewals due in this list — all clear.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id}>
                    <td className="cell-strong">{s.name}</td>
                    <td>{s.phone}</td>
                    <td>{s.seatNumber || '-'}</td>
                    <td>{s.shift || '-'}</td>
                    <td>₹{s.feeAmount}</td>
                    <td>{formatDate(s.dueDate)}</td>
                    <td>
                      <button className="btn btn-small btn-whatsapp" onClick={() => sendWhatsApp(s)}>
                        <IconWhatsApp />
                        Send WhatsApp
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
