import dayjs from "dayjs";
import "dayjs/locale/id";
import "dayjs/locale/en";

/**
 * Get month name using Day.js
 * @param period - Month number from 1 to 12
 * @param locale - Locale for month name ('id' for Indonesian, 'en' for English)
 * @param format - Format string ('MMMM' for full name, 'MMM' for abbreviated)
 * @returns Month name in specified locale or "-" for invalid period
 */
export const getMonth = (
  period: number | null | undefined,
  locale: "id" | "en" = "en",
  format: "MMMM" | "MMM" = "MMMM"
): string => {
  if (!period || period < 1 || period > 12) {
    return "-";
  }

  dayjs.locale(locale);

  const monthName = dayjs()
    .month(period - 1)
    .format(format);

  return monthName;
};
