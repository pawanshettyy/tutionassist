"use client";

import { QRCodeSVG } from "qrcode.react";

/** Renders the UPI deep link as a scannable QR. Screenshot/share it with the parent. */
export function UpiQr({ upiUri, size = 160 }: { upiUri: string; size?: number }) {
  return (
    <div className="inline-block rounded-lg border bg-white p-3">
      <QRCodeSVG value={upiUri} size={size} />
    </div>
  );
}
