import { useState } from 'react';
import {
  Award,
  Briefcase,
  Calendar,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  SearchCheck,
  X,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { getResumeUrl, updateStatus, deleteApplicant } from '../api/api';
import { APPLICATION_STATUSES } from '../data/formOptions';

const statusLabel = (status) => (
  APPLICATION_STATUSES.find((item) => item.value === status)?.label || status
);

export default function ApplicantTable({ applicants, onStatusChange }) {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateStatus(id, status);
      setSelected((applicant) => applicant?.id === id ? { ...applicant, status } : applicant);
      onStatusChange();
    } catch {
      setMessage('Status could not be updated. Please try again.');
    }
  };

  const handleDelete = async (applicant) => {
    if (!window.confirm(`Are you sure you want to delete ${applicant.full_name}? This action cannot be undone.`)) return;
    try {
      await deleteApplicant(applicant.id, applicant.resume_path);
      setMessage('Applicant deleted successfully.');
      setSelected(null);
      onStatusChange();
    } catch {
      setMessage('Applicant could not be deleted. Please try again.');
    }
  };

  const viewResume = async (applicant) => {
    if (!applicant.resume_path) return;
    try {
      const url = await getResumeUrl(applicant);
      if (!url) {
        setMessage('Resume preview is available in live mode after private storage is configured.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Resume could not be opened.');
    }
  };

  if (applicants.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <SearchCheck size={52} />
          <h3>No candidates found</h3>
          <p>Adjust your filters or search term to see more applications.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {message && <div className="dashboard-message">{message}<button onClick={() => setMessage('')} type="button"><X size={14} /></button></div>}
      <div className="candidate-list">
        {applicants.map((applicant) => (
          <article 
            className="candidate-card clickable" 
            key={applicant.id}
            onClick={() => setSelected(applicant)}
          >
            <div className="candidate-avatar">
              {applicant.full_name?.substring(0, 2).toUpperCase() || 'AB'}
            </div>
            <div className="candidate-primary">
              <span className="candidate-reference">{applicant.application_reference || `#${applicant.id}`}</span>
              <h3>{applicant.full_name}</h3>
              <p><Briefcase size={14} /> {applicant.preferred_role || applicant.work_type}</p>
            </div>
            <div className="candidate-meta">
              <span><MapPin size={14} /> {applicant.district}, {applicant.state}</span>
              <span><Award size={14} /> {applicant.education}{applicant.course_name ? ` - ${applicant.course_name}` : ''}</span>
              <span>{applicant.experience_years} yrs experience</span>
            </div>
            <div className="candidate-actions">
              {applicant.resume_path && <span className="cv-badge"><FileText size={13} /> CV</span>}
              <span className={`status-badge ${applicant.status}`}>{statusLabel(applicant.status)}</span>
              <ChevronRight size={18} className="card-chevron" />
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <div className="detail-backdrop" onClick={() => setSelected(null)}>
          <aside className="candidate-detail" onClick={(event) => event.stopPropagation()}>
            <header className="detail-header">
              <div>
                <span className="candidate-reference">{selected.application_reference || `#${selected.id}`}</span>
                <h2>{selected.full_name}</h2>
                <p>{selected.preferred_role || selected.work_type}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <button className="icon-action" type="button" onClick={() => handleDelete(selected)} aria-label="Delete applicant" title="Delete Applicant"><Trash2 size={19} color="#d32f2f" /></button>
                <button className="icon-action" type="button" onClick={() => setSelected(null)} aria-label="Close details" title="Close"><X size={19} /></button>
              </div>
            </header>
            <div className="detail-contact">
              <a href={`tel:${selected.phone}`}><Phone size={15} /> {selected.phone}</a>
              {selected.email && <a href={`mailto:${selected.email}`}><Mail size={15} /> {selected.email}</a>}
            </div>
            <DetailSection title="Location">
              <p>{[selected.city, selected.district, selected.state, selected.pincode].filter(Boolean).join(', ')}</p>
              {selected.willing_to_relocate && <span className="positive-tag">Open to relocation</span>}
            </DetailSection>
            <DetailSection title="Education">
              <p>{[selected.education, selected.course_name, selected.institution_name, selected.passing_year].filter(Boolean).join(' | ')}</p>
              {selected.certificate_available && <p>Certificate available: {selected.certificate_available}</p>}
            </DetailSection>
            <DetailSection title="Work profile">
              <p><strong>{selected.work_type}</strong> | {selected.experience_years} years experience</p>
              <p>{selected.skills || 'No additional skills provided.'}</p>
              <p>Available: {selected.availability || 'Not provided'}</p>
            </DetailSection>
            <DetailSection title="Resume">
              {selected.resume_path ? (
                <button className="btn btn-outline" type="button" onClick={() => viewResume(selected)}>
                  <Download size={15} /> View resume
                </button>
              ) : <p>No resume uploaded.</p>}
            </DetailSection>
            <DetailSection title="Hiring stage">
              <select className="stage-control" value={selected.status} onChange={(event) => handleStatusUpdate(selected.id, event.target.value)}>
                {APPLICATION_STATUSES.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
              </select>
              <p className="submitted-date"><Calendar size={14} /> Submitted {new Date(selected.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </DetailSection>
          </aside>
        </div>
      )}
    </>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
