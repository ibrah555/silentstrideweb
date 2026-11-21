'use client';

import { useState, useRef, useEffect } from 'react';

export default function SignaturePad({ agentId, agentName, isDirector = false }) {
  const [mode, setMode] = useState('draw'); // 'draw' or 'type'
  const [typedName, setTypedName] = useState(agentName || '');
  const [idNumber, setIdNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Setup canvas resolution and styling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, [mode]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateTypedSignatureImage = (text) => {
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'italic 34px "Georgia", "Times New Roman", cursive';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text || 'Signed', canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!agreed) {
      setError('You must check the agreement box before submitting your signature.');
      return;
    }

    if (!isDirector && !idNumber.trim()) {
      setError('Please enter your National ID or Passport Number.');
      return;
    }

    let signatureImage = '';
    if (mode === 'draw') {
      if (!hasDrawn) {
        setError('Please draw your signature in the box provided, or switch to Type mode.');
        return;
      }
      signatureImage = canvasRef.current.toDataURL('image/png');
    } else {
      if (!typedName.trim()) {
        setError('Please type your legal full name.');
        return;
      }
      signatureImage = generateTypedSignatureImage(typedName);
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/agents/contract/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          signatureData: signatureImage,
          signedName: typedName.trim(),
          idNumber: idNumber.trim(),
          isDirectorCounterSign: isDirector,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit signature.');
      }

      // Reload page to display executed contract
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #E2E8F0',
      borderRadius: 12,
      padding: '24px',
      marginTop: '24px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0F172A' }}>
        {isDirector ? 'Counter-Sign on Behalf of Silent Strides Network Ltd' : 'Electronic Signature Execution'}
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
        {isDirector
          ? 'Sign as Director to officially authorize and counter-execute this commercial agreement.'
          : 'By signing below, you electronically execute this Sales Agency Agreement and agree to all terms and conditions.'}
      </p>

      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13
        }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isDirector ? '1fr' : '1.2fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              {isDirector ? 'Director Full Legal Name' : 'Agent Full Legal Name'}
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              required
              placeholder="e.g. John Doe"
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {!isDirector && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                National ID / Passport Number
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
                placeholder="e.g. 12345678"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}
        </div>

        {/* Mode Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Signature Pad</span>
            <div style={{ display: 'inline-flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setMode('draw')}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: mode === 'draw' ? '#0F172A' : '#E2E8F0',
                  background: mode === 'draw' ? '#0F172A' : '#F8FAFC',
                  color: mode === 'draw' ? '#fff' : '#64748B',
                  cursor: 'pointer'
                }}
              >
                ✏ Draw
              </button>
              <button
                type="button"
                onClick={() => setMode('type')}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: mode === 'type' ? '#0F172A' : '#E2E8F0',
                  background: mode === 'type' ? '#0F172A' : '#F8FAFC',
                  color: mode === 'type' ? '#fff' : '#64748B',
                  cursor: 'pointer'
                }}
              >
                ⌨ Type
              </button>
            </div>
          </div>

          {mode === 'draw' ? (
            <div style={{ position: 'relative' }}>
              <canvas
                ref={canvasRef}
                width={500}
                height={130}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{
                  width: '100%',
                  height: 130,
                  border: '2px dashed #94A3B8',
                  borderRadius: 8,
                  background: '#F8FAFC',
                  cursor: 'crosshair',
                  touchAction: 'none'
                }}
              />
              <button
                type="button"
                onClick={clearCanvas}
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid #CBD5E1',
                  background: '#fff',
                  color: '#64748B',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          ) : (
            <div style={{
              height: 130,
              border: '2px dashed #94A3B8',
              borderRadius: 8,
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 20px',
              boxSizing: 'border-box'
            }}>
              <span style={{
                fontFamily: 'Georgia, "Times New Roman", cursive',
                fontStyle: 'italic',
                fontSize: 32,
                color: '#0F172A'
              }}>
                {typedName || 'Your Signature'}
              </span>
            </div>
          )}
        </div>

        {/* Checkbox */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: '4px 0' }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.4 }}>
            I hereby confirm that I have read, understood, and willingly accept all terms and conditions of this Sales Agency Agreement, including the specified commission rates, duties, confidentiality, and dispute resolutions under the laws of Kenya.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: isSubmitting ? '#94A3B8' : '#0F172A',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 4
          }}
        >
          {isSubmitting ? 'Submitting Signature...' : '✍ Confirm & Execute Agreement'}
        </button>
      </form>
    </div>
  );
}
