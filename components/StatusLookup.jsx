'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StatusLookup({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/careers/status?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to locate application.');
      }

      setApplication(data.application);
    } catch (err) {
      setError(err.message);
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'hired':
      case 'approved':
        return { bg: '#E4F2EA', text: '#1E7F4F', label: 'APPROVED / ONBOARDED' };
      case 'interview_scheduled':
        return { bg: '#E0F2FE', text: '#0369A1', label: 'INTERVIEW SCHEDULED' };
      case 'under_review':
        return { bg: '#F3EBDC', text: '#7A6234', label: 'BOARD REVIEW IN PROGRESS' };
      case 'assessed':
        return { bg: '#F3EBDC', text: '#7A6234', label: 'ASSESSMENT COMPLETED' };
      case 'rejected':
        return { bg: '#F7E4E2', text: '#B3372F', label: 'NOT SUCCESSFUL' };
      case 'applied':
      default:
        return { bg: '#ECEAE4', text: '#6B7684', label: 'ASSESSMENT PENDING' };
    }
  };

  return (
    <div>
      {/* Search Input Box */}
      <form onSubmit={handleSearch} style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 24, marginBottom: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#082138', marginBottom: 6 }}>
          Find Your Application
        </label>
        <p style={{ color: '#6B7684', fontSize: 13, marginBottom: 16 }}>
          Enter your Application Reference Code (e.g. <span style={{ color: '#AE8E4D', fontWeight: 600 }}>SSN-2026-ABCD</span>), Email address, or Phone Number:
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. SSN-2026-ABCD or 0712345678"
            style={{ flex: 1, minWidth: 240, padding: '12px 16px', background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 8, color: '#1A2430', fontSize: 14 }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#082138',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            {loading ? 'Searching...' : 'Check Status ➔'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B3372F', padding: '16px', borderRadius: 10, textAlign: 'center', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {searched && !application && !error && !loading && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 32, textAlign: 'center', color: '#6B7684' }}>
          No application found matching &ldquo;{query}&rdquo;. Please verify your reference code or contact details.
        </div>
      )}

      {application && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #E4E1D8', paddingBottom: 20, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#AE8E4D', fontWeight: 700, letterSpacing: '0.06em' }}>
                APPLICATION REF: {application.app_code}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#082138', margin: '4px 0 6px' }}>
                {application.full_name}
              </h2>
              <div style={{ color: '#6B7684', fontSize: 13 }}>
                Role: <b>{application.position}</b> • Applied: {new Date(application.created_at).toLocaleDateString()}
              </div>
            </div>

            <div>
              {(() => {
                const badge = getStatusBadge(application.status);
                return (
                  <span style={{ display: 'inline-block', background: badge.bg, color: badge.text, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
                    {badge.label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Stepper Timeline */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#082138', letterSpacing: '0.02em', marginBottom: 16 }}>
              APPLICATION PROGRESSION
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {/* Step 1 */}
              <div style={{ background: '#F7F6F2', border: '1px solid #E4E1D8', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1E7F4F', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  <span>✓</span> 1. Application Submitted
                </div>
                <div style={{ fontSize: 12, color: '#6B7684' }}>Profile & text CV registered</div>
              </div>

              {/* Step 2 */}
              <div style={{
                background: '#F7F6F2',
                border: application.test_completed_at ? '1px solid #1E7F4F' : '1px solid #AE8E4D',
                borderRadius: 10,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: application.test_completed_at ? '#1E7F4F' : '#AE8E4D', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  <span>{application.test_completed_at ? '✓' : '●'}</span> 2. Online Evaluation Test
                </div>
                <div style={{ fontSize: 12, color: '#6B7684' }}>
                  {application.test_completed_at ? (
                    <span style={{ color: '#1E7F4F', fontWeight: 600 }}>Score: {application.test_score}% (Completed)</span>
                  ) : (
                    <span style={{ color: '#7A6234', fontWeight: 600 }}>Action Required</span>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div style={{
                background: '#F7F6F2',
                border: ['approved', 'hired'].includes(application.status) ? '1px solid #1E7F4F' : '1px solid #E4E1D8',
                borderRadius: 10,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: ['approved', 'hired'].includes(application.status) ? '#1E7F4F' : '#1A2430', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  <span>{['approved', 'hired'].includes(application.status) ? '✓' : '○'}</span> 3. Final Decision & Contract
                </div>
                <div style={{ fontSize: 12, color: '#6B7684' }}>
                  {['approved', 'hired'].includes(application.status) ? 'Approved by Board' : 'Pending Review'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Callouts */}
          {!application.test_completed_at && (
            <div style={{ background: '#F3EBDC', border: '1px solid #E4E1D8', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ color: '#082138', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  Pending Action: Complete Your Evaluation Test
                </div>
                <div style={{ color: '#6B7684', fontSize: 13 }}>
                  Your application will be forwarded to the Directors once the 5-minute online test is finished.
                </div>
              </div>
              <Link
                href={`/careers/assessment/${application.id}`}
                style={{ background: '#082138', color: '#FFFFFF', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
              >
                Take Evaluation Test ➔
              </Link>
            </div>
          )}

          {application.agent_id && (
            <div style={{ background: '#E4F2EA', border: '1px solid #A7F3D0', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ color: '#1E7F4F', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  🎉 Congratulations! Your Application Was Approved
                </div>
                <div style={{ color: '#1A2430', fontSize: 13 }}>
                  Your official Commercial Sales Agency Agreement is generated and ready for electronic signature.
                </div>
              </div>
              <Link
                href={`/contract/${application.agent_id}`}
                style={{ background: '#1E7F4F', color: '#FFFFFF', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
              >
                View & Sign Official Contract ➔
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
