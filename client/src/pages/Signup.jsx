import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo"><span>⚡ TaskFlow</span></div>
        <h1>Create Account</h1>
        <p className="subtitle">Join your team and start managing tasks</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name">Full Name</label>
            <input id="signup-name" name="name" className="form-control" placeholder="John Doe" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="signup-email">Email Address</label>
            <input id="signup-email" name="email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input id="signup-password" name="password" type="password" className="form-control" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="signup-role">Role</label>
            <select id="signup-role" name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading} id="signup-submit">
            <UserPlus size={18} />
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Already have an account? <Link to="/login" style={{ color: '#a5b4fc', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
