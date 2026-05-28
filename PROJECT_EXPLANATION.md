# Manpower Chain - Project Analysis and Improvement Specification

## 1. Project Goal

Manpower Chain should become a job-seeker registration and recruitment management
system. Its main purpose is:

1. Collect useful job application details from a candidate in a simple, trustworthy
   form.
2. Help an administrator quickly find suitable candidates, review supporting
   documents, contact them, and move them toward placement.

The current project already provides a good starting flow:

- Public multi-step registration form.
- Submission success screen.
- Admin login and protected dashboard route.
- Applicant list with filters, status updates, statistics, and CSV export.
- Demo storage through `localStorage` and live storage through Supabase.

The next version should focus on making applicant data complete enough for job
matching, while keeping the form friendly for users who may be applying on a
mobile phone.

## 2. Current Code Review

### Existing Application Structure

| Area | Current file | What it does now |
| --- | --- | --- |
| Applicant form | `src/pages/RegisterPage.jsx` | Four-step form for personal, location, education, and work details |
| Success state | `src/pages/SuccessPage.jsx` | Confirms that a registration was submitted |
| Admin authentication | `src/pages/AdminLogin.jsx` | Demo or Supabase sign-in |
| Admin dashboard | `src/pages/AdminDashboard.jsx` | Statistics, filters, table, refresh, and export |
| Results table | `src/components/ApplicantTable.jsx` | Displays candidates and changes status |
| Data operations | `src/api/api.js` | Demo/live insert, read, update, and CSV export |
| Database setup | `schema.sql` | `applicants` table with RLS policies |

### What Is Already Working Well

- A multi-step form avoids showing too many fields at once.
- Validation exists for name, Indian mobile number, required selections, and
  years of experience.
- Visual styling is consistent: clear card design, progress indicator, status
  colors, buttons, and dashboard statistics.
- Admin filters already match core hiring attributes: district, education, work
  category, experience, and status.
- Demo mode makes the UI easy to demonstrate without a configured backend.

### Main Gaps for the Real Goal

| Requirement | Current gap | Why it matters |
| --- | --- | --- |
| Collect job-ready candidate details | Only basic profile and one skills text box | Admin cannot confidently shortlist or match jobs |
| Resume upload | No file field, storage bucket, metadata, or admin preview/download | Supporting evidence is missing |
| All Indian states and districts | State is editable text and district options contain only Kerala districts | Location data becomes incomplete or inconsistent |
| Detailed education | Only highest qualification dropdown exists | Degree/trade, specialization, institution, and completion year are unknown |
| Better admin review | All information is compressed into a wide table | Large records become difficult to assess and act on |
| Candidate communication | No application reference number or status follow-up | Applicant has little confidence after submitting |

## 3. Important Technical Risks in Current Version

These issues should be resolved before using real applicant personal information.

### Access Control Is Too Broad

`schema.sql` allows any authenticated Supabase user to read and update all
applicants. An authenticated user is not automatically an administrator. Candidate
addresses, mobile numbers, email addresses, and resumes must only be available to
authorized staff.

Recommended change:

- Create an admin authorization model, such as a protected staff profile or admin
  role stored in trusted application metadata.
- Write RLS policies that allow reads and status updates only for authorized
  admins.
- Do not make authorization decisions from user-editable metadata.

### Client Route Protection Is Only Cosmetic

`ProtectedRoute.jsx` checks whether `localStorage.admin_token` exists. A visitor
can manually create that key and open the page shell. Although database RLS must
be the real protection, the dashboard should also validate the current Supabase
session and handle expired sessions cleanly.

### Public Insert and Returned Record Need Review

The form uses `.insert(...).select()` in live mode. The table policy allows public
insert but not public read. Returning an inserted row can require select
permission under RLS, so live public submission should be tested and adjusted.
The frontend normally only needs a success response and a safe public reference
number, not the full stored record.

### Resume Files Will Contain Sensitive Information

Resume uploads must not use a public bucket. Store them in a private Supabase
Storage bucket and provide short-lived signed access only to authorized admins.
Validate file type and size both in the UI and through storage/database controls.

## 4. Recommended Applicant Experience

### Design Direction

The applicant page should feel simple, reliable, and mobile-first:

- Use a friendly heading such as **Find work that fits your skills**.
- Add one short trust message: details are reviewed only for job placement.
- Display the estimated effort, for example **Takes about 4 minutes**.
- Keep one clear primary action on each step.
- Use large touch-friendly inputs and buttons on mobile.
- Allow English plus a local-language option later, especially for job categories
  and field helper text.
- Avoid requiring email for applicants who primarily use mobile phones; phone
  should be the main contact field and email can be optional.

### Recommended Form Steps

The existing four steps can be expanded to six focused steps without making any
single screen crowded.

