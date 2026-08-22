import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { formatDate, daysLeft } from '../utils/helpers';
import { exportToExcel } from '../utils/exportExcel';
import { IconWhatsApp, IconSms, IconMail, IconExcel } from '../components/Icons.jsx';

/** Badge colour for the days-left cell. */
const daysBadge = (days) => {
  if (days === null) return null;
  let cls = 'badge badge-green';
  if (days < 0) cls = 'badge badge-gray';
  else if (days === 0) cls = 'badge badge-red';
  else if (days <= 3) cls = 'badge badge-yellow';
  const text = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days} days`;
  return <span className={cls}>{text}</span>;
};

/**
 * Active/Inactive badge, computed live from days-left — a student whose
 * renewal is overdue (negative days left) is inactive, regardless of what
 * was last saved on the record.
 */
const statusBadge = (days) => {
  const isActive = days === null || days >= 0;
  return <span className={`badge badge-${isActive ? 'green' : 'gray'}`}>{isActive ? 'Active' : 'Inactive'}</span>;
};

/** Student List: searchable table with Edit/Delete actions. */
export default function StudentList({ status = '' }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState('');
  const [result, setResult] = useState('');
  const navigate = useNavigate();
  const isInactiveList = status === 'inactive';
  const pageTitle = isInactiveList ? 'Inactive Students' : 'Student List';

  const fetchStudents = useCallback(async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const params = {
        ...(query ? { search: query } : {}),
        ...(status ? { status } : {}),
      };
      const { data } = await api.get('/students', { params });
      setStudents(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => fetchStudents(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchStudents]);

  // Bulk-send the typed message to every student in the current (filtered)
  // list via the gateway. channel: 'whatsapp' | 'sms' | 'email'
  const sendAll = async (channel) => {
    const text = message.trim();
    if (!text) {
      setError('Type a message before sending.');
      return;
    }
    const label = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' }[channel];
    if (!window.confirm(`Send this ${label} message to all ${students.length} student(s) shown?`)) {
      return;
    }
    setSending(channel);
    setError('');
    setResult('');
    try {
      const { data } = await api.post('/students/notify-all', {
        message: text,
        channel,
        search: search || undefined,
        status: status || undefined,
      });
      setResult(`${label}: ${data.sent} sent, ${data.failed} failed (of ${data.total}).`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to send ${label} messages`);
    } finally {
      setSending('');
    }
  };

  // Download the current (filtered) list as students.xlsx
  const exportStudents = () => {
    const rows = students.map((s) => ({
      'Seat No': s.seatNumber || '-',
      'Student ID': s.studentId || '-',
      'Name': s.name,
      'Email': s.email || '-',
      'Phone Number': s.phone || '-',
      'Home Number': s.mobile || '-',
      'Fee': s.feeAmount,
      'Fees Type': s.paymentMode || '-',
      'Transaction ID': s.transactionId || '-',
      'Aadhaar': s.aadhaar || '-',
      'Joining Date': formatDate(s.admissionDate),
      'Expiry Date': formatDate(s.dueDate),
      'Status': daysLeft(s.dueDate) < 0 ? 'Inactive' : 'Active',
    }));
    if (!exportToExcel('students', rows)) setError('No students to export.');
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete student "${student.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/students/${student._id}`);
      setStudents((list) => list.filter((s) => s._id !== student._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  return (
    <div>
      <div className="page-head">
        <h2 className="page-title">{pageTitle}</h2>
        <div className="reminder-actions">
          <input
            className="search-box"
            placeholder="Search name, phone, seat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-small btn-outline" onClick={exportStudents}>
            <IconExcel />
            Excel
          </button>
        </div>
      </div>
      <div className="card broadcast">
        <label className="field field-full">
          <span>Broadcast message to all students shown</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="3"
            placeholder="Type a message to send to every student in the list…"
          />
        </label>
        <div className="broadcast-actions">
          <span className="broadcast-count">{students.length} recipient(s)</span>
          <button
            className="btn btn-small btn-whatsapp"
            onClick={() => sendAll('whatsapp')}
            disabled={students.length === 0 || !message.trim() || Boolean(sending)}
          >
            <IconWhatsApp />
            {sending === 'whatsapp' ? 'Sending…' : 'WhatsApp All'}
          </button>
          <button
            className="btn btn-small btn-outline"
            onClick={() => sendAll('sms')}
            disabled={students.length === 0 || !message.trim() || Boolean(sending)}
          >
            <IconSms />
            {sending === 'sms' ? 'Sending…' : 'SMS All'}
          </button>
          <button
            className="btn btn-small btn-primary"
            onClick={() => sendAll('email')}
            disabled={students.length === 0 || !message.trim() || Boolean(sending)}
          >
            <IconMail />
            {sending === 'email' ? 'Sending…' : 'Email All'}
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
                <th>Seat No</th>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Home Number</th>
                <th>Fee</th>
                <th>Fees Type</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-row">
                    {isInactiveList ? 'No inactive students found.' : 'No students found.'}
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id}>
                    <td className="cell-strong">{s.seatNumber || '-'}</td>
                    <td className="cell-strong">
                      {s.name}
                      {s.studentId && (
                        <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
                          {s.studentId}
                        </div>
                      )}
                    </td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.mobile || '-'}</td>
                    <td>₹{s.feeAmount}</td>
                    <td>{s.paymentMode || '-'}</td>
                    <td>{formatDate(s.dueDate)}</td>
                    <td>{daysBadge(daysLeft(s.dueDate))}</td>
                    <td>{statusBadge(daysLeft(s.dueDate))}</td>
                    <td className="cell-actions">
                      <button
                        className="btn btn-small btn-outline"
                        onClick={() => navigate(`/students/${s._id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(s)}
                      >
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
