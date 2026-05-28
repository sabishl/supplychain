export const EDUCATION_OPTIONS = [
  'Below SSLC',
  'SSLC',
  'Plus Two',
  'ITI',
  'Diploma',
  'Degree',
  'Post Graduate',
];

export const WORK_TYPES = [
  'Construction Worker',
  'Plumber',
  'Electrician',
  'Driver',
  'Cleaning Staff',
  'Cook / Kitchen Helper',
  'Security Guard',
  'Warehouse Staff',
  'Machine Operator',
  'Sales / Retail',
  'Office Assistant',
  'IT Support',
  'General Helper / Labour',
  'Other',
];

export const APPLICATION_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview Scheduled' },
  { value: 'selected', label: 'Selected' },
  { value: 'placed', label: 'Placed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'rejected', label: 'Rejected' },
];

export const AVAILABILITY_OPTIONS = [
  'Immediately',
  'Within 1 week',
  'Within 2 weeks',
  'Within 1 month',
  'Currently exploring',
];

// IDs follow the public CoWIN location metadata endpoint used for dependent district lookup.
export const INDIAN_STATES = [
  { id: '1', name: 'Andaman and Nicobar Islands' },
  { id: '2', name: 'Andhra Pradesh' },
  { id: '3', name: 'Arunachal Pradesh' },
  { id: '4', name: 'Assam' },
  { id: '5', name: 'Bihar' },
  { id: '6', name: 'Chandigarh' },
  { id: '7', name: 'Chhattisgarh' },
  { id: '8,37', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { id: '9', name: 'Delhi' },
  { id: '10', name: 'Goa' },
  { id: '11', name: 'Gujarat' },
  { id: '12', name: 'Haryana' },
  { id: '13', name: 'Himachal Pradesh' },
  { id: '14', name: 'Jammu and Kashmir' },
  { id: '15', name: 'Jharkhand' },
  { id: '16', name: 'Karnataka' },
  { id: '17', name: 'Kerala' },
  { id: '18', name: 'Ladakh' },
  { id: '19', name: 'Lakshadweep' },
  { id: '20', name: 'Madhya Pradesh' },
  { id: '21', name: 'Maharashtra' },
  { id: '22', name: 'Manipur' },
  { id: '23', name: 'Meghalaya' },
  { id: '24', name: 'Mizoram' },
  { id: '25', name: 'Nagaland' },
  { id: '26', name: 'Odisha' },
  { id: '27', name: 'Puducherry' },
  { id: '28', name: 'Punjab' },
  { id: '29', name: 'Rajasthan' },
  { id: '30', name: 'Sikkim' },
  { id: '31', name: 'Tamil Nadu' },
  { id: '32', name: 'Telangana' },
  { id: '33', name: 'Tripura' },
  { id: '34', name: 'Uttar Pradesh' },
  { id: '35', name: 'Uttarakhand' },
  { id: '36', name: 'West Bengal' },
];

import { STATE_DISTRICTS_MAP } from './indianDistricts';

export const getStateId = (stateName) => (
  INDIAN_STATES.find((state) => state.name === stateName)?.id || ''
);

export async function loadDistricts(stateName) {
  return STATE_DISTRICTS_MAP[stateName] || [];
}

