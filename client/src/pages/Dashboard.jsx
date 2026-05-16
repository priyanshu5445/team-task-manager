import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, projectsAPI } from '../api/api';
import { BarChart3, CheckCircle2, Clock, AlertTriangle, TrendingUp, Calendar, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([tasksAPI.getStats(), projectsAPI.getAll()])
      .then(([s, p]) => { setStats(s.data); setProjects(p.data.slice(0, 4)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content"><p>Loading dashboard...</p></div>;

  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="page-content">
      <div className="page-header animate-in">
        <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's what's happening with your projects today.</p>
      </div>

      <div className="stats-grid">
        {[
          { icon: BarChart3, label: 'Total Tasks', value: stats?.total || 0, color: 'blue' },
          { icon: CheckCircle2, label: 'Completed', value: stats?.byStatus?.done || 0, color: 'green' },
          { icon: Clock, label: 'In Progress', value: stats?.byStatus?.['in-progress'] || 0, color: 'orange' },
          { icon: AlertTriangle, label: 'Overdue', value: stats?.overdue || 0, color: 'red' },
        ].map((s, i) => (
          <div className={`stat-card animate-in animate-in-delay-${i + 1}`} key={s.label}>
            <div className={`stat-icon ${s.color}`}><s.icon size={24} /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        {/* Recent Tasks */}
        <div className="card animate-in" style={{ gridColumn: stats?.recentTasks?.length ? '1' : '1/3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Recent Tasks</h3>
            <Link to="/tasks" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {stats?.recentTasks?.length ? (
            <div className="tasks-list">
              {stats.recentTasks.map(task => (
                <div className="task-card" key={task._id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className={`task-priority ${task.priority}`}></div>
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                      {task.project && <span><FolderKanban size={12} /> {task.project.name}</span>}
                      {task.dueDate && <span><Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  {task.assignedTo && <img src={task.assignedTo.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>No tasks yet. Create your first task!</p>
            </div>
          )}
        </div>

        {/* Projects Overview */}
        <div className="card animate-in animate-in-delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Projects</h3>
            <Link to="/projects" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {projects.length ? projects.map(project => {
            const total = project.totalTasks || 0;
            const done = project.taskStats?.done || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link to={`/projects/${project._id}`} key={project._id} style={{ display: 'block', padding: '14px 0', borderBottom: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.color }}></div>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{project.name}</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{pct}%</span>
                </div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </Link>
            );
          }) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>No projects yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Priority Distribution */}
      {stats && (
        <div className="card animate-in animate-in-delay-3" style={{ marginTop: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 20 }}>Priority Distribution</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Low', value: stats.byPriority?.low || 0, bg: 'var(--gradient-success)' },
              { label: 'Medium', value: stats.byPriority?.medium || 0, bg: 'var(--gradient-warning)' },
              { label: 'High', value: stats.byPriority?.high || 0, bg: 'var(--gradient-danger)' },
              { label: 'Urgent', value: stats.byPriority?.urgent || 0, bg: 'linear-gradient(135deg,#dc2626,#f97316)' },
            ].map(p => (
              <div key={p.label} style={{ flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.bg, margin: '0 auto 8px' }}></div>
                <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{p.value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
