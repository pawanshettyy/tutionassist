const VPA_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

export interface UpiLinkInput {
  payeeVpa: string;
  payeeName: string;
  amount: number; // rupees
  note?: string;
}

export function isValidVpa(vpa: string): boolean {
  return VPA_REGEX.test(vpa);
}

/**
 * Builds a standard UPI deep link. Render it as a QR code or share it.
 * Plain UPI links give NO payment callback: confirmation is manual (or via Razorpay later).
 */
export function buildUpiUri({ payeeVpa, payeeName, amount, note }: UpiLinkInput): string {
  if (!isValidVpa(payeeVpa)) throw new Error(`Invalid UPI VPA: ${payeeVpa}`);
  if (!(amount > 0)) throw new Error("Amount must be greater than zero");
  const params = [
    `pa=${encodeURIComponent(payeeVpa)}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `am=${amount.toFixed(2)}`,
    "cu=INR",
  ];
  if (note) params.push(`tn=${encodeURIComponent(note)}`);
  return `upi://pay?${params.join("&")}`;
}
