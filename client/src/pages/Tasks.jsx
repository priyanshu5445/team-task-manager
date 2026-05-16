import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, projectsAPI, usersAPI } from '../api/api';
import Modal from '../components/Modal';
import { Plus, Trash2, Calendar, FolderKanban, CheckSquare, Filter } from 'lucide-react';

export default function Tasks() {
  const { isAdmin, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', project: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', project: '', priority: 'medium', assignedTo: '', dueDate: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.project) params.project = filters.project;
    tasksAPI.getAll(params).then(r => setTasks(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    projectsAPI.getAll().then(r => setProjects(r.data)).catch(console.error);
    usersAPI.getAll().then(r => setUsers(r.data)).catch(console.error);
  }, []);
  useEffect(load, [filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await tasksAPI.create(form);
      setShowCreate(false);
      setForm({ title: '', description: '', project: '', priority: 'medium', assignedTo: '', dueDate: '' });
      load();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    try { await tasksAPI.update(id, { status }); load(); } catch (err) { console.error(err); }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id); load(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Tasks</h1><p>View and manage all tasks across projects</p></div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-task-btn"><Plus size={18} /> New Task</button>
      </div>

      <div className="filter-bar">
        <Filter size={16} style={{ color: 'var(--text-muted)' }} />
        <select className="form-control" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} style={{ width: 'auto' }}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
        </select>
        <select className="form-control" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})} style={{ width: 'auto' }}>
          <option value="">All Priorities</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
        </select>
        <select className="form-control" value={filters.project} onChange={e => setFilters({...filters, project: e.target.value})} style={{ width: 'auto' }}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? <p>Loading...</p> : tasks.length === 0 ? (
        <div className="empty-state"><CheckSquare size={64} /><h3>No Tasks Found</h3><p>Create a task or adjust your filters.</p></div>
      ) : (
        <div className="tasks-list">
          {tasks.map((task, i) => (
            <div className={`task-card animate-in animate-in-delay-${(i % 4) + 1}`} key={task._id}>
              <div className={`task-priority ${task.priority}`}></div>
              <div className="task-info">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  {task.project && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FolderKanban size={12} /> {task.project.name}</span>}
                  {task.dueDate && <span style={{ color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? '#f87171' : undefined }}><Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="task-actions">
                {task.assignedTo && <img src={task.assignedTo.avatar} alt={task.assignedTo.name} title={task.assignedTo.name} style={{ width: 30, height: 30, borderRadius: '50%' }} />}
                <select className="form-control" style={{ padding: '6px 10px', fontSize: '0.78rem', width: 'auto' }} value={task.status} onChange={e => updateStatus(task._id, e.target.value)}>
                  <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                </select>
                {(isAdmin || task.createdBy?._id === user?.id) && <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(task._id)}><Trash2 size={16} /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Task">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group"><label>Title</label><input className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Task title" /></div>
          <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Details..." /></div>
          <div className="form-group"><label>Project</label>
            <select className="form-control" value={form.project} onChange={e => setForm({...form, project: e.target.value})} required>
              <option value="">Select project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label>Priority</label>
              <select className="form-control" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group"><label>Due Date</label><input type="date" className="form-control" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Assign To</label>
            <select className="form-control" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})}>
              <option value="">Unassigned</option>{users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Task</button>
        </form>
      </Modal>
    </div>
  );
}
