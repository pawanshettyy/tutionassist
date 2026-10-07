"use client";

import { AttendanceGrid } from "@/features/attendance/components/AttendanceGrid";

// TODO FR-ATT-01: load students for params.batchId via api.students and save via api.attendance.mark
const demoStudents = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Aarav Sharma" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Diya Patil" },
];

export default function AttendancePage() {
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-3 text-xl font-semibold">Mark attendance</h1>
      <AttendanceGrid students={demoStudents} onSave={(records) => console.log(records)} />
    </main>
  );
}