| Step | Title | Information collected | UX notes |
| --- | --- | --- | --- |
| 1 | Basic Details | Full name, mobile number, alternate phone, email optional, date of birth/age, gender optional | Explain that mobile number is used for job contact |
| 2 | Address and Location | State, district, city/town, pincode, full address, willing-to-relocate toggle | District should depend on selected state |
| 3 | Education | Highest qualification, course/trade, specialization, institution, board/university, passing year, percentage/grade | Show fields conditionally based on qualification |
| 4 | Work Profile | Desired job category, preferred roles, years/months experience, skills, current employment, expected wage, availability | Use chips/multi-select for skills and jobs |
| 5 | Documents | Resume upload, optional certificate/license upload, driving license information where relevant | Clearly show accepted formats and upload progress |
| 6 | Review and Consent | Summary of all answers, edit buttons, privacy consent, declaration, submit | Helps prevent mistakes before submission |

### Required and Optional Fields

Required fields should remain limited to information needed to contact and match
a candidate.

| Section | Required fields | Optional fields |
| --- | --- | --- |
| Identity | Full name, phone | Alternate phone, date of birth, gender |
| Location | State, district, city/town or pincode | Street address, relocation preference |
| Education | Highest qualification | Detailed educational record for low-skill roles; require it for professional roles |
| Work | Job category, experience, availability | Salary expectation, preferred location, shift preference |
| Documents | Resume when required for the selected role | Certificates, license, ID proof only when operationally required |
| Consent | Privacy/accuracy consent | Communication preference |

Do not collect identity proofs in the first version unless the recruitment process
truly requires them; they increase privacy and security risk.

## 5. Resume Upload Requirement

### Candidate Interface

Add an upload panel in the document step:

- Label: **Upload Resume / CV**.
- Accept: PDF as preferred format; optionally DOC/DOCX if the business requires it.
- Maximum size: define a reasonable limit such as 5 MB.
- Show drag-and-drop area plus a normal **Choose file** button for mobile.
- After selection, show file name, file size, remove/replace option, and upload
  progress.
- If a role does not require a resume, let the candidate continue with
  **I do not have a resume** and allow admin-assisted profile completion.

### Recommended Storage Design

Use Supabase Storage rather than storing file content inside `applicants`.

| Item | Recommendation |
| --- | --- |
| Bucket | Private bucket named `applicant-resumes` |
| File path | `{applicant_id}/{generated_file_name}.pdf` rather than user-provided names alone |
| Table value | Store `resume_path`, `resume_original_name`, `resume_mime_type`, `resume_size_bytes`, and `resume_uploaded_at` |
| Candidate access | Upload only as part of an approved submission flow; no public browsing |
| Admin access | View/download with authenticated, authorized access or a short-lived signed URL |
| Validation | Permit configured MIME types and file-size limit; reject executable/unsupported files |

### Admin Interface for Resumes

The admin applicant detail view should include:

- Resume status: uploaded or not uploaded.
- **View resume** and **Download resume** actions.
- Uploaded file name and upload date.
- A warning if a file is missing for roles that require a CV.

Resume content should not be included in CSV export; export only an indication
such as `Resume Uploaded: Yes/No`.

## 6. All States and Districts Requirement

### Problem in Current Code

`RegisterPage.jsx` and `FilterBar.jsx` have a fixed list of Kerala districts, while
the `state` input is plain text defaulted to Kerala. This can create records such
as a Kerala district paired with an unrelated state and cannot support candidates
from all of India.

### Recommended User Interface

- Replace state text input with a searchable **State / Union Territory** select.
- Disable the **District** select until a state is selected.
- Load district values based on the selected state.
- When state changes, clear a previously selected district.
- Include search within dropdowns because district lists can be long on mobile.
- Store consistent values or stable location codes, not different spellings typed
  by users.

Example behavior:

```text
State / Union Territory: Tamil Nadu
District:                Coimbatore
City / Town:             Pollachi
Pincode:                 642001
```

### Data Source and Maintenance

Use a maintained official India state/district dataset and keep it as either:

- A versioned JSON data file in the frontend for a simple first release, or
- `states` and `districts` lookup tables in Supabase when admins need to maintain
  locations or reporting depends on location IDs.

For admin filtering, show the same dependent State -> District controls used in
the application form.

## 7. Detailed Education Requirement

### Problem in Current Code

The current single `education` field answers only "highest qualification". It
does not identify a trade, subject, college, certificate, or graduation year.

### Recommended Fields

