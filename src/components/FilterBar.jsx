import { useEffect, useState } from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import {
  APPLICATION_STATUSES,
  EDUCATION_OPTIONS,
  INDIAN_STATES,
  WORK_TYPES,
  loadDistricts,
} from '../data/formOptions';

export default function FilterBar({ filters, setFilters, onReset }) {
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    let active = true;
    if (!filters.state) {
      return undefined;
    }
    loadDistricts(filters.state).then((items) => {
      if (active) setDistricts(items);
    });
    return () => {
      active = false;
    };
  }, [filters.state]);

  const change = (field) => (event) => {
    const value = event.target.value;
    if (field === 'state') setDistricts([]);
    setFilters((previous) => ({
      ...previous,
      [field]: value,
      ...(field === 'state' ? { district: '' } : {}),
    }));
  };

  return (
    <section className="filter-panel animate-fade-in">
      <div className="filter-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontWeight: 700 }}>
          <Filter size={16} className="text-primary-color" /> Filters
        </h3>
        <button 
          className="btn btn-secondary" 
          type="button" 
          onClick={onReset}
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', gap: '0.25rem', borderRadius: '6px' }}
          title="Reset all filters"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>
      <div className="search-field" style={{ marginBottom: '1rem' }}>
        <Search size={16} />
        <input value={filters.search} onChange={change('search')} placeholder="Search candidates..." />
      </div>
      <div className="filter-grid">
        <div className="form-group">
          <label>State</label>
          <select value={filters.state} onChange={change('state')}>
            <option value="">All states</option>
            {INDIAN_STATES.map((state) => <option key={state.name}>{state.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>District</label>
          <select value={filters.district} onChange={change('district')} disabled={!filters.state || districts.length === 0}>
            <option value="">{filters.state ? 'All districts' : 'Select state first'}</option>
            {districts.map((district) => <option key={district}>{district}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Job category</label>
          <select value={filters.work_type} onChange={change('work_type')}>
            <option value="">All categories</option>
            {WORK_TYPES.map((workType) => <option key={workType}>{workType}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Education</label>
          <select value={filters.education} onChange={change('education')}>
            <option value="">All qualifications</option>
            {EDUCATION_OPTIONS.map((education) => <option key={education}>{education}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Resume</label>
          <select value={filters.resume} onChange={change('resume')}>
            <option value="">Any</option>
            <option value="yes">Resume uploaded</option>
            <option value="no">No resume</option>
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={filters.status} onChange={change('status')}>
            <option value="">All stages</option>
            {APPLICATION_STATUSES.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
          </select>
        </div>
        <div className="form-group narrow-filter">
          <label>Min exp.</label>
          <input type="number" min="0" max="50" value={filters.min_exp} onChange={change('min_exp')} placeholder="0 yrs" />
        </div>
        <div className="form-group narrow-filter">
          <label>Max exp.</label>
          <input type="number" min="0" max="50" value={filters.max_exp} onChange={change('max_exp')} placeholder="50 yrs" />
        </div>
      </div>
    </section>
  );
}
