'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CountdownTimer from './CountdownTimer';

export default function ApplicationForm({ subsidiaries = [], preselectedSubsidiary = '', job = null }) {
  const router = useRouter();

  const isJobClosed = job && (
    job.status === 'closed' ||
    (job.closes_at && new Date().getTime() >= new Date(job.closes_at).getTime())
  );

  const [formData, setFormData] = useState({
    jobId: job?.id || '',
    fullName: '',
    email: '',
    phone: '',
    idNumber: '',
    residence: '',
    entityId: job?.entity_id || preselectedSubsidiary || (subsidiaries[0]?.id || ''),
    position: job?.title || 'Sales Agency Representative',
    bio: '',
    experience: '',
    education: '',
    referees: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedApp, setSubmittedApp] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isJobClosed) {
      setError('Applications for this position are currently closed.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmittedApp(data.application);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submittedApp) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 16, padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: '#E4F2EA', color: '#1E7F4F', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          ✓
        </div>
        <div style={{ fontSize: 13, color: '#AE8E4D', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>
          APPLICATION SUBMITTED SUCCESSFULLY
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#082138', marginBottom: 12 }}>
          Welcome, {submittedApp.fullName || 'Candidate'}!
        </h2>
        <p style={{ color: '#6B7684', fontSize: 15, maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.6 }}>
          Your profile has been registered in the Silent Strides Network system. Your official Application Reference Code is:
        </p>

        <div style={{ display: 'inline-block', background: '#F7F6F2', border: '2px dashed #AE8E4D', borderRadius: 10, padding: '12px 24px', fontSize: 22, fontWeight: 800, color: '#082138', letterSpacing: '0.06em', marginBottom: 28 }}>
          {submittedApp.appCode}
        </div>

        <div style={{ background: '#F3EBDC', border: '1px solid #E4E1D8', borderRadius: 12, padding: 20, maxWidth: 540, margin: '0 auto 32px', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, color: '#082138', fontSize: 14, marginBottom: 6 }}>
            Next Step: Online Interview Evaluation Assessment
          </div>
          <p style={{ color: '#6B7684', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            To complete your application for review by the Board of Directors, please take the quick 5-minute sales & ethics assessment now.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link
            href={`/careers/assessment/${submittedApp.id}`}
            style={{ background: '#082138', color: '#FFFFFF', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 12px rgba(8,33,56,0.15)' }}
          >
            Start Online Evaluation Test ➔
          </Link>
          <Link
            href="/careers/status"
            style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', color: '#1A2430', padding: '14px 24px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
          >
            Track Status Later
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Job opening banner with timer */}
      {job && (
        <div style={{
          background: '#FFFFFF',
          border: isJobClosed ? '1px solid #FECACA' : '1px solid #E4E1D8',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#AE8E4D', fontWeight: 700, letterSpacing: '0.04em' }}>
              TARGET APPLICATION POSITION
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#082138', margin: '4px 0 2px' }}>
              {job.title}
            </h2>
            <div style={{ fontSize: 13, color: '#6B7684' }}>
              Territory: <b>{job.entities?.name || 'General Network'}</b> • Rate: <b>{Math.round((job.commission_rate || 0.1) * 100)}%</b>
            </div>
          </div>

          <div>
            <CountdownTimer closesAt={job.closes_at} opensAt={job.opens_at} status={job.status} />
          </div>
        </div>
      )}

      {isJobClosed && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '14px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
          ⚠ Applications for this position have closed. You can explore other open positions on the <Link href="/careers" style={{ color: '#991B1B', textDecoration: 'underline' }}>Careers page</Link>.
        </div>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B3372F', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
          ⚠ {error}
        </div>
      )}

      {/* Step 1: Personal & Contact */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#082138', marginBottom: 16, letterSpacing: '0.02em' }}>
          1. PERSONAL & CONTACT DETAILS
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              Full Legal Name *
            </label>
            <input
              type="text"
              name="fullName"
              required
              disabled={isJobClosed}
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Kennedy Omondi Mwangi"
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              disabled={isJobClosed}
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. candidate@example.com"
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              Phone Number (M-Pesa Active) *
            </label>
            <input
              type="tel"
              name="phone"
              required
              disabled={isJobClosed}
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 0712 345 678"
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              National ID / Passport Number
            </label>
            <input
              type="text"
              name="idNumber"
              disabled={isJobClosed}
              value={formData.idNumber}
              onChange={handleChange}
              placeholder="e.g. 31245678"
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              Town / County of Residence
            </label>
            <input
              type="text"
              name="residence"
              disabled={isJobClosed}
              value={formData.residence}
              onChange={handleChange}
              placeholder="e.g. Eldoret / Uasin Gishu"
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              Designated Subsidiary / Territory *
            </label>
            <select
              name="entityId"
              required
              disabled={isJobClosed || !!job?.entity_id}
              value={formData.entityId}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14 }}
            >
              <option value="">Select a territory...</option>
              {subsidiaries.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: Text CV & Qualifications */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#082138', marginBottom: 6, letterSpacing: '0.02em' }}>
          2. CURRICULUM VITAE & EXPERIENCE (TEXT)
        </h3>
        <p style={{ color: '#6B7684', fontSize: 13, marginBottom: 20 }}>
          No file upload needed. Please fill out your summary, sales track record, and references below.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              Professional Summary / Pitch
            </label>
            <textarea
              name="bio"
              rows={3}
              disabled={isJobClosed}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Brief overview of yourself, your energy, and why you are excited to represent Silent Strides Network..."
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              Work & Field Sales Experience (Products sold, companies, key achievements) *
            </label>
            <textarea
              name="experience"
              rows={4}
              required
              disabled={isJobClosed}
              value={formData.experience}
              onChange={handleChange}
              placeholder="e.g. 2023 - 2025: Field Sales Rep at ABC Distributors. Managed 30 retail shops in Eldoret, exceeded monthly sales quota by 15%..."
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              Education & Relevant Training
            </label>
            <textarea
              name="education"
              rows={2}
              disabled={isJobClosed}
              value={formData.education}
              onChange={handleChange}
              placeholder="e.g. Diploma in Business Management / KCSE Certificate / Certificate in Sales & Marketing..."
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#6B7684', marginBottom: 6, fontWeight: 500 }}>
              Referees (2 Names, Relationship & Phone Contacts) *
            </label>
            <textarea
              name="referees"
              rows={3}
              required
              disabled={isJobClosed}
              value={formData.referees}
              onChange={handleChange}
              placeholder="1. Jane Doe - Former Supervisor, ABC Ltd - Tel: 0722 000 000&#10;2. John Kamau - Community Leader / Pastor - Tel: 0733 000 000"
              style={{ width: '100%', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || isJobClosed}
        style={{
          background: isJobClosed ? '#CBD5E1' : loading ? '#6B7684' : '#082138',
          color: isJobClosed ? '#64748B' : '#FFFFFF',
          padding: '16px 32px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
          border: 'none',
          cursor: isJobClosed || loading ? 'not-allowed' : 'pointer',
          boxShadow: isJobClosed ? 'none' : '0 4px 12px rgba(8,33,56,0.15)',
        }}
      >
        {isJobClosed ? 'Applications Closed for this Position' : loading ? 'Submitting Application...' : 'Submit Application & Continue to Evaluation Test ➔'}
      </button>
    </form>
  );
}
