import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  MapPin,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';
import { registerApplicant } from '../api/api';
import ResumeUpload from '../components/ResumeUpload';
import logo from '../assets/logo.png';
import {
  AVAILABILITY_OPTIONS,
  EDUCATION_OPTIONS,
  INDIAN_STATES,
  WORK_TYPES,
  loadDistricts,
} from '../data/formOptions';

const DRAFT_KEY = 'applicant_form_draft';
const TOTAL_STEPS = 6;
const DETAIL_QUALIFICATIONS = ['ITI', 'Diploma', 'Degree', 'Post Graduate'];

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  alternate_phone: '',
  email: '',
  state: 'Kerala',
  district: '',
  city: '',
  pincode: '',
  address: '',
  willing_to_relocate: false,
  education: '',
  course_name: '',
  institution_name: '',
  passing_year: '',
  certificate_available: '',
  work_type: '',
  preferred_role: '',
  experience_years: '',
  skills: '',
  availability: '',
  expected_salary: '',
  consent_accepted: false,
};

function getInitialForm() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    return draft ? { ...EMPTY_FORM, ...draft } : EMPTY_FORM;
  } catch {
    return EMPTY_FORM;
  }
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [formData, setFormData] = useState(getInitialForm);
  const [resumeFile, setResumeFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [districts, setDistricts] = useState([]);
  const [districtState, setDistrictState] = useState('loading');

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    let active = true;
    loadDistricts(formData.state).then((values) => {
      if (!active) return;
      setDistricts(values);
      setDistrictState(values.length > 0 ? 'loaded' : 'manual');
    });
    return () => {
      active = false;
    };
  }, [formData.state]);

  const updateField = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleStateChange = (event) => {
    setDistrictState('loading');
    setDistricts([]);
    setFormData((previous) => ({
      ...previous,
      state: event.target.value,
      district: '',
    }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.state;
      delete next.district;
      return next;
    });
  };

  const validateStep = (step) => {
    const nextErrors = {};

    if (step === 1) {
      if (formData.full_name.trim().length < 3) nextErrors.full_name = 'Enter your full name.';
      if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) nextErrors.phone = 'Enter a valid 10-digit mobile number.';
      if (formData.alternate_phone && !/^[6-9]\d{9}$/.test(formData.alternate_phone.trim())) {
        nextErrors.alternate_phone = 'Enter a valid alternate mobile number.';
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        nextErrors.email = 'Enter a valid email address.';
      }
    }

    if (step === 2) {
      if (!formData.state) nextErrors.state = 'Select your state or union territory.';
      if (!formData.district.trim()) nextErrors.district = 'Select or enter your district.';
      if (!formData.city.trim()) nextErrors.city = 'Enter your city or town.';
      if (formData.pincode && !/^\d{6}$/.test(formData.pincode.trim())) {
        nextErrors.pincode = 'Enter a valid 6-digit pincode.';
      }
    }

    if (step === 3) {
      if (!formData.education) nextErrors.education = 'Select your highest qualification.';
      if (DETAIL_QUALIFICATIONS.includes(formData.education) && !formData.course_name.trim()) {
        nextErrors.course_name = 'Enter your course or trade.';
      }
      if (formData.passing_year && !/^(19|20)\d{2}$/.test(formData.passing_year)) {
        nextErrors.passing_year = 'Enter a valid passing year.';
      }
    }

    if (step === 4) {
      if (!formData.work_type) nextErrors.work_type = 'Select the job category you prefer.';
      if (formData.experience_years === '' || Number(formData.experience_years) < 0 || Number(formData.experience_years) > 50) {
        nextErrors.experience_years = 'Enter experience between 0 and 50 years.';
      }
      if (!formData.availability) nextErrors.availability = 'Select when you can join.';
    }

    if (step === 6 && !formData.consent_accepted) {
      nextErrors.consent_accepted = 'Please confirm consent before submitting.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS));
      setServerError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep(6)) return;

    setLoading(true);
    setServerError('');
    try {
      const response = await registerApplicant(formData, resumeFile);
      localStorage.removeItem(DRAFT_KEY);
      navigate('/success', {
        state: {
          applicantName: formData.full_name,
          reference: response.data.applicant.application_reference,
        },
      });
    } catch (error) {
      setServerError(error.response?.data?.message || 'Submission failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Personal', icon: User },
    { label: 'Location', icon: MapPin },
    { label: 'Education', icon: GraduationCap },
    { label: 'Job', icon: Briefcase },
    { label: 'Resume', icon: FileText },
    { label: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="app-container hero-gradient">
      <main className="application-layout">
        <section className="application-intro">
          <img src={logo} alt="Manpower Chain Logo" className="hero-logo" />
          <span className="eyebrow">JOB SEEKER APPLICATION</span>
          <h1>Find work that matches your skills.</h1>
          <p>Tell us about your experience once. Our placement team will review your profile and contact you for suitable jobs.</p>
          <div className="trust-list">
            <div><ShieldCheck size={18} /><span>Your details are shared only with authorized placement staff.</span></div>
            <div><CheckCircle2 size={18} /><span>Easy mobile application, usually completed in about 4 minutes.</span></div>
            <div><FileText size={18} /><span>Resume is helpful, but you can apply without one.</span></div>
          </div>
        </section>

        <section className="application-card card-panel">
          <div className="application-card-heading">
            <div>
              <p className="step-count">Step {currentStep} of {TOTAL_STEPS}</p>
              <h2>Create your job profile</h2>
            </div>
            <span className="progress-percent">{Math.round((currentStep / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} />
          </div>
          <div className="step-tabs" aria-label="Application progress">
            {steps.map(({ label, icon: Icon }, index) => (
              <div className={`step-tab ${currentStep === index + 1 ? 'active' : ''} ${currentStep > index + 1 ? 'completed' : ''}`} key={label}>
                <Icon size={15} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <section className="form-step animate-fade-in">
                <h3>How can employers reach you?</h3>
                <p className="form-step-copy">Your mobile number is the main contact method for job updates.</p>
                <div className="form-group">
                  <label htmlFor="full_name">Full name <span className="required">*</span></label>
                  <input id="full_name" autoFocus value={formData.full_name} onChange={(event) => updateField('full_name', event.target.value)} placeholder="Enter your full name" />
                  {errors.full_name && <span className="error-text">{errors.full_name}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Mobile number <span className="required">*</span></label>
                    <input id="phone" inputMode="numeric" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="10-digit number" />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="alternate_phone">Alternate number <span className="optional-label">(optional)</span></label>
                    <input id="alternate_phone" inputMode="numeric" value={formData.alternate_phone} onChange={(event) => updateField('alternate_phone', event.target.value)} placeholder="Backup contact" />
                    {errors.alternate_phone && <span className="error-text">{errors.alternate_phone}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email address <span className="optional-label">(optional)</span></label>
                  <input id="email" type="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} placeholder="name@example.com" />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="form-step animate-fade-in">
                <h3>Where are you currently based?</h3>
                <p className="form-step-copy">Location helps us recommend jobs near you or in places you prefer.</p>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="state">State / Union Territory <span className="required">*</span></label>
                    <select id="state" value={formData.state} onChange={handleStateChange}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((state) => <option value={state.name} key={state.name}>{state.name}</option>)}
                    </select>
                    {errors.state && <span className="error-text">{errors.state}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="district">District <span className="required">*</span></label>
                    {districtState === 'loaded' ? (
                      <select id="district" value={formData.district} onChange={(event) => updateField('district', event.target.value)}>
                        <option value="">Select district</option>
                        {districts.map((district) => <option value={district} key={district}>{district}</option>)}
                      </select>
                    ) : (
                      <input id="district" value={formData.district} onChange={(event) => updateField('district', event.target.value)} placeholder={districtState === 'loading' ? 'Loading districts...' : 'Enter your district'} disabled={districtState === 'loading'} />
                    )}
                    {districtState === 'manual' && <span className="field-help">District list unavailable right now. Please type your district.</span>}
                    {errors.district && <span className="error-text">{errors.district}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City / Town <span className="required">*</span></label>
                    <input id="city" value={formData.city} onChange={(event) => updateField('city', event.target.value)} placeholder="Your city or town" />
                    {errors.city && <span className="error-text">{errors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="pincode">Pincode <span className="optional-label">(optional)</span></label>
                    <input id="pincode" inputMode="numeric" value={formData.pincode} onChange={(event) => updateField('pincode', event.target.value)} placeholder="6-digit pincode" />
                    {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address <span className="optional-label">(optional)</span></label>
                  <textarea id="address" rows="2" value={formData.address} onChange={(event) => updateField('address', event.target.value)} placeholder="House name, street, landmark" />
                </div>
                <label className="check-row">
                  <input type="checkbox" checked={formData.willing_to_relocate} onChange={(event) => updateField('willing_to_relocate', event.target.checked)} />
                  <span>I am willing to relocate for a suitable job.</span>
                </label>
              </section>
            )}

            {currentStep === 3 && (
              <section className="form-step animate-fade-in">
                <h3>Tell us about your education.</h3>
                <p className="form-step-copy">Trade and course information helps recruiters find skilled opportunities.</p>
                <div className="form-group">
                  <label htmlFor="education">Highest qualification <span className="required">*</span></label>
                  <select id="education" value={formData.education} onChange={(event) => updateField('education', event.target.value)}>
                    <option value="">Select qualification</option>
                    {EDUCATION_OPTIONS.map((education) => <option key={education}>{education}</option>)}
                  </select>
                  {errors.education && <span className="error-text">{errors.education}</span>}
                </div>
                {formData.education && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="course_name">Course / Trade {DETAIL_QUALIFICATIONS.includes(formData.education) && <span className="required">*</span>}</label>
                        <input id="course_name" value={formData.course_name} onChange={(event) => updateField('course_name', event.target.value)} placeholder="Example: Electrician, B.Com" />
                        {errors.course_name && <span className="error-text">{errors.course_name}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="passing_year">Passing year <span className="optional-label">(optional)</span></label>
                        <input id="passing_year" inputMode="numeric" value={formData.passing_year} onChange={(event) => updateField('passing_year', event.target.value)} placeholder="Example: 2022" />
                        {errors.passing_year && <span className="error-text">{errors.passing_year}</span>}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="institution_name">Institution <span className="optional-label">(optional)</span></label>
                        <input id="institution_name" value={formData.institution_name} onChange={(event) => updateField('institution_name', event.target.value)} placeholder="School, college or ITI" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="certificate_available">Certificate available?</label>
                        <select id="certificate_available" value={formData.certificate_available} onChange={(event) => updateField('certificate_available', event.target.value)}>
                          <option value="">Select</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}

            {currentStep === 4 && (
              <section className="form-step animate-fade-in">
                <h3>What kind of work are you looking for?</h3>
                <p className="form-step-copy">Choose your closest category and add skills recruiters should notice.</p>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="work_type">Job category <span className="required">*</span></label>
                    <select id="work_type" value={formData.work_type} onChange={(event) => updateField('work_type', event.target.value)}>
                      <option value="">Select category</option>
                      {WORK_TYPES.map((workType) => <option key={workType}>{workType}</option>)}
                    </select>
                    {errors.work_type && <span className="error-text">{errors.work_type}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="preferred_role">Preferred role <span className="optional-label">(optional)</span></label>
                    <input id="preferred_role" value={formData.preferred_role} onChange={(event) => updateField('preferred_role', event.target.value)} placeholder="Example: Site electrician" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="experience_years">Experience in years <span className="required">*</span></label>
                    <input id="experience_years" type="number" min="0" max="50" value={formData.experience_years} onChange={(event) => updateField('experience_years', event.target.value)} placeholder="0 for fresher" />
                    {errors.experience_years && <span className="error-text">{errors.experience_years}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="availability">Available to join <span className="required">*</span></label>
                    <select id="availability" value={formData.availability} onChange={(event) => updateField('availability', event.target.value)}>
                      <option value="">Select availability</option>
                      {AVAILABILITY_OPTIONS.map((availability) => <option key={availability}>{availability}</option>)}
                    </select>
                    {errors.availability && <span className="error-text">{errors.availability}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="skills">Skills <span className="optional-label">(recommended)</span></label>
                    <textarea id="skills" rows="2" value={formData.skills} onChange={(event) => updateField('skills', event.target.value)} placeholder="Welding, driving licence, MS Office" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="expected_salary">Expected monthly wage <span className="optional-label">(optional)</span></label>
                    <input id="expected_salary" inputMode="numeric" value={formData.expected_salary} onChange={(event) => updateField('expected_salary', event.target.value)} placeholder="Amount in INR" />
                  </div>
                </div>
              </section>
            )}

            {currentStep === 5 && (
              <section className="form-step animate-fade-in">
                <h3>Add your resume.</h3>
                <p className="form-step-copy">A resume helps employers review you faster. You can submit without one if you do not have it now.</p>
                <ResumeUpload
                  file={resumeFile}
                  error={errors.resume}
                  onChange={(file, error) => {
                    setResumeFile(file);
                    setErrors((previous) => ({ ...previous, resume: error }));
                  }}
                />
                <div className="privacy-note">
                  <ShieldCheck size={18} />
                  <p>Your resume is treated as private information and is available only to authorized recruitment staff.</p>
                </div>
              </section>
            )}

            {currentStep === 6 && (
              <section className="form-step animate-fade-in">
                <h3>Review your application.</h3>
                <p className="form-step-copy">Please check the details before submitting. You can go back to correct anything.</p>
                <div className="review-grid">
                  <ReviewItem label="Name and phone" value={`${formData.full_name} | ${formData.phone}`} />
                  <ReviewItem label="Location" value={`${formData.city}, ${formData.district}, ${formData.state}`} />
                  <ReviewItem label="Education" value={[formData.education, formData.course_name].filter(Boolean).join(' - ')} />
                  <ReviewItem label="Job preference" value={[formData.work_type, formData.preferred_role].filter(Boolean).join(' - ')} />
                  <ReviewItem label="Experience / availability" value={`${formData.experience_years} years | ${formData.availability}`} />
                  <ReviewItem label="Resume" value={resumeFile ? resumeFile.name : 'Not provided'} />
                </div>
                <label className="check-row consent-row">
                  <input type="checkbox" checked={formData.consent_accepted} onChange={(event) => updateField('consent_accepted', event.target.checked)} />
                  <span>I confirm these details are correct and consent to their use for job placement communication.</span>
                </label>
                {errors.consent_accepted && <span className="error-text">{errors.consent_accepted}</span>}
              </section>
            )}

            {serverError && <div className="form-alert">{serverError}</div>}

            <div className="wizard-actions">
              {currentStep > 1 ? (
                <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep((step) => step - 1)} disabled={loading}>
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <span />}
              {currentStep < TOTAL_STEPS ? (
                <button type="button" className="btn btn-primary" onClick={goNext}>
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button type="submit" className="btn btn-primary submit-action" disabled={loading}>
                  {loading ? 'Submitting...' : <><Send size={16} /> Submit application</>}
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

function ReviewItem({ label, value }) {
  return (
    <div className="review-item">
      <span>{label}</span>
      <strong>{value || 'Not provided'}</strong>
    </div>
  );
}
