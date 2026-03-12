export const getLogicalDayRange = (date: Date = new Date()) => {
  const d = new Date(date);
  const hours = d.getHours();
  
  // If it's before 4 AM, the "logical day" started yesterday at 4 AM
  const start = new Date(d);
  if (hours < 4) {
    start.setDate(start.getDate() - 1);
  }
  start.setHours(4, 0, 0, 0);
  
  // The logical day ends at 3:59:59 AM the next day
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);
  
  return { start, end };
};
