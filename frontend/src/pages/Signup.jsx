import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">📄</div>
        <h1>Create Account</h1>
        <p className="auth-subtitle">Sign up to start analyzing your resume</p>

        <form onSubmit={handleSubmit}>
          <label className="upload-label" style={{ textAlign: 'left', display: 'block' }}>Full Name</label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />

          <label className="upload-label" style={{ textAlign: 'left', display: 'block' }}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />

          <label className="upload-label" style={{ textAlign: 'left', display: 'block' }}>Password</label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-analyze" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}