/** Decorative placeholder rendered behind the paywall. Contains no real report data. */
export default function LockedPreview() {
  const bar = (w: string) => <div className="h-3 rounded bg-muted/20" style={{ width: w }} />;
  return (
    <div aria-hidden className="pointer-events-none select-none space-y-6 blur-[6px]">
      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="mb-4 h-4 w-48 rounded bg-muted/30" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex justify-between border-b border-line/60 py-3">
            {bar("30%")}
            {bar("14%")}
            {bar("14%")}
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex h-56 items-end gap-3 rounded-xl border border-line bg-panel p-5">
          {[40, 55, 48, 70, 62, 80, 66, 90, 74, 95].map((h, i) => (
            <div key={i} className={`flex-1 rounded-t ${i % 2 ? "bg-[#d95926]/60" : "bg-[#3987e5]/60"}`} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="space-y-3 rounded-xl border border-line bg-panel p-5">
          {["90%", "75%", "82%", "60%", "70%", "85%"].map((w, i) => (
            <div key={i}>{bar(w)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
