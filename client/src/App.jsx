import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdmissionForm from './pages/AdmissionForm.jsx';
import SeatFees from './pages/SeatFees.jsx';
import SeatAvailability from './pages/SeatAvailability.jsx';
import StudentList from './pages/StudentList.jsx';
import EditStudent from './pages/EditStudent.jsx';
import ReminderList from './pages/ReminderList.jsx';
import Users from './pages/Users.jsx';

// Wraps private pages: bounce to /login when not authenticated
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Extra guard for super-admin-only pages
const RequireSuperAdmin = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'super-admin' ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="admission" element={<AdmissionForm />} />
        <Route path="seat-fees" element={<SeatFees />} />
        <Route path="seat-availability" element={<SeatAvailability />} />
        <Route path="students" element={<StudentList status="active" />} />
        <Route path="inactive-students" element={<StudentList status="inactive" />} />
        <Route path="students/:id/edit" element={<EditStudent />} />
        {/* The three reminder lists share one page, parameterised by days */}
        <Route path="reminders/3" element={<ReminderList days={3} />} />
        <Route path="reminders/2" element={<ReminderList days={2} />} />
        <Route path="reminders/0" element={<ReminderList days={0} />} />
        <Route
          path="users"
          element={
            <RequireSuperAdmin>
              <Users />
            </RequireSuperAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
