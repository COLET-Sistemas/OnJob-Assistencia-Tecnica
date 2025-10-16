const DATE_SPLITTER = /[T\s]/;

export function parseNotificationDate(dateString: string): Date {
  if (!dateString) {
    return new Date(NaN);
  }

  if (dateString.includes("/")) {
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);

    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
      return new Date(NaN);
    }

    if (timePart) {
      const [hours, minutes] = timePart.split(":").map(Number);

      return new Date(
        year,
        month - 1,
        day,
        Number.isNaN(hours) ? 0 : hours,
        Number.isNaN(minutes) ? 0 : minutes
      );
    }

    return new Date(year, month - 1, day);
  }

  // Split on common separators to support inputs with milliseconds or timezone offsets
  const [datePart] = dateString.split(DATE_SPLITTER);
  if (!datePart) {
    return new Date(NaN);
  }

  return new Date(dateString);
}

export function getNotificationTimestamp(dateString?: string): number | null {
  if (!dateString) {
    return null;
  }

  const parsed = parseNotificationDate(dateString);
  const timestamp = parsed.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

