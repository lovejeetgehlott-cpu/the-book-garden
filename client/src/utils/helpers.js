/**
 * Shared client-side helpers.
 */

// Format a number as Indian Rupees, e.g. "₹1,25,000"
export const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

// Format a date value as e.g. "25 Jul 2026"
export const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format a date for <input type="date"> (yyyy-mm-dd)
export const toInputDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Whole calendar days between today and dueDate (negative = overdue)
export const daysLeft = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
};

/**
 * Build a wa.me link with a URL-encoded message.
 * Strips every non-digit from the phone so "+91 98765 43210" works too.
 */
export const whatsappLink = (phone, message) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

// Per-list WhatsApp reminder templates keyed by days-left
export const reminderMessage = (days, student) => {
  const due = formatDate(student.dueDate);
  if (days === 3) {
    return `Dear ${student.name}, your membership/fee is due in 3 days (${due}). Please renew soon.`;
  }
  if (days === 2) {
    return `Dear ${student.name}, your membership/fee is due in 2 days (${due}).`;
  }
  return `Dear ${student.name}, today is the last day for your membership/fee (${due}). Please renew today.`;
};
