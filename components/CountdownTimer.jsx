'use client';

import { useState, useEffect } from 'react';

export default function CountdownTimer({ closesAt, opensAt, status = 'open', compact = false }) {
  const [timeLeft, setTimeLeft] = useState({
    totalMs: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    isUpcoming: false,
  });

  useEffect(() => {
    function compute() {
      const now = new Date().getTime();
      const openTime = opensAt ? new Date(opensAt).getTime() : now;
      const closeTime = closesAt ? new Date(closesAt).getTime() : 0;

      if (status === 'closed') {
        setTimeLeft({ totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isUpcoming: false });
        return;
      }

      if (now < openTime) {
        setTimeLeft({ totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, isUpcoming: true });
        return;
      }

      if (!closeTime || now >= closeTime) {
        setTimeLeft({ totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isUpcoming: false });
        return;
      }

      const diff = closeTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        totalMs: diff,
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        isUpcoming: false,
      });
    }

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [closesAt, opensAt, status]);

  if (status === 'closed' || timeLeft.isExpired) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#FEE2E2',
        color: '#991B1B',
        border: '1px solid #FECACA',
        borderRadius: 6,
        padding: compact ? '2px 8px' : '4px 10px',
        fontSize: compact ? 11 : 12,
        fontWeight: 700
      }}>
        <span>●</span> Applications Closed
      </span>
    );
  }

  if (timeLeft.isUpcoming) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #FDE68A',
        borderRadius: 6,
        padding: compact ? '2px 8px' : '4px 10px',
        fontSize: compact ? 11 : 12,
        fontWeight: 700
      }}>
        <span>⏳</span> Opening Soon
      </span>
    );
  }

  const isUrgent = timeLeft.totalMs < 1000 * 60 * 60 * 24; // Less than 24 hours

  if (compact) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: isUrgent ? '#FEE2E2' : '#F3EBDC',
        color: isUrgent ? '#991B1B' : '#7A6234',
        border: `1px solid ${isUrgent ? '#FECACA' : '#E4E1D8'}`,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums'
      }}>
        <span>⏳</span> {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    );
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: isUrgent ? '#FEF2F2' : '#F7F6F2',
      border: `1px solid ${isUrgent ? '#FECACA' : '#E4E1D8'}`,
      borderRadius: 8,
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: isUrgent ? '#B3372F' : '#1A2430',
      fontVariantNumeric: 'tabular-nums'
    }}>
      <span style={{ color: isUrgent ? '#DC2626' : '#AE8E4D', fontWeight: 800 }}>⏳</span>
      <span>
        Closes in: <b>{timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</b>
      </span>
    </div>
  );
}
