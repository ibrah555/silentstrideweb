'use client';

export default function DeleteButton({ confirmText = 'Are you sure you want to delete this record?' }) {
  return (
    <button
      type="submit"
      className="btn"
      style={{ padding: '3px 8px', fontSize: 11, background: '#FEE2E2', color: 'var(--danger)' }}
      onClick={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}
