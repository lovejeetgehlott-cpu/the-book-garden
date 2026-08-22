/**
 * Date helpers. All "days left" logic compares calendar days, ignoring the
 * time-of-day component, so a due date of "today 09:00" still counts as
 * 0 days left at 5 pm.
 */

// Start of today (local server time)
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns { start, end } Date range covering the single calendar day that is
 * `days` days after today. Used to query students whose dueDate falls
 * exactly on that day.
 */
const dayRange = (days) => {
  const start = startOfToday();
  start.setDate(start.getDate() + days);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

module.exports = { startOfToday, dayRange };