| Field | Example | Required rule |
| --- | --- | --- |
| Highest qualification | ITI / Diploma / Degree | Always required |
| Course or trade name | Electrician, B.Com, Welding | Required when applicable |
| Specialization | Electrical Engineering | Optional or conditional |
| Institution name | Govt ITI Ernakulam | Optional in first release |
| Board / University | Kerala University | Optional |
| Passing year | 2022 | Required when candidate completed a course |
| Completion status | Completed / Pursuing / Discontinued | Required for diploma and above |
| Grade or percentage | 72% | Optional |
| Certificate available | Yes / No | Helpful for skilled trades |

### Form Behavior

- Selecting `Below SSLC` should hide college-related fields.
- Selecting `ITI` should ask for trade, year, and certificate availability.
- Selecting `Diploma`, `Degree`, or `Post Graduate` should ask for course,
  specialization, institution, completion status, and year.
- Let candidates add more than one qualification later through an
  **Add another qualification** control.

### Recommended Data Model

For a quick first improvement, additional highest-qualification columns can live
on `applicants`. For a scalable design, create a separate
`applicant_education` table because one candidate may have multiple qualifications.

```text
applicant_education
  id
  applicant_id
  qualification_level
  course_name
  specialization
  institution_name
  board_or_university
  passing_year
  completion_status
  score
  certificate_available
```

## 8. Applicant Page Design Improvements

### Layout Improvements

| Current design | Suggested improvement |
| --- | --- |
| Centered form card only | Add a simple desktop two-column hero: value/trust panel on the left and form card on the right; retain a single card on mobile |
| Step labels use small type | Display `Step 2 of 6` plus a progress percentage for easier understanding on small screens |
| Form depends heavily on inline styles | Move page-level styles into CSS classes for consistent responsive refinements |
| Generic worker registration heading | Use job-focused language and explain what happens after submission |
| Success page says admin will contact soon | Show an application/reference ID and practical next steps |

### Usability Improvements

- Save draft form progress locally so a user does not lose information after an
  accidental refresh.
- Add input modes such as numeric keyboard for mobile number and pincode.
- Validate pincode and document size before submit.
- Show clear inline error messages in simple language.
- Add a review screen before final submission.
- Add privacy consent with a link or short notice explaining data use.
- Include a support contact/WhatsApp number only if the organization actually
  supports it.

### Accessibility Improvements

- Connect each error message to its input using accessible error attributes.
- Ensure keyboard users can move through all controls and upload actions.
- Avoid color-only status meaning; use text and icons too.
- Maintain high contrast for light text, muted labels, and colored status chips.
- Respect reduced-motion preferences for animations.

## 9. Admin Page Design Improvements

### Dashboard Information Architecture

The current dashboard table is useful for a demo, but adding education and resume
fields will make it too wide. Use a list-and-detail workflow:

1. Dashboard header with total/new/shortlisted/interview/placed metrics.
2. Filter and search toolbar.
3. Compact applicant list showing name, job preference, location, experience,
   status, and resume indicator.
4. Applicant detail drawer or separate detail page for full information,
   documents, notes, and actions.

### Recommended Admin Features

| Feature | Benefit |
| --- | --- |
| Search by name, mobile, application ID | Find a candidate quickly during calls |
| State and dependent district filters | Supports nationwide recruitment |
| Resume available filter | Identifies application readiness |
| Job category, skills, education, availability filters | Better job matching |
| Date range and new/unread filter | Helps manage daily work |
| Detail view with sections | Prevents overloaded wide tables |
| Internal notes and follow-up date | Records recruiter progress |
| Status history timeline | Shows who changed a stage and when |
| Bulk shortlist/export | Saves admin time |
| Pagination | Avoids loading every applicant as the database grows |

### Better Recruitment Status Workflow

The current statuses are `pending`, `shortlisted`, `placed`, and `rejected`.
Recommended statuses:

```text
New -> Reviewed -> Contacted -> Shortlisted -> Interview Scheduled
    -> Selected -> Placed
    -> On Hold / Rejected
```

Keep a status history record rather than overwriting only the latest value. An
admin should be able to record a note such as "Called on 26 May; available from
June" and schedule a follow-up.

### Admin Visual Improvements

- Add a visible page title and secondary text describing active filters.
- Use a compact filter bar with an **Advanced filters** expansion.
- Make the status change a deliberate action in the detail panel, with optional
  notes, rather than an easy accidental dropdown change in every row.
- Show a small `CV` badge where a resume exists.
- Make table/list responsive: cards on narrow screens and a table on desktop.
- Replace the demo/live toggle in a production deployment with an environment
  choice unavailable to normal admins.

## 10. Suggested Data Model Improvements

### Updated Applicant Fields

