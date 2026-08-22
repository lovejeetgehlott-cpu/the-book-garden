import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

/**
 * App shell: a sticky topbar (brand + hamburger + user info on one row,
 * full-width nav wrapping to the row below it on desktop), routed page
 * content underneath. On tablet/mobile the nav row is replaced by a
 * hamburger-triggered slide-out drawer (see Sidebar.jsx).
 */
export default function Layout() {
  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="sidebar-brand">
          <img className="brand-logo" src="/logo.png" alt="" />
          <span className="brand-text">The Book Garden</span>
        </div>
        <Sidebar />
        <Header />
      </div>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
