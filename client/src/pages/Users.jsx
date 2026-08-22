import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { formatDate } from '../utils/helpers';
import { IconExcel } from '../components/Icons.jsx';
import { exportToExcel } from '../utils/exportExcel';

const emptyForm = { name: '', email: '', password: '', role: 'admin' };

/**
 * Users page (super-admin only): create, list, edit and delete admins.
 * The same modal form is used for create and edit; on edit, leaving the
 * password blank keeps the existing password.
 */
export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api
      .get('/users')
      .then(({ data }) => setUsers(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchUsers, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditingId(u._id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        // Only send the password when a new one was typed
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', form);
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete admin "${u.name}"?`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      setUsers((list) => list.filter((x) => x._id !== u._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Download the admin list as an .xlsx spreadsheet
  const handleExport = () => {
    const rows = users.map((u) => ({
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Created: formatDate(u.createdAt),
    }));
    if (!exportToExcel('admins', rows)) setError('Nothing to export');
  };

  return (
    <div>
      <div className="page-head">
        <h2 className="page-title">Users</h2>
        <div className="reminder-actions">
          <button
            className="btn btn-small btn-outline"
            onClick={handleExport}
            disabled={users.length === 0}
          >
            <IconExcel />
            Excel
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            + Add Admin
          </button>
        </div>
      </div>
      <ErrorMessage message={error} />

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Admin' : 'New Admin'}</h3>
          <div className="form-grid">
            <label className="field">
              <span>Name *</span>
              <input value={form.name} onChange={set('name')} required />
            </label>
            <label className="field">
              <span>Email *</span>
              <input type="email" value={form.email} onChange={set('email')} required />
            </label>
            <label className="field">
              <span>{editingId ? 'New Password (leave blank to keep)' : 'Password *'}</span>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                minLength="6"
                required={!editingId}
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={form.role} onChange={set('role')}>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
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
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="cell-strong">
                    {u.name} {u._id === me?._id && <span className="badge badge-blue">you</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role === 'super-admin' ? 'purple' : 'blue'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="cell-actions">
                    <button className="btn btn-small btn-outline" onClick={() => openEdit(u)}>
                      Edit
                    </button>
                    {u._id !== me?._id && (
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(u)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
