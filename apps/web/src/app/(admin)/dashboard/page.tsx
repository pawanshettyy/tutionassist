const kpis = [
  { label: "Students", value: "—" },
  { label: "Active batches", value: "—" },
  { label: "Collected this month", value: "₹—" },
  { label: "Pending fees", value: "₹—" },
];

export default function AdminDashboard() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">{k.label}</p>
            <p className="mt-1 text-2xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">TODO FR-RPT-01: wire these cards to the API.</p>
    </main>
  );
}
