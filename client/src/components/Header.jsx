import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { IconLogout } from './Icons.jsx';
import api from '../api/axios';

// How often to re-check the backend while a page is open
const HEALTH_PING_MS = 60000;

/**
 * Pings GET /api/health on an interval and reports whether the backend
 * answered - surfaces a dead/stale backend deploy immediately instead of
 * admins discovering it as a random "Route not found" mid-task.
 */
const useServerHealth = () => {
  const [online, setOnline] = useState(null); // null = checking, else true/false

  useEffect(() => {
    let cancelled = false;
    const ping = () => {
      api
        .get('/health')
        .then(() => !cancelled && setOnline(true))
        .catch(() => !cancelled && setOnline(false));
    };
    ping();
    const id = setInterval(ping, HEALTH_PING_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return online;
};

/**
 * Right side of the top navbar: a live backend-connectivity badge, the
 * logged-in admin's name/role, and a Logout button.
 */
export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const online = useServerHealth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const healthClass = online === null ? 'badge-gray' : online ? 'badge-green' : 'badge-red';
  const healthLabel = online === null ? 'Checking…' : online ? 'Server Online' : 'Server Offline';

  return (
    <div className="header">
      <span className={`badge ${healthClass}`} title="Backend API connectivity">
        {healthLabel}
      </span>
      <div className="header-user">
        <div>
          <div className="header-name">{user?.name}</div>
          <div className="header-role">{user?.role}</div>
        </div>
      </div>
      <button className="btn btn-outline" onClick={handleLogout}>
        <IconLogout />
        Logout
      </button>
    </div>
  );
}
