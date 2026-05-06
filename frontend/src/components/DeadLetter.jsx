function DeadLetter({ failedEvents }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-300">Dead Letter Queue</h2>
      <div className="h-44 space-y-2 overflow-y-auto">
        {failedEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No failed events.</p>
        ) : (
          failedEvents.map((event, index) => (
            <div key={`${event.createdAt || "dlq"}-${index}`} className="rounded-md border border-red-800 bg-red-950/40 p-3">
              <p className="text-xs font-medium text-red-200">{event.type || "UNKNOWN"}</p>
              <pre className="mt-1 overflow-x-auto text-xs text-red-100">{JSON.stringify(event.payload ?? event, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default DeadLetter;
