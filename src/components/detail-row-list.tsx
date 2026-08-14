import { DETAIL_ICONS } from "@/components/detail-icons";

interface DetailRow {
  key: string;
  label: string;
  value: string;
}

// A small icon next to a bold word, optionally grouped under a serif
// heading — the same pattern reference apps like Krush use for their
// attribute rows. Used on the profile view (with a heading, since it's a
// standalone "About me" section) and the Discover card (without one, since
// it sits directly under the bio and doesn't need its own label). Pulled out
// as its own component so the treatment can be reused without copy-pasting
// the icon map and markup at every call site.
export default function DetailRowList({
  rows,
  heading,
}: {
  rows: DetailRow[];
  heading?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-5">
      {heading && <h3 className="font-serif-heading text-xl font-bold text-ink">{heading}</h3>}
      <div className={`space-y-0.5 ${heading ? "mt-3" : ""}`}>
        {rows.map((row) => {
          const Icon = DETAIL_ICONS[row.key as keyof typeof DETAIL_ICONS];
          return (
            <div key={row.key} className="flex items-center gap-3 py-2">
              {Icon ? (
                <Icon className="h-5 w-5 shrink-0 text-ink-soft" />
              ) : (
                <span className="h-5 w-5 shrink-0" />
              )}
              <span className="font-rounded text-[15px] font-bold text-ink">{row.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
