import { supabase } from '../supabaseClient';

const RESUME_BUCKET = 'applicant-resumes';

const buildReference = () => {
  const year = new Date().getFullYear();
  const code = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  return `MC-${year}-${code}`;
};

async function uploadResume(reference, resumeFile) {
  if (!resumeFile) return {};

  const extension = resumeFile.name.split('.').pop()?.toLowerCase() || 'pdf';
  const resumePath = `${reference}/resume.${extension}`;
  const { error } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(resumePath, resumeFile, { contentType: resumeFile.type, upsert: false });

  if (error) {
    throw {
      response: {
        status: 500,
        data: { message: `Resume upload failed: ${error.message}` },
      },
    };
  }

  return {
    resume_path: resumePath,
    resume_original_name: resumeFile.name,
    resume_mime_type: resumeFile.type,
    resume_size_bytes: resumeFile.size,
    resume_uploaded_at: new Date().toISOString(),
  };
}

export const registerApplicant = async (formData, resumeFile) => {
  const applicationReference = buildReference();
  const applicantValues = {
    ...formData,
    email: formData.email.trim() || null,
    experience_years: Number(formData.experience_years) || 0,
    expected_salary: formData.expected_salary ? Number(formData.expected_salary) : null,
    application_reference: applicationReference,
    consent_accepted_at: new Date().toISOString(),
    status: 'new',
    created_at: new Date().toISOString(),
  };
  delete applicantValues.consent_accepted;

  const resumeValues = await uploadResume(applicationReference, resumeFile);
  const { error } = await supabase
    .from('applicants')
    .insert([{ ...applicantValues, ...resumeValues }]);

  if (error) {
    throw {
      response: {
        status: error.code === '23505' ? 409 : 500,
        data: { message: error.code === '23505' ? 'This email is already registered.' : error.message },
      },
    };
  }

  return {
    data: {
      message: 'Application submitted successfully.',
      applicant: { ...applicantValues, ...resumeValues },
    },
  };
};

export const adminLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw { response: { status: 401, data: { message: error.message } } };

  // Check if the authenticated user is in the admin_users table
  const { data: adminRecord, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    await supabase.auth.signOut();
    throw { response: { status: 403, data: { message: 'Your account is not authorized for the admin dashboard.' } } };
  }

  return { data: { user: data.user } };
};

export const adminLogout = async () => {
  await supabase.auth.signOut();
};

export const fetchApplicants = async (filters = {}) => {
  let query = supabase.from('applicants').select('*', { count: 'exact' });
  if (filters.search) {
    const search = filters.search.replaceAll(',', ' ');
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,application_reference.ilike.%${search}%`);
  }
  if (filters.state) query = query.eq('state', filters.state);
  if (filters.district) query = query.eq('district', filters.district);
  if (filters.education) query = query.eq('education', filters.education);
  if (filters.work_type) query = query.eq('work_type', filters.work_type);
  if (filters.min_exp !== undefined && filters.min_exp !== '') query = query.gte('experience_years', Number(filters.min_exp));
  if (filters.max_exp !== undefined && filters.max_exp !== '') query = query.lte('experience_years', Number(filters.max_exp));
  if (filters.resume === 'yes') query = query.not('resume_path', 'is', null);
  if (filters.resume === 'no') query = query.is('resume_path', null);
  if (filters.status) query = query.eq('status', filters.status);

  const { data, error, count } = await query.order('created_at', { ascending: false });
  if (error) throw { response: { status: 500, data: { message: error.message } } };
  return { data: { total: count || 0, applicants: data || [] } };
};

export const updateStatus = async (id, status) => {
  const { data, error } = await supabase.from('applicants').update({ status }).eq('id', id).select('id');
  if (error) throw { response: { status: 500, data: { message: error.message } } };
  if (!data?.length) throw { response: { status: 404, data: { message: 'Applicant not found.' } } };
  return { data: { message: 'Status updated.' } };
};

export const getResumeUrl = async (applicant) => {
  if (!applicant.resume_path) return null;
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).createSignedUrl(applicant.resume_path, 120);
  if (error) throw { response: { status: 500, data: { message: error.message } } };
  return data.signedUrl;
};

const toExportRow = (applicant) => ({
  'Reference ID': applicant.application_reference,
  'Full Name': applicant.full_name,
  Phone: applicant.phone,
  Email: applicant.email || '',
  City: applicant.city || '',
  District: applicant.district,
  State: applicant.state,
  Education: applicant.education,
  'Course / Trade': applicant.course_name || '',
  'Work Type': applicant.work_type,
  'Preferred Role': applicant.preferred_role || '',
  'Experience (yrs)': applicant.experience_years,
  Skills: applicant.skills || '',
  Availability: applicant.availability || '',
  'Resume Uploaded': applicant.resume_path ? 'Yes' : 'No',
  Status: applicant.status.toUpperCase(),
  'Registered On': new Date(applicant.created_at).toLocaleDateString('en-IN'),
});

const escapeCsvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export const exportCsv = async (filters) => {
  const { data } = await fetchApplicants(filters);
  const rows = data.applicants.map(toExportRow);
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `applicants_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
