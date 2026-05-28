import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Plus, Hash } from 'lucide-react';

export default function SuccessPage() {
  const location = useLocation();
  const applicantName = location.state?.applicantName || 'Applicant';
  const reference = location.state?.reference;

  return (
    <div className="app-container hero-gradient success-page">
      <div className="card-panel animate-fade-in success-card">
        
        {/* Animated Checkmark UI */}
        <div className="success-checkmark">
          <div className="check-icon">
            <span className="icon-line line-tip"></span>
            <span className="icon-line line-long"></span>
            <div className="icon-circle"></div>
            <div className="icon-fix"></div>
          </div>
        </div>

        <h2>
          Application Submitted!
        </h2>
        
        <p className="success-name">
          Thank you, {applicantName}!
        </p>
        
        <p className="success-copy">
          Your job profile has been received. Our placement team will review your qualifications and contact you when a suitable opportunity is available.
        </p>

        {reference && (
          <div className="reference-card">
            <span><Hash size={14} /> Application reference</span>
            <strong>{reference}</strong>
            <small>Keep this number for future communication.</small>
          </div>
        )}

        <div className="success-actions">
          <Link 
            to="/" 
            className="btn btn-primary submit-action"
          >
            <Plus size={16} />
            Submit another application
          </Link>
          
          <div className="success-security">
            <ShieldCheck size={14} />
            <span>Your application details are handled securely</span>
          </div>
        </div>

      </div>
    </div>
  );
}
