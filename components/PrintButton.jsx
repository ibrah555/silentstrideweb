'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 18px',
        borderRadius: 8,
        border: '1px solid #0F172A',
        background: '#0F172A',
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      🖨️ Print / Download PDF
    </button>
  );
}
