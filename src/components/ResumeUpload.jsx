import { FileText, Upload, X } from 'lucide-react';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function ResumeUpload({ file, onChange, error }) {
  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;

    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      onChange(null, 'Upload a PDF, DOC, or DOCX resume only.');
      return;
    }

    if (nextFile.size > MAX_FILE_BYTES) {
      onChange(null, 'Resume must be 5 MB or smaller.');
      return;
    }

    onChange(nextFile, '');
  };

  return (
    <div className="form-group">
      <label htmlFor="resume-upload">Resume / CV <span className="optional-label">(recommended)</span></label>
      {file ? (
        <div className="file-selected">
          <FileText size={20} />
          <div className="file-info">
            <strong>{file.name}</strong>
            <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
          <button
            type="button"
            className="icon-action"
            aria-label="Remove resume"
            onClick={() => onChange(null, '')}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="upload-panel" htmlFor="resume-upload">
          <Upload size={24} />
          <strong>Choose your resume</strong>
          <span>PDF, DOC or DOCX, up to 5 MB</span>
        </label>
      )}
      <input
        className="visually-hidden"
        id="resume-upload"
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
      />
      {error && <span className="error-text">{error}</span>}
      <p className="field-help">No resume yet? You can still submit your profile and our team can contact you.</p>
    </div>
  );
}
