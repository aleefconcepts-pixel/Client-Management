/**
 * Security utilities for Client Management System
 * Includes input sanitization, XSS defense, and CSV injection protection.
 */

/**
 * Escapes characters for CSV export to prevent Formula Injection / CSV Injection.
 * In spreadsheets, cells starting with '=', '+', '-', '@', '\t', '\r' can execute formulas or commands.
 * Prefixing them with a single quote or space neutralizes execution.
 */
export function sanitizeCSVCell(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  let stringValue = String(value).trim();

  // Check for dangerous formula starters
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  // Escape double quotes by doubling them per RFC 4180
  const escapedQuotes = stringValue.replace(/"/g, '""');
  return `"${escapedQuotes}"`;
}

/**
 * Sanitizes plain text input by trimming and stripping dangerous HTML/script tags.
 */
export function sanitizeTextInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Strip angle brackets to prevent raw HTML/script injection
    .substring(0, 500); // Enforce reasonable upper bound
}

/**
 * Validates a color hex string (#RRGGBB or #RGB)
 */
export function isValidHexColor(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}
