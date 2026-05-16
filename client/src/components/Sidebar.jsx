import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/team', icon: Users, label: 'Team' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><Zap size={20} /></div>
        <span>TaskFlow</span>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">Menu</div>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {isAdmin && (
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
            🔑 Admin Access
          </div>
        </div>
      )}
    </aside>
  );
}
