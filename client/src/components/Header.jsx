import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { IconLogout } from './Icons.jsx';

/**
 * Right side of the top navbar: the logged-in admin's name/role and a
 * Logout button.
 */
export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="header">
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
