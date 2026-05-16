import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api/api';
import { Users, Shield, ShieldCheck, Trash2, UserCog } from 'lucide-react';

export default function Team() {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { usersAPI.getAll().then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    if (!confirm(`Change role to ${newRole}?`)) return;
    try { await usersAPI.updateRole(id, newRole); load(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await usersAPI.delete(id); load(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const admins = users.filter(u => u.role === 'admin');
  const members = users.filter(u => u.role === 'member');

  return (
    <div className="page-content">
      <div className="page-header"><h1>Team Management</h1><p>View and manage your team members and roles</p></div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 32 }}>
        <div className="stat-card animate-in"><div className="stat-icon blue"><Users size={24} /></div><div className="stat-value">{users.length}</div><div className="stat-label">Total Members</div></div>
        <div className="stat-card animate-in animate-in-delay-1"><div className="stat-icon purple"><ShieldCheck size={24} /></div><div className="stat-value">{admins.length}</div><div className="stat-label">Admins</div></div>
        <div className="stat-card animate-in animate-in-delay-2"><div className="stat-icon green"><UserCog size={24} /></div><div className="stat-value">{members.length}</div><div className="stat-label">Members</div></div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="table-container animate-in">
          <table>
            <thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Joined</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={u.avatar} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border-subtle)' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name} {u._id === user?.id && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(You)</span>}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role === 'admin' ? '🔑 Admin' : '👤 Member'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td>
                      {u._id !== user?.id && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => toggleRole(u._id, u.role)}>
                            <Shield size={14} /> {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => deleteUser(u._id)} style={{ color: '#f87171' }}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
