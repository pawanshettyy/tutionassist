"use client";

import type { AttendanceStatus } from "@tutionassist/shared";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  name: string;
}

/** Everyone defaults to present; teacher only toggles absentees. */
export function AttendanceGrid({
  students,
  onSave,
}: {
  students: Row[];
  onSave: (records: { studentId: string; status: AttendanceStatus }[]) => void;
}) {
  const [status, setStatus] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(students.map((s) => [s.id, "present" as AttendanceStatus])),
  );
  const toggle = (id: string) =>
    setStatus((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));

  return (
    <div>
      <ul className="divide-y rounded-lg border bg-white">
        {students.map((s) => (
          <li key={s.id} className="flex items-center justify-between p-3">
            <span>{s.name}</span>
            <button
              onClick={() => toggle(s.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                status[s.id] === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
              )}
            >
              {status[s.id]}
            </button>
          </li>
        ))}
      </ul>
      <button
        className="mt-4 w-full rounded-lg bg-brand py-3 font-medium text-white"
        onClick={() => onSave(students.map((s) => ({ studentId: s.id, status: status[s.id]! })))}
      >
        Save attendance
      </button>
    </div>
  );
}
