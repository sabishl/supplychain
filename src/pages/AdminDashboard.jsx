import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import ApplicantTable from '../components/ApplicantTable';
import { fetchApplicants, exportCsv, adminLogout } from '../api/api';
import logo from '../assets/logo.png';
import { LogOut, Download, RefreshCw, Users, Clock, Star, CheckCircle } from 'lucide-react';

const EMPTY_FILTERS = {
  search: '',
  state: '',
  district: '',
  education: '',
  work_type: '',
  min_exp: '',
  max_exp: '',
  resume: '',
  status: '',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [total, setTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Overall Statistics calculated from the total list of applicants (unfiltered or overall database)
  const [stats, setStats] = useState({
    total: 0,
    newApplications: 0,
    shortlisted: 0,
    placed: 0,
  });

  // Calculate clean query filters (remove empty keys)
  const getCleanFilters = (f) => {
    return Object.fromEntries(
      Object.entries(f).filter(([, val]) => val !== '')
    );
  };

  // Re-fetch data from API / Mock storage
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cleanFilters = getCleanFilters(filters);
      const res = await fetchApplicants(cleanFilters);
      setApplicants(res.data.applicants);
      setTotal(res.data.total);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Calculate stats based on ALL applicants in the system
      const allRes = await fetchApplicants({});
      const allItems = allRes.data.applicants;
      setStats({
        total: allItems.length,
        newApplications: allItems.filter(a => a.status === 'new' || a.status === 'pending').length,
        shortlisted: allItems.filter(a => ['shortlisted', 'interview', 'selected'].includes(a.status)).length,
        placed: allItems.filter(a => a.status === 'placed').length,
      });

    } catch (err) {
      console.error('Fetch applicants error:', err);
      // Unauthorized or invalid session: redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => {
    const timerId = setTimeout(() => loadData(), 0);
    return () => clearTimeout(timerId);
  }, [loadData]);

  // Handle logging out
  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  // Handle spreadsheet export
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const cleanFilters = getCleanFilters(filters);
      await exportCsv(cleanFilters);
    } catch (err) {
      console.error('CSV download failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app-container admin-shell">
      <header className="nav-header admin-header">
        <Link to="/admin/dashboard" className="brand">
          <img src={logo} alt="Manpower Chain Logo" style={{ height: '44px', objectFit: 'contain' }} />
          <span className="admin-brand-copy">
            <strong>Recruitment Console</strong>
          </span>
        </Link>

        <div className="admin-controls">
          <span className="mode-pill live">
            Secure live workspace
          </span>

          <span className="updated-label">
            Updated: {lastUpdated || 'Loading...'}
          </span>

          <button 
            className="btn btn-outline admin-refresh" 
            onClick={loadData}
            title="Refresh candidate register"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>

          <button 
            className="btn btn-secondary logout-action" 
            onClick={handleLogout}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Main dashboard body */}
      <main className="dashboard-main">
        <div className="dashboard-title">
          <div>
            <span className="eyebrow">OPERATIONS DASHBOARD</span>
            <h1>Recruitment workspace</h1>
            <p>Find the right people faster, review documents, and track placement progress.</p>
          </div>
        </div>
        
        {/* Dynamic statistics counter cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper total">
              <Users size={20} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Registered</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper new-applications">
              <Clock size={20} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.newApplications}</span>
              <span className="stat-label">New Applications</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper shortlisted">
              <Star size={20} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.shortlisted}</span>
              <span className="stat-label">Active Shortlist</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper placed">
              <CheckCircle size={20} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.placed}</span>
              <span className="stat-label">Successfully Placed</span>
            </div>
          </div>
        </div>

        {/* Interactive Filters Panel */}
        <FilterBar 
          filters={filters} 
          setFilters={setFilters} 
          onReset={() => setFilters(EMPTY_FILTERS)} 
        />

        {/* Table summary actions bar */}
        <div className="results-header">
          <h2>
            Candidates <span>({total} matching)</span>
          </h2>

          <button
            className="btn btn-primary export-action"
            onClick={handleExportCsv}
            disabled={total === 0 || exporting}
          >
            <Download size={16} />
            {exporting ? 'Downloading...' : 'Export CSV'}
          </button>
        </div>

        {/* Data results list table */}
        {loading ? (
          <div className="dashboard-loading">
            <RefreshCw size={32} className="spin" />
            <span>Updating applicant register...</span>
          </div>
        ) : (
          <ApplicantTable 
            applicants={applicants} 
            onStatusChange={loadData} 
          />
        )}
      </main>

    </div>
  );
}
