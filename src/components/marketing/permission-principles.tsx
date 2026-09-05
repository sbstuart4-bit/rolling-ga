const PRINCIPLES = [
  {
    title: "Attendance does not automatically equal marketing consent.",
    body: "Verifying I was there proves the fan was in the room. It does not subscribe them to anything.",
  },
  {
    title: "Purchase does not automatically equal marketing consent.",
    body: "Buying merch is a transaction. Staying connected is a separate, explicit choice.",
  },
  {
    title: "Fans choose whether to stay connected.",
    body: "After the show, the fan can say yes — or not now. They can withdraw later.",
  },
  {
    title: "Artist relationships stay artist-scoped.",
    body: "A connection with one artist is not a connection with every artist on Rolling GA.",
  },
] as const;

export function PermissionPrinciples() {
  return (
    <ol className="grid gap-5 md:grid-cols-2">
      {PRINCIPLES.map((item, index) => (
        <li key={item.title} className="rounded-2xl border border-white/8 bg-[#161618] p-6">
          <p className="font-display text-2xl text-primary/70">{String(index + 1).padStart(2, "0")}</p>
          <h3 className="mt-3 text-lg font-medium leading-snug">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}
