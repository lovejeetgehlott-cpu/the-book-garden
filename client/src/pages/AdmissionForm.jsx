import { useState } from 'react';
import api from '../api/axios';
import StudentForm from '../components/StudentForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

/** Admission page: create a new student. */
export default function AdmissionForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Bumping this key remounts StudentForm, clearing it after a save
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (values) => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/students', values);
      setSuccess(`Student "${data.name}" admitted successfully!`);
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admission-page">
      <h2 className="page-title">Admission Form</h2>
      {success && <div className="alert alert-success">{success}</div>}
      <ErrorMessage message={error} />
      <StudentForm
        key={formKey}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Admit Student"
      />
    </div>
  );
}
