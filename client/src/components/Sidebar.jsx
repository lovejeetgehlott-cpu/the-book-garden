import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconDashboard,
  IconQuill,
  IconStudents,
  IconClock,
  IconBell,
  IconShield,
  IconGem,
  IconMenu,
  IconClose,
  IconLogout,
} from './Icons.jsx';

/**
 * Nav links: a full-width horizontal row on desktop, and a hamburger button
 * that opens a slide-out drawer (with its own close button) on tablet/mobile.
 * The Users item is only rendered for super-admins.
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const items = [
    { to: '/', label: 'Dashboard', Icon: IconDashboard, end: true },
    { to: '/admission', label: 'Admission Form', Icon: IconQuill },
    { to: '/seat-fees', label: 'Seat Fees', Icon: IconGem },
    { to: '/students', label: 'Student List', Icon: IconStudents },
    { to: '/inactive-students', label: 'Inactive Students', Icon: IconStudents },
    { to: '/reminders/3', label: '3 Days Left', Icon: IconClock },
    { to: '/reminders/2', label: '2 Days Left', Icon: IconClock },
    { to: '/reminders/0', label: 'Last Day', Icon: IconBell },
  ];

  // Shared between the desktop row and the drawer; closes the drawer on tap
  const renderLinks = (onNavigate) => (
    <>
      {items.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">
            <Icon />
          </span>
          {label}
        </NavLink>
      ))}
      {user?.role === 'super-admin' && (
        <NavLink
          to="/users"
          onClick={onNavigate}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">
            <IconShield />
          </span>
          Users
        </NavLink>
      )}
    </>
  );

  return (
    <>
      <button className="nav-toggle" onClick={() => setOpen(true)} aria-label="Open menu">
        <IconMenu />
      </button>

      <nav className="sidebar-nav">{renderLinks()}</nav>

      {open && <div className="nav-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`nav-drawer${open ? ' open' : ''}`}>
        <div className="nav-drawer-head">
          <div className="nav-drawer-brand">
            <img className="brand-logo" src="/logo.png" alt="" />
            <span className="brand-text">The Book Garden</span>
          </div>
          <button className="nav-drawer-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <IconClose />
          </button>
        </div>
        <nav className="nav-drawer-links">{renderLinks(() => setOpen(false))}</nav>
        <div className="nav-drawer-footer">
          <button className="btn btn-outline btn-block" onClick={handleLogout}>
            <IconLogout />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
