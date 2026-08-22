import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StudentForm from '../components/StudentForm.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

/** Edit page: loads the student, reuses StudentForm, saves via PUT. */
export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/students/${id}`)
      .then(({ data }) => setStudent(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load student'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values) => {
    setError('');
    setSubmitting(true);
    try {
      await api.put(`/students/${id}`, values);
      navigate('/students');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student');
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="page-title">Edit Student</h2>
      <ErrorMessage message={error} />
      {student && (
        <StudentForm
          initial={student}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Update Student"
        />
      )}
    </div>
  );
}
