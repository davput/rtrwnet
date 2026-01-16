import { format as dateFnsFormat, formatDistanceToNow as dateFnsFormatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// WIB offset: UTC+7 (7 hours * 60 minutes * 60 seconds * 1000 milliseconds)
const WIB_OFFSET = 7 * 60 * 60 * 1000;

/**
 * Convert UTC date to WIB
 */
export function toWIB(date: string | Date): Date {
  if (!date) {
    return new Date();
  }
  const utcDate = typeof date === "string" ? new Date(date) : date;
  // Check if date is valid
  if (isNaN(utcDate.getTime())) {
    return new Date();
  }
  // Add 7 hours to UTC time
  return new Date(utcDate.getTime() + WIB_OFFSET);
}

/**
 * Convert UTC date to WIB and format
 */
export function formatDateWIB(date: string | Date, formatStr: string = "dd MMM yyyy, HH:mm"): string {
  const wibDate = toWIB(date);
  return dateFnsFormat(wibDate, formatStr, { locale: idLocale });
}

/**
 * Format distance to now in WIB
 */
export function formatDistanceToNowWIB(date: string | Date, options?: { addSuffix?: boolean }): string {
  const wibDate = toWIB(date);
  return dateFnsFormatDistanceToNow(wibDate, {
    ...options,
    locale: idLocale,
  });
}

/**
 * Get current date in WIB
 */
export function nowWIB(): Date {
  return toWIB(new Date());
}
