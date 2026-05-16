import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, usersAPI } from '../api/api';
import Modal from '../components/Modal';
import { Plus, Trash2, FolderKanban } from 'lucide-react';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', members: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    projectsAPI.getAll().then(r => setProjects(r.data)).catch(console.error).finally(() => setLoading(false));
    usersAPI.getAll().then(r => setUsers(r.data)).catch(console.error);
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await projectsAPI.create(form);
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#6366f1', members: [] });
      load();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create project'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try { await projectsAPI.delete(id); load(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const toggleMember = (uid) => {
    setForm(f => ({
      ...f,
      members: f.members.includes(uid) ? f.members.filter(m => m !== uid) : [...f.members, uid]
    }));
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Projects</h1><p>Manage and track all your team projects</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-project-btn"><Plus size={18} /> New Project</button>}
      </div>

      {loading ? <p>Loading...</p> : projects.length === 0 ? (
        <div className="empty-state"><FolderKanban size={64} /><h3>No Projects Yet</h3><p>Create your first project to get started.</p>
          {isAdmin && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Project</button>}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p, i) => {
            const total = p.totalTasks || 0;
            const done = p.taskStats?.done || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div className={`project-card animate-in animate-in-delay-${(i % 4) + 1}`} key={p._id}>
                <div className="project-color" style={{ background: p.color }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Link to={`/projects/${p._id}`}><h3>{p.name}</h3></Link>
                  <span className={`project-status ${p.status}`}>{p.status}</span>
                </div>
                <p>{p.description || 'No description'}</p>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }}></div></div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>{done}/{total} tasks done ({pct}%)</div>
                <div className="project-meta">
                  <div className="members-avatars">
                    {p.members?.slice(0, 4).map(m => <img key={m._id} src={m.avatar} alt={m.name} title={m.name} />)}
                    {(p.members?.length || 0) > 4 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>+{p.members.length - 4}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link to={`/projects/${p._id}`} className="btn btn-secondary btn-sm">Open</Link>
                    {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p._id)}><Trash2 size={14} /></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Project">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Project Name</label>
            <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Website Redesign" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief project description..." />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm({...form, color: c})} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #fff' : '3px solid transparent', transition: 'var(--transition)' }} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Team Members</label>
            <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {users.map(u => (
                <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: form.members.includes(u._id) ? 'rgba(99,102,241,0.1)' : 'transparent' }}>
                  <input type="checkbox" checked={form.members.includes(u._id)} onChange={() => toggleMember(u._id)} />
                  <img src={u.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.88rem' }}>{u.name}</span>
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Project</button>
        </form>
      </Modal>
    </div>
  );
}
