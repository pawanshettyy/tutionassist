const cards = [
  { title: "Attendance", value: "—%" },
  { title: "Fees due", value: "₹—" },
  { title: "Homework pending", value: "—" },
  { title: "Latest marks", value: "—" },
];

export default function ParentHome() {
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-semibold">My children</h1>
      {/* TODO FR-PAR-02: child switcher */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{c.title}</p>
            <p className="mt-1 text-xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
