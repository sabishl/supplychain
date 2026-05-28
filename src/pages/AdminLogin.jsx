import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Lock,
  LogIn,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { adminLogin } from '../api/api';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();
      if (adminRecord) navigate('/admin/dashboard');
    });
  }, [navigate]);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard');
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">
        <ArrowLeft size={16} />
        Back to applicant form
      </Link>

      <main className="auth-layout">
        <section className="auth-intro">
          <img src={logo} alt="Manpower Chain Logo" style={{ height: '60px', objectFit: 'contain', marginBottom: '1.75rem', backgroundColor: '#fff', padding: '8px', borderRadius: '10px', boxShadow: 'var(--shadow-sm)' }} />
          <p className="eyebrow">ADMIN WORKSPACE</p>
          <h1>Manage placements with confidence.</h1>
          <p>Securely review profiles, check resumes, and move candidates through each recruitment stage.</p>
          <div className="auth-benefits">
            <span><Users size={18} /> Structured candidate profiles</span>
            <span><FileText size={18} /> Private resume access</span>
            <span><ShieldCheck size={18} /> Authorized team members only</span>
          </div>
        </section>

        <section className="card-panel auth-card animate-fade-in">
          <div className="auth-card-heading">
            <div className="auth-lock"><Lock size={20} /></div>
            <h2>Admin sign in</h2>
            <p>
              Use your authorized account to access applicant records.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="label-with-icon" htmlFor="admin-email">
                <Mail size={14} /> Work email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(''); }}
                placeholder="admin@yourcompany.com"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="label-with-icon" htmlFor="admin-password">
                <Lock size={14} /> Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => { setPassword(event.target.value); setError(''); }}
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <div className="auth-error animate-fade-in">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : <><LogIn size={16} /> Access dashboard</>}
            </button>
          </form>

        </section>
      </main>
    </div>
  );
}
