import { Search, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-left">
        <div className="navbar-search">
          <Search className="search-icon" size={16} />
          <input type="text" placeholder="Search tasks, projects..." id="navbar-search-input" />
        </div>
      </div>
      <div className="navbar-right">
        <button className="btn btn-ghost btn-icon" title="Notifications" id="notifications-btn">
          <Bell size={20} />
        </button>
        <div className="navbar-user" id="navbar-user-profile">
          <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`} alt={user?.name} />
          <span>{user?.name}</span>
          <span className="role-badge">{user?.role}</span>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout" id="logout-btn">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
