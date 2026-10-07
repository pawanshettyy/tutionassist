"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UpiQr } from "@/features/fees/components/UpiQr";
import { api } from "@/lib/api-client";

interface FeeRow {
  id: string;
  studentName: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: string;
}

export default function TeacherFeesPage() {
  const [rows, setRows] = useState<FeeRow[]>([]);
  const [qr, setQr] = useState<string | null>(null);

  async function load() {
    const res = await api.fees.list({ status: "overdue" });
    setRows(res.items as FeeRow[]);
  }

  async function remind(id: string) {
    const { waLink, upiUri } = await api.fees.reminder(id);
    setQr(upiUri); // show the QR so the teacher can share it alongside the WhatsApp message
    window.open(waLink, "_blank");
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pending fees</h1>
        <Button onClick={load}>Refresh</Button>
      </div>
      <ul className="divide-y rounded-lg border bg-white">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{r.studentName}</p>
              <p className="text-xs text-slate-500">
                ₹{r.amountDue - r.amountPaid} due {r.dueDate} · {r.status}
              </p>
            </div>
            <Button onClick={() => remind(r.id)}>Remind on WhatsApp</Button>
          </li>
        ))}
        {rows.length === 0 && <li className="p-4 text-sm text-slate-500">Nothing pending. Tap Refresh.</li>}
      </ul>
      {qr && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-slate-600">UPI QR for this fee (screenshot and share):</p>
          <UpiQr upiUri={qr} />
        </div>
      )}
    </main>
  );
}