| Group | Fields to add or revise |
| --- | --- |
| Contact | `alternate_phone`, optional `email`, `preferred_contact_method` |
| Location | `state_code`, `state_name`, `district_code`, `district_name`, `city`, `pincode`, `willing_to_relocate` |
| Profile | `date_of_birth` or `age`, `gender` if needed, `preferred_language` |
| Work matching | `desired_roles`, `availability`, `preferred_work_location`, `expected_salary`, `shift_preference` |
| Documents | `resume_path`, `resume_original_name`, `resume_mime_type`, `resume_size_bytes`, `resume_uploaded_at` |
| Workflow | `application_reference`, `assigned_admin_id`, `follow_up_at`, `updated_at` |
| Consent | `consent_accepted_at`, `privacy_notice_version` |

### Additional Tables

| Table | Purpose |
| --- | --- |
| `applicant_education` | Multiple qualifications for one candidate |
| `applicant_documents` | Resume and future certificates with private paths and metadata |
| `applicant_status_history` | Recruitment stage history and audit trail |
| `applicant_notes` | Private recruiter notes and follow-ups |
| `job_categories` | Managed list of job roles and active/inactive choices |
| `states` / `districts` | Consistent location lookup data, if not kept in frontend JSON |
| `admin_profiles` | Authorized staff identity and permissions |

### Indexes for Admin Filtering

Once these filters are implemented, index the columns regularly queried by the
dashboard, for example status, creation date, state/district identifiers, work
category, and assigned recruiter. The exact indexes should be selected after the
final query patterns are implemented and reviewed.

## 11. Security and Privacy Requirements

Applicant data is personal information, and resumes may contain additional
sensitive details. Minimum production requirements:

- Enforce admin-only RLS for applicant reads, updates, documents, notes, and
  exports.
- Keep public permissions limited to creating an application through a controlled
  submission flow.
- Store resumes in a private bucket; never expose permanent public resume URLs.
- Validate upload type and size and consider malware scanning before recruiter
  download in a production system.
- Use a verified Supabase session in the dashboard instead of trusting only a
  locally stored token string.
- Add consent text and a data retention/deletion policy.
- Do not export unnecessary private data by default.
- Add abuse controls for the public form, such as rate limiting or CAPTCHA when
  submissions become public-facing.
- Maintain status/notes audit history for accountability.

## 12. Feature Priority Roadmap

### Phase 1 - Collect Better Applications

- Replace Kerala-only location entry with state and dependent district selection.
- Add detailed education fields.
- Make phone primary and email optional if business rules permit.
- Add job preferences, availability, and relocation preference.
- Add a final review/consent step.
- Update admin display and CSV export for new structured values.

### Phase 2 - Documents and Admin Review

- Add resume upload to private storage with metadata.
- Build an applicant detail view with resume view/download.
- Add search, resume filter, state/district filters, pagination, and improved
  responsive list layout.
- Add richer recruitment statuses and internal follow-up notes.

### Phase 3 - Production Safety and Recruitment Operations

- Replace broad RLS policies with verified admin authorization.
- Validate session state properly in the UI.
- Add status history/audit trail and safe export rules.
- Add candidate reference numbers and optional application-status lookup.
- Add analytics such as job-category demand, placement conversion, and location
  availability.

## 13. Suggested Component and File Changes

| File or new area | Proposed responsibility |
| --- | --- |
| `src/pages/RegisterPage.jsx` | Convert the form into six steps and wire document/location/education inputs |
| `src/data/locations.js` or JSON | State and district option data for the first version |
| `src/components/ResumeUpload.jsx` | Candidate document selection, validation, and progress UI |
| `src/components/EducationFields.jsx` | Conditional detailed education fields |
| `src/pages/AdminDashboard.jsx` | Metrics, toolbar, pagination, and list/detail navigation |
| `src/pages/ApplicantDetailPage.jsx` | Full applicant review, resume, notes, and workflow actions |
| `src/api/api.js` | Upload/download document operations, expanded inserts, filters, and history actions |
| `schema.sql` or migrations | New columns/tables, storage rules, indexes, and secure RLS |
| `src/index.css` | Responsive form/admin layout and reusable page classes |

## 14. Recommended First Implementation Checklist

1. Finalize which applicant fields are required for each type of job.
2. Introduce state and district structured selection in both applicant and admin
   pages.
3. Add richer education input and update the applicant data model.
4. Add resume upload using private storage and admin-only viewing.
5. Redesign the admin results area into compact rows plus a detailed candidate
   view.
6. Harden authentication and Supabase RLS before collecting real applicant data.
7. Test mobile form completion, validation, document uploads, admin filters,
   exports, and unauthorized access attempts.

## 15. Final Recommendation

The current project is visually polished enough for a prototype and already has a
strong foundation in its form wizard and dashboard. It should not yet be treated
as a production recruitment system because the collected profile is too limited
for job matching and the live security model is too broad for personal records.

The best next version is a mobile-friendly application form that captures
structured location, education, job preferences, and resume data, paired with an
admin detail workflow that supports secure document review, filtering,
follow-ups, and placement tracking.
