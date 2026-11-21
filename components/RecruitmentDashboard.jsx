'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RecruitmentDashboard({ applications = [], entities = [], origin = '' }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [search, setSearch] = useState('');

  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [commissionRate, setCommissionRate] = useState(10);
  const [onboardEntity, setOnboardEntity] = useState('');
  const [onboarding, setOnboarding] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const baseUrl = origin || 'https://silentstrideweb.vercel.app';
  const publicApplyUrl = `${baseUrl}/careers/apply`;
  const publicCareersUrl = `${baseUrl}/careers`;

  // Filter applications
  const filtered = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (filterEntity !== 'all' && app.entity_id !== filterEntity) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        app.full_name?.toLowerCase().includes(q) ||
        app.app_code?.toLowerCase().includes(q) ||
        app.email?.toLowerCase().includes(q) ||
        app.phone?.toLowerCase().includes(q) ||
        app.residence?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setNotes(app.interview_notes || '');
    setOnboardEntity(app.entity_id || entities[0]?.id || '');
    setCommissionRate(10);
    setActionMsg(null);
    setActionErr(null);
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    setActionErr(null);
    try {
      const res = await fetch('/api/recruitment/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_notes',
          applicationId: selectedApp.id,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      selectedApp.interview_notes = notes;
      setActionMsg('Notes saved successfully.');
    } catch (err) {
      setActionErr(err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedApp) return;
    setActionErr(null);
    try {
      const res = await fetch('/api/recruitment/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          applicationId: selectedApp.id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      selectedApp.status = newStatus;
      setActionMsg(`Applicant status updated to: ${newStatus}`);
    } catch (err) {
      setActionErr(err.message);
    }
  };

  const handleOnboardAgent = async () => {
    if (!selectedApp) return;
    setOnboarding(true);
    setActionErr(null);
    try {
      const res = await fetch('/api/recruitment/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard_agent',
          applicationId: selectedApp.id,
          entityId: onboardEntity,
          commissionRate: Number(commissionRate) / 100,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      selectedApp.status = 'hired';
      selectedApp.agent_id = data.agentId;
      setActionMsg('Applicant successfully approved & onboarded! Agency contract is ready.');
    } catch (err) {
      setActionErr(err.message);
    } finally {
      setOnboarding(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div>
      {/* Public Share Links Banner */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
            PUBLIC RECRUITMENT CAMPAIGN LINKS
          </div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
            Share these links on WhatsApp, LinkedIn, or posters for open candidate applications:
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, fontFamily: 'monospace' }}>
            {publicApplyUrl}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => copyToClipboard(publicApplyUrl)}
            style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {copiedLink ? '✓ Link Copied!' : '📋 Copy Application Link'}
          </button>
          <a
            href="/careers"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
          >
            Preview Careers Page ↗
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search candidate name, ref, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, minWidth: 240 }}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13 }}
          >
            <option value="all">All Pipeline Stages</option>
            <option value="applied">Applied (Test Pending)</option>
            <option value="assessed">Assessed (Test Completed)</option>
            <option value="under_review">Under Review</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="hired">Hired / Onboarded</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13 }}
          >
            <option value="all">All Subsidiaries</option>
            {entities.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div style={{ color: '#94a3b8', fontSize: 13 }}>
          Showing <b>{filtered.length}</b> candidates
        </div>
      </div>

      {/* Table of Candidates */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: 12 }}>
              <th style={{ padding: '12px 16px' }}>CANDIDATE & REF</th>
              <th style={{ padding: '12px 16px' }}>TERRITORY</th>
              <th style={{ padding: '12px 16px' }}>ONLINE TEST SCORE</th>
              <th style={{ padding: '12px 16px' }}>STATUS</th>
              <th style={{ padding: '12px 16px' }}>APPLIED DATE</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map(app => {
                const entityName = entities.find(e => e.id === app.entity_id)?.name || 'General Network';
                const hasScore = app.test_completed_at && app.test_score !== null;
                const score = app.test_score || 0;

                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{app.full_name}</div>
                      <div style={{ color: '#D4AF37', fontSize: 11, fontFamily: 'monospace' }}>{app.app_code}</div>
                      <div style={{ color: '#94a3b8', fontSize: 11 }}>{app.phone} • {app.email}</div>
                    </td>

                    <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                      {entityName}
                      {app.residence && <div style={{ fontSize: 11, color: '#64748b' }}>{app.residence}</div>}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {hasScore ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: score >= 70 ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: score >= 70 ? '#4ade80' : '#facc15', padding: '4px 10px', borderRadius: 999, fontWeight: 700, fontSize: 12 }}>
                          <span>{score >= 70 ? '★' : '•'}</span> {score}% ({score >= 70 ? 'Passed' : 'Average'})
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: 12 }}>Pending Test</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: app.status === 'hired' ? 'rgba(34,197,94,0.15)' : app.status === 'rejected' ? 'rgba(248,113,113,0.15)' : 'rgba(56,189,248,0.15)',
                        color: app.status === 'hired' ? '#4ade80' : app.status === 'rejected' ? '#f87171' : '#38bdf8',
                      }}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          onClick={() => handleOpenReview(app)}
                          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Review File ➔
                        </button>

                        {app.agent_id && (
                          <Link
                            href={`/contract/${app.agent_id}`}
                            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                          >
                            Contract
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  No applications found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review Drawer / Modal */}
      {selectedApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100
        }}>
          <div style={{
            width: '100%',
            maxWidth: 680,
            background: '#0f172a',
            height: '100%',
            overflowY: 'auto',
            padding: 32,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.06em' }}>
                  CANDIDATE DOSSIER • {selectedApp.app_code}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                  {selectedApp.full_name}
                </h2>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  {selectedApp.email} • {selectedApp.phone}
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', width: 32, height: 32, borderRadius: 16, cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* Notification messages */}
            {actionMsg && (
              <div style={{ background: '#064e3b', border: '1px solid #34d399', color: '#a7f3d0', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                ✓ {actionMsg}
              </div>
            )}
            {actionErr && (
              <div style={{ background: '#451a1a', border: '1px solid #f87171', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                ⚠ {actionErr}
              </div>
            )}

            {/* Candidate Identity & Location */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, fontSize: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div><span style={{ color: '#94a3b8' }}>National ID / Passport:</span> <b style={{ color: '#fff' }}>{selectedApp.id_number || 'N/A'}</b></div>
                <div><span style={{ color: '#94a3b8' }}>Residence / County:</span> <b style={{ color: '#fff' }}>{selectedApp.residence || 'N/A'}</b></div>
                <div><span style={{ color: '#94a3b8' }}>Position:</span> <b style={{ color: '#fff' }}>{selectedApp.position}</b></div>
                <div><span style={{ color: '#94a3b8' }}>Current Status:</span> <b style={{ color: '#38bdf8', textTransform: 'capitalize' }}>{selectedApp.status.replace('_', ' ')}</b></div>
              </div>
            </div>

            {/* Online Evaluation Test Results */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#D4AF37', margin: 0 }}>
                  ONLINE INTERVIEW EVALUATION ASSESSMENT
                </h3>
                {selectedApp.test_completed_at ? (
                  <span style={{ background: (selectedApp.test_score || 0) >= 70 ? '#15803d' : '#854d0e', color: '#fff', padding: '4px 10px', borderRadius: 6, fontWeight: 800, fontSize: 13 }}>
                    Score: {selectedApp.test_score}%
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Test Pending</span>
                )}
              </div>

              {selectedApp.test_answers?.writtenPitches && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
                      Candidate&apos;s 60-Second Sales Pitch:
                    </div>
                    <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, fontStyle: 'italic' }}>
                      &ldquo;{selectedApp.test_answers.writtenPitches.intro || 'None provided'}&rdquo;
                    </div>
                  </div>

                  <div style={{ background: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
                      Territory Network & Access Plan:
                    </div>
                    <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, fontStyle: 'italic' }}>
                      &ldquo;{selectedApp.test_answers.writtenPitches.network || 'None provided'}&rdquo;
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Candidate Text CV */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                Curriculum Vitae & Experience
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
                <div>
                  <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Professional Bio:</div>
                  <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', background: '#0f172a', padding: 12, borderRadius: 8, border: '1px solid #334155' }}>
                    {selectedApp.bio || 'None provided'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Sales & Work Experience:</div>
                  <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', background: '#0f172a', padding: 12, borderRadius: 8, border: '1px solid #334155' }}>
                    {selectedApp.experience || 'None provided'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Education & Qualifications:</div>
                  <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', background: '#0f172a', padding: 12, borderRadius: 8, border: '1px solid #334155' }}>
                    {selectedApp.education || 'None provided'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Professional Referees:</div>
                  <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', background: '#0f172a', padding: 12, borderRadius: 8, border: '1px solid #334155' }}>
                    {selectedApp.referees || 'None provided'}
                  </div>
                </div>
              </div>
            </div>

            {/* Director Telephone / Oral Notes */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                Director Oral Interview / Verification Notes
              </h3>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log notes from your phone interview, referee background check, or in-person discussion..."
                style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, marginBottom: 10 }}
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {savingNotes ? 'Saving Notes...' : 'Save Interview Notes'}
              </button>
            </div>

            {/* Status Switcher */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleStatusChange('under_review')}
                style={{ background: '#1e293b', border: '1px solid #facc15', color: '#facc15', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Mark Under Review
              </button>
              <button
                onClick={() => handleStatusChange('interview_scheduled')}
                style={{ background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Schedule Oral Interview
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                style={{ background: '#1e293b', border: '1px solid #f87171', color: '#f87171', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Reject Application
              </button>
            </div>

            {/* Onboard to Agent & Generate Contract */}
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 }}>
                BOARD APPROVAL & CONTRACT GENERATION
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
                Approve & Onboard as Sales Agent
              </h3>

              {selectedApp.agent_id ? (
                <div>
                  <div style={{ color: '#4ade80', fontSize: 13, marginBottom: 12 }}>
                    ✓ Candidate is onboarded as an authorized sales agent.
                  </div>
                  <Link
                    href={`/contract/${selectedApp.agent_id}`}
                    style={{ display: 'inline-block', background: '#22c55e', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                  >
                    View & Counter-Sign Agency Contract ➔
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                        Assigned Subsidiary *
                      </label>
                      <select
                        value={onboardEntity}
                        onChange={(e) => setOnboardEntity(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff', fontSize: 13 }}
                      >
                        {entities.map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                        Commission Rate (%) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleOnboardAgent}
                    disabled={onboarding}
                    style={{
                      background: '#22c55e',
                      color: '#fff',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: onboarding ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {onboarding ? 'Creating Agent & Contract...' : '✓ Approve Candidate & Generate Agency Contract'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
