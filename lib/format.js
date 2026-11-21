// Currency and number formatting for Silent Strides Network (KSh / Kenyan Shilling)

export const fmt = (n) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtK = (n) => {
  const num = Number(n || 0);
  if (Math.abs(num) >= 1e6) {
    return 'KSh ' + (num / 1e6).toFixed(2) + 'M';
  }
  if (Math.abs(num) >= 1e3) {
    return 'KSh ' + (num / 1e3).toFixed(1) + 'K';
  }
  return fmt(num);
};
