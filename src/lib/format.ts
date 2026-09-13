const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatEventDate(isoDate: string) {
  return dateFormatter.format(new Date(isoDate));
}

export function formatEventTime(isoDate: string) {
  return timeFormatter.format(new Date(isoDate));
}

export function formatDateRange(start: string, end?: string) {
  const startDate = formatEventDate(start);
  if (!end) return `${startDate}, ${formatEventTime(start)}`;
  const endDate = formatEventDate(end);
  if (startDate === endDate) {
    return `${startDate}, ${formatEventTime(start)} to ${formatEventTime(end)}`;
  }
  return `${startDate} to ${endDate}`;
}
