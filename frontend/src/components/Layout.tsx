import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { Network, ClipboardList, Zap, LogOut } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    navigate('/login');
  };
  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="/halleyx_logo.jpeg"
            alt="Halleyx"
            className="sidebar-logo-img"
          />
          <div>
            <div className="logo-text">Halleyx</div>
            <span className="logo-sub">Workflow Engine</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Main</span>

          <NavLink
            to="/workflows"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Network size={16} />
            <span className="nav-label">Workflows</span>
          </NavLink>

          <NavLink
            to="/audit"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <ClipboardList size={16} />
            <span className="nav-label">Audit Log</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer flex-col items-start gap-1">
          <div className="flex items-center gap-2 mb-2 w-full">
            <Zap size={12} style={{ color: 'var(--brand)', flexShrink: 0 }} />
            <span className="version-chip">v1.0 · Challenge I</span>
          </div>
          <button 
            className="btn btn-ghost w-full justify-start" 
            style={{ color: 'var(--text-muted)', fontSize: 12, padding: '6px 8px' }}
            onClick={handleLogout}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
