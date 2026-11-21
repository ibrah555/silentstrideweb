'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ApplicationForm({ subsidiaries = [], preselectedSubsidiary = '' }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    idNumber: '',
    residence: '',
    entityId: preselectedSubsidiary || (subsidiaries[0]?.id || ''),
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
      <div style={{ background: '#1e293b', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          ✓
        </div>
        <div style={{ fontSize: 13, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>
          APPLICATION SUBMITTED SUCCESSFULLY
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Welcome, {submittedApp.fullName || 'Candidate'}!
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.6 }}>
          Your profile has been registered in the Silent Strides Network system. Your official Application Reference Code is:
        </p>

        <div style={{ display: 'inline-block', background: '#0f172a', border: '2px dashed #D4AF37', borderRadius: 10, padding: '12px 24px', fontSize: 22, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.06em', marginBottom: 28 }}>
          {submittedApp.appCode}
        </div>

        <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 20, maxWidth: 540, margin: '0 auto 32px', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 6 }}>
            Next Step: Online Interview Evaluation Assessment
          </div>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            To complete your application for review by the Board of Directors, please take the quick 5-minute sales & ethics assessment now.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link
            href={`/careers/assessment/${submittedApp.id}`}
            style={{ background: '#D4AF37', color: '#0f172a', padding: '14px 32px', borderRadius: 10, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 16px rgba(212,175,55,0.3)' }}
          >
            Start Online Evaluation Test ➔
          </Link>
          <Link
            href="/careers/status"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '14px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
          >
            Track Status Later
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && (
        <div style={{ background: '#451a1a', border: '1px solid #f87171', color: '#fca5a5', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
          ⚠ {error}
        </div>
      )}

      {/* Step 1: Personal & Contact */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#D4AF37', marginBottom: 16, letterSpacing: '0.04em' }}>
          1. PERSONAL & CONTACT DETAILS
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              Full Legal Name *
            </label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Kennedy Omondi Mwangi"
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. candidate@example.com"
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              Phone Number (M-Pesa Active) *
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 0712 345 678"
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              National ID / Passport Number
            </label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              placeholder="e.g. 31245678"
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              Town / County of Residence
            </label>
            <input
              type="text"
              name="residence"
              value={formData.residence}
              onChange={handleChange}
              placeholder="e.g. Eldoret / Uasin Gishu"
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              Preferred Subsidiary / Territory *
            </label>
            <select
              name="entityId"
              required
              value={formData.entityId}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14 }}
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
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#D4AF37', marginBottom: 8, letterSpacing: '0.04em' }}>
          2. CURRICULUM VITAE & EXPERIENCE (TEXT)
        </h3>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
          No file upload needed. Please fill out your summary, sales track record, and references below.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              Professional Summary / Pitch
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Brief overview of yourself, your energy, and why you are excited to represent Silent Strides Network..."
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              Work & Field Sales Experience (Products sold, companies, key achievements) *
            </label>
            <textarea
              name="experience"
              rows={4}
              required
              value={formData.experience}
              onChange={handleChange}
              placeholder="e.g. 2023 - 2025: Field Sales Rep at ABC Distributors. Managed 30 retail shops in Eldoret, exceeded monthly sales quota by 15%..."
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              Education & Relevant Training
            </label>
            <textarea
              name="education"
              rows={2}
              value={formData.education}
              onChange={handleChange}
              placeholder="e.g. Diploma in Business Management / KCSE Certificate / Certificate in Sales & Marketing..."
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
              Referees (2 Names, Relationship & Phone Contacts) *
            </label>
            <textarea
              name="referees"
              rows={3}
              required
              value={formData.referees}
              onChange={handleChange}
              placeholder="1. Jane Doe - Former Supervisor, ABC Ltd - Tel: 0722 000 000&#10;2. John Kamau - Community Leader / Pastor - Tel: 0733 000 000"
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? '#64748b' : '#D4AF37',
          color: '#0f172a',
          padding: '16px 32px',
          borderRadius: 10,
          fontWeight: 800,
          fontSize: 16,
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
        }}
      >
        {loading ? 'Submitting Application...' : 'Submit Application & Continue to Evaluation Test ➔'}
      </button>
    </form>
  );
}
