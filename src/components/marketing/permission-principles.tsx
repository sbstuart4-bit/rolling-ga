const PRINCIPLES = [
  {
    title: "Attendance is not marketing consent.",
    body: "Verifying I was there proves the fan was in the room. It does not subscribe them to anything.",
  },
  {
    title: "Purchase is not marketing consent.",
    body: "Buying merch is a transaction. Staying connected is a separate, explicit choice.",
  },
  {
    title: "Fans choose whether to stay connected.",
    body: "After the show the fan can say yes \u2014 or not now. They can withdraw later.",
  },
  {
    title: "Relationships stay artist-scoped.",
    body: "A connection with one artist is not a connection with every artist on Rolling GA.",
  },
] as const;

/**
 * Four rules, set as a numbered editorial list on hairline rules. Consent is the
 * part a manager is most likely to be interrogated about, so it reads as terms
 * rather than as feature copy.
 */
export function PermissionPrinciples() {
  return (
    <ol className="max-w-5xl">
      {PRINCIPLES.map((item, index) => (
        <li
          key={item.title}
          className="grid gap-x-8 gap-y-3 border-t border-world-rule py-8 md:grid-cols-[4rem_1fr_1fr] md:items-baseline md:py-10"
        >
          <p className="mk-display text-2xl text-world-muted">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mk-display text-[clamp(1.125rem,2.2vw,1.75rem)] leading-tight">
            {item.title}
          </h3>
          <p className="mk-body max-w-sm text-sm leading-relaxed text-world-muted">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}
