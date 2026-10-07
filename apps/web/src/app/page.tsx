import Link from "next/link";

const links = [
  { href: "/login", label: "Login" },
  { href: "/dashboard", label: "Admin dashboard" },
  { href: "/fees", label: "Teacher: pending fees" },
  { href: "/home", label: "Parent home" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold text-brand">TutionAssist</h1>
      <p className="mt-1 text-slate-600">Starter screens. Replace with real pages as you build.</p>
      <ul className="mt-6 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link className="text-brand underline" href={l.href}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
