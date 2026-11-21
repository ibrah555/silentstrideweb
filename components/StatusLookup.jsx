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
        return { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'APPROVED / ONBOARDED' };
      case 'interview_scheduled':
        return { bg: 'rgba(56,189,248,0.15)', text: '#38bdf8', label: 'INTERVIEW SCHEDULED' };
      case 'under_review':
        return { bg: 'rgba(234,179,8,0.15)', text: '#facc15', label: 'BOARD REVIEW IN PROGRESS' };
      case 'assessed':
        return { bg: 'rgba(212,175,55,0.15)', text: '#D4AF37', label: 'ASSESSMENT COMPLETED' };
      case 'rejected':
        return { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'NOT SUCCESSFUL' };
      case 'applied':
      default:
        return { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: 'ASSESSMENT PENDING' };
    }
  };

  return (
    <div>
      {/* Search Input Box */}
      <form onSubmit={handleSearch} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
          Find Your Application
        </label>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
          Enter your Application Reference Code (e.g. <span style={{ color: '#D4AF37' }}>SSN-2026-ABCD</span>), Email address, or Phone Number:
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. SSN-2026-ABCD or 0712345678"
            style={{ flex: 1, minWidth: 240, padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14 }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#D4AF37',
              color: '#0f172a',
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
        <div style={{ background: '#451a1a', border: '1px solid #f87171', color: '#fca5a5', padding: '16px', borderRadius: 10, textAlign: 'center', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {searched && !application && !error && !loading && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94a3b8' }}>
          No application found matching &ldquo;{query}&rdquo;. Please verify your reference code or contact details.
        </div>
      )}

      {application && (
        <div style={{ background: '#1e293b', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 16, padding: '32px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.06em' }}>
                APPLICATION REF: {application.app_code}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '4px 0 6px' }}>
                {application.full_name}
              </h2>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>
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
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.04em', marginBottom: 16 }}>
              APPLICATION PROGRESSION
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {/* Step 1 */}
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4ade80', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  <span>✓</span> 1. Application Submitted
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Profile & text CV registered</div>
              </div>

              {/* Step 2 */}
              <div style={{
                background: '#0f172a',
                border: application.test_completed_at ? '1px solid #4ade80' : '1px solid #D4AF37',
                borderRadius: 10,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: application.test_completed_at ? '#4ade80' : '#D4AF37', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  <span>{application.test_completed_at ? '✓' : '●'}</span> 2. Online Evaluation Test
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {application.test_completed_at ? (
                    <span style={{ color: '#4ade80', fontWeight: 600 }}>Score: {application.test_score}% (Completed)</span>
                  ) : (
                    <span style={{ color: '#facc15' }}>Action Required</span>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div style={{
                background: '#0f172a',
                border: ['approved', 'hired'].includes(application.status) ? '1px solid #4ade80' : '1px solid #334155',
                borderRadius: 10,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: ['approved', 'hired'].includes(application.status) ? '#4ade80' : '#cbd5e1', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  <span>{['approved', 'hired'].includes(application.status) ? '✓' : '○'}</span> 3. Final Decision & Contract
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {['approved', 'hired'].includes(application.status) ? 'Approved by Board' : 'Pending Review'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Callouts */}
          {!application.test_completed_at && (
            <div style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  Pending Action: Complete Your Evaluation Test
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  Your application will be forwarded to the Directors once the 5-minute online test is finished.
                </div>
              </div>
              <Link
                href={`/careers/assessment/${application.id}`}
                style={{ background: '#D4AF37', color: '#0f172a', padding: '10px 20px', borderRadius: 8, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}
              >
                Take Evaluation Test ➔
              </Link>
            </div>
          )}

          {application.agent_id && (
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  🎉 Congratulations! Your Application Was Approved
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 13 }}>
                  Your official Commercial Sales Agency Agreement is generated and ready for electronic signature.
                </div>
              </div>
              <Link
                href={`/contract/${application.agent_id}`}
                style={{ background: '#22c55e', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}
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
