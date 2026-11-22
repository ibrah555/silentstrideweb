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
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 16, padding: '48px 32px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          background: isPassing ? '#E4F2EA' : '#F3EBDC',
          color: isPassing ? '#1E7F4F' : '#7A6234',
          fontSize: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          {isPassing ? '★' : '✓'}
        </div>

        <div style={{ fontSize: 13, color: '#AE8E4D', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>
          {result.justSubmitted ? 'ASSESSMENT COMPLETED & RECORDED' : 'OFFICIAL ASSESSMENT RECORD'}
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#082138', marginBottom: 16 }}>
          Evaluation Score: <span style={{ color: isPassing ? '#1E7F4F' : '#AE8E4D' }}>{result.scorePct}%</span>
        </h2>

        <p style={{ color: '#6B7684', fontSize: 15, maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.6 }}>
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

        <div style={{ background: '#F7F6F2', border: '1px solid #E4E1D8', borderRadius: 12, padding: 20, maxWidth: 440, margin: '0 auto 32px', textAlign: 'left', fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#6B7684' }}>Applicant Name:</span>
            <span style={{ color: '#082138', fontWeight: 600 }}>{application.full_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#6B7684' }}>Application Ref:</span>
            <span style={{ color: '#AE8E4D', fontWeight: 700 }}>{application.app_code}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7684' }}>Current Status:</span>
            <span style={{ color: '#082138', fontWeight: 600, textTransform: 'capitalize' }}>
              {application.status === 'applied' ? 'Assessed / Under Review' : application.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link
            href="/careers/status"
            style={{ background: '#082138', color: '#FFFFFF', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            Track Application Status ➔
          </Link>
          <Link
            href="/careers"
            style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', color: '#1A2430', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
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
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B3372F', padding: '14px 18px', borderRadius: 8, fontSize: 14 }}>
          ⚠ {error}
        </div>
      )}

      {/* Header Info */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#AE8E4D', fontWeight: 700, letterSpacing: '0.04em' }}>CANDIDATE EVALUATION INTERVIEW</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#082138' }}>{application.full_name}</div>
          </div>
          <div style={{ fontSize: 13, color: '#6B7684' }}>
            Ref Code: <b style={{ color: '#082138' }}>{application.app_code}</b>
          </div>
        </div>
      </div>

      {/* Part 1: Multiple Choice Questions */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#082138', margin: '0 0 4px' }}>
            Part 1: Sales Aptitude & Commercial Ethics
          </h3>
          <p style={{ color: '#6B7684', fontSize: 13, margin: 0 }}>
            Choose the most effective and ethical answer for each field situation below.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ASSESSMENT_QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              style={{
                background: '#FFFFFF',
                border: answers[q.id] ? '1px solid #AE8E4D' : '1px solid #E4E1D8',
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ background: '#082138', color: '#FFFFFF', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                  Question {idx + 1}
                </span>
                <span style={{ color: '#6B7684', fontSize: 12 }}>• {q.category}</span>
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, color: '#082138', marginBottom: 16, lineHeight: 1.5 }}>
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
                        background: isSelected ? '#F3EBDC' : '#FFFFFF',
                        border: isSelected ? '1px solid #AE8E4D' : '1px solid #E4E1D8',
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
                        style={{ marginTop: 3, accentColor: '#082138' }}
                      />
                      <span style={{ fontSize: 14, color: isSelected ? '#082138' : '#1A2430', lineHeight: 1.4, fontWeight: isSelected ? 500 : 400 }}>
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
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#082138', margin: '0 0 4px' }}>
            Part 2: Written Field Pitch & Territory Assessment
          </h3>
          <p style={{ color: '#6B7684', fontSize: 13, margin: 0 }}>
            These responses will be reviewed directly by the Silent Strides Board of Directors during final hiring selection.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {WRITTEN_PITCH_QUESTIONS.map(p => (
            <div key={p.id} style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#082138', marginBottom: 6 }}>
                {p.label}
              </label>
              <div style={{ fontSize: 13, color: '#6B7684', marginBottom: 12, lineHeight: 1.5 }}>
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
                  background: '#FFFFFF',
                  border: '1px solid #E4E1D8',
                  borderRadius: 8,
                  color: '#1A2430',
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
          background: submitting ? '#6B7684' : '#082138',
          color: '#FFFFFF',
          padding: '16px 32px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
          border: 'none',
          cursor: submitting ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(8,33,56,0.15)',
        }}
      >
        {submitting ? 'Evaluating & Submitting Answers...' : 'Submit Evaluation Assessment to Board ➔'}
      </button>
    </form>
  );
}
