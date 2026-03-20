import { Outlet, NavLink } from 'react-router-dom';
import { Network, ClipboardList, Zap } from 'lucide-react';

export default function Layout() {
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

        <div className="sidebar-footer">
          <Zap size={12} style={{ color: 'var(--brand)', flexShrink: 0 }} />
          <span className="version-chip">v1.0 · Challenge I</span>
        </div>
      </aside>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
