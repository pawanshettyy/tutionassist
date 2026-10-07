/** Normalises an Indian mobile number to E.164 digits without "+" (e.g. 919876543210). */
export function normalizePhone(phone: string, defaultCountryCode = "91"): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `${defaultCountryCode}${digits.slice(1)}`;
  return digits;
}

/** WhatsApp click-to-chat link with a prefilled message (teacher taps Send). */
export function buildWaLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

/** Replaces {variables} in a template. Unknown variables are left untouched. */
export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export const DEFAULT_FEE_REMINDER_TEMPLATE =
  "Hello {parent}, this is a reminder from {class_name}. The fee of Rs {amount} for {student} " +
  "(period {period}) is due on {due_date}. You can pay via UPI to {upi_id}. Thank you!";
