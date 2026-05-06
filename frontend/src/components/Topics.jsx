import { useDashPalette } from "../hooks/useDashPalette";

const topics = [
  "default-stream",
  "orders-stream",
  "payments-stream",
  "dead-letter-stream",
];

function Topics() {
  const p = useDashPalette();
  return (
    <section className={`rounded-xl border p-4 ${p.topicsSection}`}>
      <h2 className={`mb-3 text-sm font-semibold ${p.panelTitle}`}>Topics</h2>
      <ul className="space-y-2">
        {topics.map((topic) => (
          <li key={topic} className={`rounded-lg border px-3 py-2 text-sm transition ${p.topicsItem}`}>
            {topic}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Topics;
