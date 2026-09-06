import { FULFILLMENT_STEPS } from "@/components/marketing/marketing-fixtures";

/**
 * The path a post-show order takes, as a numbered list on hairline rules.
 *
 * Previously an icon flow diagram. Five steps do not need five icons to be
 * understood, and the diagram read as software when the rest of the site does
 * not.
 */
export function FulfillmentSteps() {
  return (
    <ol className="grid max-w-6xl sm:grid-cols-2 lg:grid-cols-5">
      {FULFILLMENT_STEPS.map((step, index) => (
        <li key={step.title} className="border-t border-world-rule py-6 pr-8">
          <p className="mk-kicker text-world-muted">{String(index + 1).padStart(2, "0")}</p>
          <p className="mk-display mt-4 text-lg leading-tight">{step.title}</p>
        </li>
      ))}
    </ol>
  );
}
