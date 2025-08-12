// This file was not provided in the prompt, assuming it exists and is correct.
// Example placeholder content:
import { isValid, parseISO, isBefore, isAfter, isEqual } from "date-fns"

/**
 * Checks if a given date string or Date object is valid.
 * @param dateInput The date string or Date object to validate.
 * @returns True if the date is valid, false otherwise.
 */
export function isValidDate(dateInput: string | Date | null | undefined): boolean {
  if (dateInput === null || dateInput === undefined) {
    return false
  }
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput
  return isValid(date)
}

/**
 * Checks if a date is in the past.
 * @param dateInput The date to check.
 * @returns True if the date is in the past, false otherwise.
 */
export function isPastDate(dateInput: string | Date): boolean {
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput
  return isValid(date) && isBefore(date, new Date())
}

/**
 * Checks if a date is in the future.
 * @param dateInput The date to check.
 * @returns True if the date is in the future, false otherwise.
 */
export function isFutureDate(dateInput: string | Date): boolean {
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput
  return isValid(date) && isAfter(date, new Date())
}

/**
 * Checks if a date falls within a specified range (inclusive).
 * @param dateInput The date to check.
 * @param startDate The start date of the range.
 * @param endDate The end date of the range.
 * @returns True if the date is within the range, false otherwise.
 */
export function isDateInRange(dateInput: string | Date, startDate: string | Date, endDate: string | Date): boolean {
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate

  if (!isValid(date) || !isValid(start) || !isValid(end)) {
    return false
  }

  return (isAfter(date, start) || isEqual(date, start)) && (isBefore(date, end) || isEqual(date, end))
}

/**
 * Checks if a time string is in a valid format (e.g., "HH:mm" or "HH:mm:ss").
 * This is a basic check and might need more robust regex for strict validation.
 * @param timeString The time string to validate.
 * @returns True if the time string matches a basic time format, false otherwise.
 */
export function isValidTimeString(timeString: string): boolean {
  const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9](?::[0-5][0-9])?$/
  return timeRegex.test(timeString)
}
