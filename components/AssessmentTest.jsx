'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ASSESSMENT_QUESTIONS, WRITTEN_PITCH_QUESTIONS } from '@/lib/recruitmentAssessment';

export default function AssessmentTest({ application }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(
    application?.test_completed_at
      ? {
          scorePct: application.test_score,
          alreadyCompleted: true,
        }
      : null
  );

  const handleOptionChange = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleTextChange = (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Verify all multiple choice questions are answered
    for (const q of ASSESSMENT_QUESTIONS) {
      if (!answers[q.id]) {
        setError(`Please answer question: "${q.question}"`);
        return;
      }
    }

    // Verify written pitches
    for (const p of WRITTEN_PITCH_QUESTIONS) {
      if (!answers[p.id] || answers[p.id].trim().length < 15) {
        setError(`Please provide a more detailed answer for: "${p.label}"`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/careers/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          answers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit assessment');
      }

      setResult({
        scorePct: data.scorePct,
        correctCount: data.correctCount,
        totalScoreable: data.totalScoreable,
        justSubmitted: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Completed State View
  if (result) {
    const isPassing = (result.scorePct || 0) >= 70;

    return (
      <div style={{ background: '#1e293b', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          background: isPassing ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
          color: isPassing ? '#4ade80' : '#facc15',
          fontSize: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          {isPassing ? '★' : '✓'}
        </div>

        <div style={{ fontSize: 13, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>
          {result.justSubmitted ? 'ASSESSMENT COMPLETED & RECORDED' : 'OFFICIAL ASSESSMENT RECORD'}
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Evaluation Score: <span style={{ color: isPassing ? '#4ade80' : '#D4AF37' }}>{result.scorePct}%</span>
        </h2>

        <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.6 }}>
          {isPassing ? (
            <>
              Excellent performance! You scored high on sales strategy, ethics, and territory management. Your file and written pitch are now pending review with the <b>Silent Strides Board of Directors</b>.
            </>
          ) : (
            <>
              Your test has been recorded and submitted along with your application profile for comprehensive evaluation by the directors.
            </>
          )}
        </p>

        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20, maxWidth: 440, margin: '0 auto 32px', textAlign: 'left', fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#94a3b8' }}>Applicant Name:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{application.full_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#94a3b8' }}>Application Ref:</span>
            <span style={{ color: '#D4AF37', fontWeight: 700 }}>{application.app_code}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Current Status:</span>
            <span style={{ color: '#38bdf8', fontWeight: 600, textTransform: 'capitalize' }}>
              {application.status === 'applied' ? 'Assessed / Under Review' : application.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link
            href="/careers/status"
            style={{ background: '#D4AF37', color: '#0f172a', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            Track Application Status ➔
          </Link>
          <Link
            href="/careers"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
          >
            Back to Careers Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {error && (
        <div style={{ background: '#451a1a', border: '1px solid #f87171', color: '#fca5a5', padding: '14px 18px', borderRadius: 8, fontSize: 14 }}>
          ⚠ {error}
        </div>
      )}

      {/* Header Info */}
      <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 700 }}>CANDIDATE EVALUATION INTERVIEW</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{application.full_name}</div>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Ref Code: <b style={{ color: '#D4AF37' }}>{application.app_code}</b>
          </div>
        </div>
      </div>

      {/* Part 1: Multiple Choice Questions */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
            Part 1: Sales Aptitude & Commercial Ethics
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
            Choose the most effective and ethical answer for each field situation below.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ASSESSMENT_QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              style={{
                background: '#1e293b',
                border: answers[q.id] ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ background: '#0f172a', color: '#D4AF37', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                  Question {idx + 1}
                </span>
                <span style={{ color: '#64748b', fontSize: 12 }}>• {q.category}</span>
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 16, lineHeight: 1.5 }}>
                {q.question}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map(opt => {
                  const isSelected = answers[q.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      onClick={() => handleOptionChange(q.id, opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 8,
                        background: isSelected ? 'rgba(212,175,55,0.15)' : '#0f172a',
                        border: isSelected ? '1px solid #D4AF37' : '1px solid #334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ marginTop: 3, accentColor: '#D4AF37' }}
                      />
                      <span style={{ fontSize: 14, color: isSelected ? '#fff' : '#cbd5e1', lineHeight: 1.4 }}>
                        {opt.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 2: Written Evaluative Pitches */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
            Part 2: Written Field Pitch & Territory Assessment
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
            These responses will be reviewed directly by the Silent Strides Board of Directors during final hiring selection.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {WRITTEN_PITCH_QUESTIONS.map(p => (
            <div key={p.id} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                {p.label}
              </label>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, lineHeight: 1.5 }}>
                {p.prompt}
              </div>
              <textarea
                rows={4}
                required
                value={answers[p.id] || ''}
                onChange={(e) => handleTextChange(p.id, e.target.value)}
                placeholder={p.placeholder}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          background: submitting ? '#64748b' : '#D4AF37',
          color: '#0f172a',
          padding: '16px 32px',
          borderRadius: 10,
          fontWeight: 800,
          fontSize: 16,
          border: 'none',
          cursor: submitting ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
        }}
      >
        {submitting ? 'Evaluating & Submitting Answers...' : 'Submit Evaluation Assessment to Board ➔'}
      </button>
    </form>
  );
}
