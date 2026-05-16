import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, tasksAPI, usersAPI } from '../api/api';
import Modal from '../components/Modal';
import { Plus, ArrowLeft, Calendar, User, Trash2 } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', dueDate: '' });
  const [error, setError] = useState('');

  const load = () => {
    projectsAPI.getById(id).then(r => setProject(r.data)).catch(console.error);
    usersAPI.getAll().then(r => setUsers(r.data)).catch(console.error);
  };
  useEffect(load, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await tasksAPI.create({ ...taskForm, project: id });
      setShowTask(false);
      setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', dueDate: '' });
      load();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const updateTaskStatus = async (taskId, status) => {
    try { await tasksAPI.update(taskId, { status }); load(); } catch (err) { console.error(err); }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await tasksAPI.delete(taskId); load(); } catch (err) { console.error(err); }
  };

  if (!project) return <div className="page-content"><p>Loading...</p></div>;

  const statuses = ['todo', 'in-progress', 'review', 'done'];
  const statusLabels = { todo: '📋 To Do', 'in-progress': '🔨 In Progress', review: '👀 Review', done: '✅ Done' };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 20 }}>
        <Link to="/projects" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /> Back to Projects</Link>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color }}></div>
            <h1>{project.name}</h1>
            <span className={`project-status ${project.status}`}>{project.status}</span>
          </div>
          <p>{project.description || 'No description'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowTask(true)}><Plus size={18} /> Add Task</button>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, overflowX: 'auto' }}>
        {statuses.map(status => {
          const statusTasks = (project.tasks || []).filter(t => t.status === status);
          return (
            <div key={status} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', padding: 16, minHeight: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{statusLabels[status]}</span>
                <span className={`badge badge-${status}`}>{statusTasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {statusTasks.map(task => (
                  <div key={task._id} className="card" style={{ padding: 16, cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </div>
                    {task.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{task.description}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {task.assignedTo && <img src={task.assignedTo.avatar} alt={task.assignedTo.name} title={task.assignedTo.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                        {task.dueDate && <span style={{ fontSize: '0.75rem', color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? '#f87171' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={11} />{new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <select className="form-control" style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }} value={task.status} onChange={e => updateTaskStatus(task._id, e.target.value)}>
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {(isAdmin || task.createdBy?._id === user?.id) && <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(task._id)}><Trash2 size={14} /></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showTask} onClose={() => setShowTask(false)} title="Create Task">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <label>Task Title</label>
            <input className="form-control" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required placeholder="e.g. Design homepage" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="Task details..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" className="form-control" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Assign To</label>
            <select className="form-control" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Task</button>
        </form>
      </Modal>
    </div>
  );
}
